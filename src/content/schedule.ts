import type { ScheduleCategory } from "@/lib/db-types";
import { nextOccurrence, type Recurrence } from "@/lib/schedule";

import { site } from "./site";

export type ScheduleItem = {
  id: string;
  title: string;
  /** Warna & label di kalender publik. */
  category: ScheduleCategory;
  recurrence: Recurrence;
  /** HH:MM, waktu Jakarta */
  start: string;
  end?: string;
  place: string;
  mode: "onsite" | "online";
  note?: string;
  href?: string;
};

const SUNDAY = { kind: "weekly", weekday: 0 } as const;

/**
 * Dari poster Canva & Linktree ENKG. Ini jadwal BAWAAN: situs memakainya selama
 * tabel enkg_schedule belum terisi atau Supabase tidak bisa dihubungi. `id` sama
 * dengan kolom `slug` di database (lihat seed di supabase/schema.sql).
 */
export const schedule: ScheduleItem[] = [
  {
    id: "sunday-prayer",
    category: "doa",
    title: "Doa Sebelum Ibadah",
    recurrence: SUNDAY,
    start: "09:15",
    place: site.address.venue,
    mode: "onsite",
  },
  {
    id: "sunday-service",
    category: "ibadah",
    title: "Ibadah Minggu",
    recurrence: SUNDAY,
    start: "10:00",
    place: site.address.venue,
    mode: "onsite",
  },
  {
    id: "kids-church",
    category: "ibadah",
    title: "Kids Church",
    recurrence: SUNDAY,
    start: "10:30",
    place: site.address.kidsRoom,
    mode: "onsite",
  },
  {
    id: "heritage",
    category: "ibadah",
    title: "Heritage",
    recurrence: SUNDAY,
    start: "10:30",
    place: site.address.office,
    mode: "onsite",
  },
  {
    id: "wednesday-prayer",
    category: "doa",
    title: "Weekly Prayer Meeting",
    recurrence: { kind: "weekly", weekday: 3 },
    start: "20:00",
    place: "Zoom",
    mode: "online",
    note: `Meeting ID ${site.zoom.meetingId} · Passcode: ${site.zoom.passcode}`,
    href: site.zoom.url,
  },
  {
    id: "friday-prayer",
    category: "doa",
    title: "Onsite Prayer Meeting",
    recurrence: { kind: "monthly-nth", weekday: 5, nth: 4 },
    start: "18:00",
    end: "20:00",
    place: site.address.venue,
    mode: "onsite",
  },
];

export type UpcomingItem = ScheduleItem & { next: Date };

/** Semua jadwal beserta tanggal berikutnya, urut dari yang paling dekat. */
export function upcomingSchedule(now: Date): UpcomingItem[] {
  return schedule
    .map((item) => ({ ...item, next: nextOccurrence(item.recurrence, item.start, now) }))
    .sort((a, b) => a.next.getTime() - b.next.getTime());
}
