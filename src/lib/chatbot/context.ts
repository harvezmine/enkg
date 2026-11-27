import "server-only";

import { LIFE_GROUP_SEGMENT_LABEL } from "@/lib/db-types";
import {
  addDays,
  dotClock,
  formatDateFull,
  formatDayLong,
  lifeGroupRoutine,
  lifeGroupRoutineText,
  recurrenceText,
  todayInJakarta,
} from "@/lib/calendar";
import { getCalendarWindow, getSchedule } from "@/lib/calendar-data";
import { getProconEvents } from "@/lib/queries";

import { clean, type ChatKnowledge } from "./knowledge";

/*
 * Mengumpulkan informasi PUBLIK untuk chatbot: jadwal (tabel enkg_schedule
 * lewat anon key, atau jadwal bawaan), kalender publik, Life Group yang punya
 * jadwal tetap, judul acara gereja, dan ProCon. Tidak ada query ke data
 * jemaat, akun, pertemuan, atau kiriman form.
 *
 * Disimpan 5 menit di memori proses supaya tiap pesan tidak memukul database.
 */

const TTL_MS = 5 * 60 * 1000;
const UPCOMING_DAYS = 14;
let cache: { at: number; today: string; value: ChatKnowledge } | null = null;

export async function getChatKnowledge(now = new Date()): Promise<ChatKnowledge> {
  const today = todayInJakarta(now);
  if (cache && cache.today === today && now.getTime() - cache.at < TTL_MS) return cache.value;

  const { items } = await getSchedule();
  const [window, procon] = await Promise.all([getCalendarWindow(items, now), getProconEvents()]);
  const until = addDays(today, UPCOMING_DAYS);
  const coming = window.occurrences.filter((o) => o.date >= today && o.date <= until);

  const value: ChatKnowledge = {
    today: `${formatDayLong(today)} ${today.slice(0, 4)}`,
    schedule: items
      .filter((item) => item.recurrence.kind !== "once" || item.recurrence.date >= today)
      .map((item) => ({
        title: clean(item.title, 80),
        when: recurrenceText(item.recurrence),
        start: dotClock(item.start),
        end: item.end ? dotClock(item.end) : undefined,
        place: clean(item.place, 80) || undefined,
        online: item.mode === "online",
        link: item.href || undefined,
        note: clean(item.note, 160) || undefined,
      })),
    upcoming: coming.slice(0, 40).map((o) => ({
      day: formatDayLong(o.date),
      start: dotClock(o.start),
      title: clean(o.title, 80),
      place: clean(o.place, 80) || undefined,
    })),
    // Hanya grup yang sudah punya hari & jam tetap; wilayah saja, tanpa alamat.
    lifeGroups: window.lifeGroups
      .filter((group) => lifeGroupRoutine(group))
      .slice(0, 30)
      .map((group) => ({
        name: clean(group.name, 60),
        segment: group.segment ? LIFE_GROUP_SEGMENT_LABEL[group.segment] : null,
        routine: lifeGroupRoutineText(group),
        area: clean(group.area, 60) || null,
      })),
    events: coming
      .filter((o) => o.kind === "event")
      .slice(0, 10)
      .map((o) => ({ title: clean(o.title, 100), when: `${formatDayLong(o.date)}, ${dotClock(o.start)} WIB`, place: clean(o.place, 80) || undefined })),
    procon: procon.slice(0, 6).map((event) => ({
      title: clean(event.title, 100),
      when: event.date ? formatDateFull(event.date) : "Segera hadir",
      topic: clean(event.topic, 60) || undefined,
      summary: clean(event.summary, 160) || undefined,
    })),
  };

  cache = { at: now.getTime(), today, value };
  return value;
}
