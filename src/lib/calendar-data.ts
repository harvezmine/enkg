import "server-only";

import { schedule as staticSchedule } from "@/content/schedule";

import {
  addDays,
  addMonths,
  eventToOccurrence,
  expandItems,
  fromStatic,
  lastDayOfMonth,
  lifeGroupOccurrences,
  monthOf,
  rowToItem,
  sortLifeGroups,
  sortOccurrences,
  todayInJakarta,
  weekStart,
  type CalendarEventInput,
  type CalendarItem,
  type Occurrence,
  type PublicLgMeeting,
  type PublicLifeGroup,
} from "./calendar";
import { TABLES, type LifeGroupSegment, type ScheduleRow } from "./db-types";
import { isSupabaseConfigured } from "./queries";
import { createAdminClient } from "./supabase/admin";
import { createPublicClient } from "./supabase/public";

/**
 * Data kalender untuk situs publik.
 *
 * Jadwal rutin dibaca dengan anon key (RLS hanya membuka baris yang
 * `published`). Jadwal bawaan (content/schedule.ts) dipakai bila Supabase belum
 * dikonfigurasi, query gagal, atau tabelnya masih kosong, supaya Hero dan
 * Pelayanan tidak pernah tampil tanpa jam ibadah.
 */

export type ScheduleSource = { items: CalendarItem[]; fromDatabase: boolean };

const fallback = (): ScheduleSource => ({ items: staticSchedule.map(fromStatic), fromDatabase: false });

export async function getSchedule(): Promise<ScheduleSource> {
  if (!isSupabaseConfigured()) return fallback();
  try {
    const { data, error } = await createPublicClient()
      .from(TABLES.schedule)
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .order("start_time");
    if (error) throw error;
    const items = (data as ScheduleRow[]).map(rowToItem).filter((item): item is CalendarItem => item !== null);
    return items.length ? { items, fromDatabase: true } : fallback();
  } catch (error) {
    console.error("[calendar] getSchedule gagal:", error);
    return fallback();
  }
}

/** Event gereja terbit yang bertanggal di dalam rentang. Data publik, jadi lewat anon key. */
async function getEvents(fromIso: string, toIso: string): Promise<Occurrence[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createPublicClient()
      .from(TABLES.events)
      .select("id, slug, title, starts_at, ends_at, location")
      .eq("published", true)
      .eq("category", "gereja")
      .gte("starts_at", fromIso)
      .lt("starts_at", toIso)
      .order("starts_at");
    if (error) throw error;
    return (data as CalendarEventInput[]).map(eventToOccurrence);
  } catch (error) {
    console.error("[calendar] event gagal:", error);
    return [];
  }
}

/*
 * Life Group di kalender publik.
 *
 * Tabel Life Group dan pertemuannya tidak punya policy anon (ada alamat rumah,
 * laporan, dan daftar hadir), jadi dibaca dengan service role DI SERVER dan
 * kolomnya sengaja dibatasi. `location`, `place`, `topic`, `report`,
 * `prayer_requests`, dan `attendee_ids` tidak pernah diminta.
 */
const canReadLifeGroups = () => isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Grup aktif yang memilih tampil di kalender publik. */
async function getPublicLifeGroups(): Promise<PublicLifeGroup[]> {
  if (!canReadLifeGroups()) return [];
  try {
    const { data, error } = await createAdminClient()
      .from(TABLES.lifeGroups)
      .select("id, name, segment, area, meeting_day, meeting_time")
      .eq("show_on_calendar", true)
      .eq("is_active", true)
      .order("name")
      .limit(200);
    if (error) throw error;
    return sortLifeGroups(data as PublicLifeGroup[]);
  } catch (error) {
    console.error("[calendar] Life Group gagal:", error);
    return [];
  }
}

type MeetingRow = {
  id: string;
  life_group_id: string;
  starts_at: string;
  enkg_life_groups: { name: string; segment: LifeGroupSegment | null; area: string | null } | null;
};

/** Pertemuan yang dijadwalkan leader, hanya dari grup yang tampil di kalender publik. */
async function getPublicLgMeetings(fromIso: string, toIso: string): Promise<PublicLgMeeting[]> {
  if (!canReadLifeGroups()) return [];
  try {
    const { data, error } = await createAdminClient()
      .from(TABLES.lgMeetings)
      .select("id, life_group_id, starts_at, enkg_life_groups!inner(name, segment, area)")
      .eq("enkg_life_groups.show_on_calendar", true)
      .eq("enkg_life_groups.is_active", true)
      .gte("starts_at", fromIso)
      .lt("starts_at", toIso)
      .order("starts_at")
      .limit(500);
    if (error) throw error;
    return (data as unknown as MeetingRow[]).flatMap((row) => {
      const group = row.enkg_life_groups;
      return group
        ? [{ id: row.id, groupId: row.life_group_id, starts_at: row.starts_at, name: group.name, segment: group.segment, area: group.area }]
        : [];
    });
  } catch (error) {
    console.error("[calendar] pertemuan Life Group gagal:", error);
    return [];
  }
}

/** Berapa bulan yang bisa dibuka di kalender publik, mulai bulan ini. */
export const CALENDAR_MONTHS = 3;

export type CalendarWindow = {
  today: string;
  months: string[];
  /**
   * Semua kejadian, urut waktu. Untuk ringkasan teks (mis. bot): `title`,
   * `category`, `date`, `start`, dan `place` (tempat untuk jadwal gereja,
   * wilayah untuk Life Group).
   */
  occurrences: Occurrence[];
  /** Life Group yang tampil di kalender publik, urut hari lalu jam. */
  lifeGroups: PublicLifeGroup[];
};

/**
 * Semua kejadian dari awal bulan ini sampai akhir bulan ke-3: jadwal rutin,
 * event gereja, dan Life Group (jadwal rutin tiap grup, digantikan pertemuan
 * dari leader di pekan yang sama). Yang sudah lewat bulan ini tetap ikut
 * supaya kalender bulan berjalan utuh.
 */
export async function getCalendarWindow(items: CalendarItem[], now: Date): Promise<CalendarWindow> {
  const today = todayInJakarta(now);
  const first = monthOf(today);
  const months = Array.from({ length: CALENDAR_MONTHS }, (_, index) => addMonths(first, index));
  const from = `${first}-01`;
  const to = lastDayOfMonth(months.at(-1)!);
  const instant = (ymd: string) => new Date(`${ymd}T00:00:00+07:00`).toISOString();
  const toIso = instant(addDays(to, 1));

  // Pertemuan diambil mulai hari Minggu pekan pertama, supaya pertemuan di akhir
  // bulan lalu tetap menggantikan jadwal rutin di pekan yang sama.
  const [events, lifeGroups, meetings] = await Promise.all([
    getEvents(instant(from), toIso),
    getPublicLifeGroups(),
    getPublicLgMeetings(instant(weekStart(from)), toIso),
  ]);

  return {
    today,
    months,
    occurrences: sortOccurrences([...expandItems(items, from, to), ...events, ...lifeGroupOccurrences(lifeGroups, meetings, from, to)]),
    lifeGroups,
  };
}
