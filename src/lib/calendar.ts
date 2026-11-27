import type { ScheduleItem } from "@/content/schedule";

import type { LifeGroupSegment, ScheduleCategory, ScheduleRow } from "./db-types";
import { nextOccurrence, recurrenceLabel, type Recurrence } from "./schedule";
import { isoDateWib } from "./utils";

/*
 * Logika murni kalender gereja: jadwal rutin (database atau bawaan) diurai
 * menjadi tanggal-tanggal nyata, lalu digabung dengan event gereja dan
 * pertemuan Life Group. Semua tanggal "yyyy-mm-dd" menurut kalender Jakarta,
 * semua jam "HH:MM" WIB. WIB tidak mengenal DST, jadi offset +07:00 aman.
 */

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const WEEKDAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export { WEEKDAYS, WEEKDAYS_SHORT };

/** Pola jadwal: dua pola rutin dari lib/schedule.ts, ditambah acara sekali jalan. */
export type CalendarRecurrence = Recurrence | { kind: "once"; date: string };

/** Satu jadwal kalender, entah dari tabel enkg_schedule atau jadwal bawaan. */
export type CalendarItem = Omit<ScheduleItem, "recurrence"> & {
  recurrence: CalendarRecurrence;
  /** Kunci tetap yang dirujuk kode (mis. "sunday-service"). Kosong untuk jadwal tambahan admin. */
  slug: string | null;
};

/** Jadwal yang berulang, satu-satunya jenis yang punya "berikutnya" tanpa batas. */
export type RecurringItem = CalendarItem & { recurrence: Recurrence };

export const isRecurring = (item: CalendarItem): item is RecurringItem => item.recurrence.kind !== "once";

/* ── Tanggal kalender ─────────────────────────────────────────────────────── */

function parse(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

const pad = (n: number) => String(n).padStart(2, "0");
const toYmd = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const utc = (ymd: string) => {
  const { y, m, d } = parse(ymd);
  return new Date(Date.UTC(y, m - 1, d));
};

export function addDays(ymd: string, days: number) {
  return toYmd(new Date(utc(ymd).getTime() + days * DAY_MS));
}

/** 0 = Minggu … 6 = Sabtu */
export function weekdayOf(ymd: string) {
  return utc(ymd).getUTCDay();
}

/** Hari Minggu awal pekan sebuah tanggal (pekan dimulai hari Minggu, seperti kalender di situs). */
export function weekStart(ymd: string) {
  return addDays(ymd, -weekdayOf(ymd));
}

/** "yyyy-mm-dd" yang benar-benar ada di kalender. */
export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toYmd(utc(value)) === value;
}

/** "HH:MM" yang sah (00:00 sampai 23:59). */
export function isClock(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Kolom time Postgres ("10:00:00") → "10:00". */
export function toClock(value: string | null | undefined) {
  const clock = value?.slice(0, 5) ?? "";
  return isClock(clock) ? clock : null;
}

/** Jam WIB sebuah instant: "18:00". */
export function clockWib(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/** Tanggal + jam WIB → ISO (UTC). */
export function jakartaInstant(ymd: string, clock: string) {
  return new Date(`${ymd}T${clock}:00+07:00`).toISOString();
}

export const todayInJakarta = (now: Date) => isoDateWib(now.toISOString());

/** "10:00" → "10.00", gaya penulisan jam di Indonesia. */
export const dotClock = (clock: string) => clock.replace(":", ".");

/** "Minggu, 29 November" */
export function formatDayLong(ymd: string) {
  const { m, d } = parse(ymd);
  return `${WEEKDAYS[weekdayOf(ymd)]}, ${d} ${MONTHS[m - 1]}`;
}

/** "Rab, 2 Des" */
export function formatDayShort(ymd: string) {
  const { m, d } = parse(ymd);
  return `${WEEKDAYS_SHORT[weekdayOf(ymd)]}, ${d} ${MONTHS[m - 1]!.slice(0, 3)}`;
}

/** "29 November 2026" */
export function formatDateFull(ymd: string) {
  const { y, m, d } = parse(ymd);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "November 2026" */
export function formatMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export const monthOf = (ymd: string) => ymd.slice(0, 7);

/** "2026-11" + 1 → "2026-12" */
export function addMonths(ym: string, months: number) {
  const [y, m] = ym.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, 1));
  return toYmd(date).slice(0, 7);
}

export function lastDayOfMonth(ym: string) {
  return addDays(`${addMonths(ym, 1)}-01`, -1);
}

/**
 * Kotak-kotak satu bulan, minggu dimulai hari Minggu seperti kalender dinding
 * Indonesia (dan hari Minggu memang hari ibadah). `null` = sel kosong.
 */
export function monthGrid(ym: string): (string | null)[][] {
  const first = `${ym}-01`;
  const days = parse(lastDayOfMonth(ym)).d;
  const cells: (string | null)[] = Array.from({ length: weekdayOf(first) }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ── Pola jadwal ──────────────────────────────────────────────────────────── */

/** Minggu ke-berapa sebuah tanggal dalam bulannya: tanggal 1-7 = ke-1, dst. */
export const nthOfMonth = (ymd: string) => Math.ceil(parse(ymd).d / 7);

export function occursOn(rec: CalendarRecurrence, ymd: string) {
  switch (rec.kind) {
    case "once":
      return rec.date === ymd;
    case "weekly":
      return weekdayOf(ymd) === rec.weekday;
    case "monthly-nth":
      return weekdayOf(ymd) === rec.weekday && nthOfMonth(ymd) === rec.nth;
  }
}

/** "Setiap Minggu", "Jumat ke-4 setiap bulan", "Sekali, 24 Desember 2026" */
export function recurrenceText(rec: CalendarRecurrence) {
  return rec.kind === "once" ? `Sekali, ${formatDateFull(rec.date)}` : recurrenceLabel(rec);
}

/** Jadwal berikutnya yang belum dimulai, atau null untuk acara sekali yang sudah lewat. */
export function nextItemOccurrence(item: CalendarItem, now: Date): Date | null {
  const rec = item.recurrence;
  if (rec.kind !== "once") return nextOccurrence(rec, item.start, now);
  const at = new Date(jakartaInstant(rec.date, item.start));
  return at.getTime() > now.getTime() ? at : null;
}

/* ── Baris database & jadwal bawaan → CalendarItem ───────────────────────── */

/** Baris enkg_schedule → CalendarItem. Baris yang polanya tidak lengkap dibuang (null). */
export function rowToItem(row: ScheduleRow): CalendarItem | null {
  const start = toClock(row.start_time);
  if (!start) return null;

  let recurrence: CalendarRecurrence;
  if (row.recurrence === "once") {
    if (!row.on_date || !isCalendarDate(row.on_date)) return null;
    recurrence = { kind: "once", date: row.on_date };
  } else {
    if (row.weekday === null || row.weekday < 0 || row.weekday > 6) return null;
    if (row.recurrence === "monthly_nth") {
      if (!row.nth || row.nth < 1 || row.nth > 5) return null;
      recurrence = { kind: "monthly-nth", weekday: row.weekday, nth: row.nth };
    } else {
      recurrence = { kind: "weekly", weekday: row.weekday };
    }
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    recurrence,
    start,
    end: toClock(row.end_time) ?? undefined,
    place: row.place ?? (row.mode === "online" ? "Online" : ""),
    mode: row.mode,
    note: row.note ?? undefined,
    href: row.link_url ?? undefined,
  };
}

export const fromStatic = (item: ScheduleItem): CalendarItem => ({ ...item, slug: item.id });

/** Jadwal rutin dengan slug tertentu, atau jadwal bawaan bila tidak ada / bukan jadwal rutin. */
export function recurringBySlug(items: CalendarItem[], slug: string, fallback: ScheduleItem[]): RecurringItem | null {
  const found = items.find((item) => item.slug === slug);
  if (found && isRecurring(found)) return found;
  const original = fallback.find((item) => item.id === slug);
  return original ? (fromStatic(original) as RecurringItem) : null;
}

/* ── Kejadian di kalender ─────────────────────────────────────────────────── */

/** Event gereja tampil dengan warnanya sendiri, terpisah dari empat kategori jadwal. */
export type CalendarCategory = ScheduleCategory | "acara";

export const CATEGORY_LABEL: Record<CalendarCategory, string> = {
  ibadah: "Ibadah",
  doa: "Doa",
  life_group: "Life Group",
  acara: "Acara gereja",
  lainnya: "Lainnya",
};

/** Urutan tampil kategori di legenda dan saat dua kejadian mulai di jam yang sama. */
export const CATEGORY_ORDER: CalendarCategory[] = ["ibadah", "doa", "life_group", "acara", "lainnya"];

export type Occurrence = {
  key: string;
  kind: "schedule" | "event" | "life_group";
  category: CalendarCategory;
  title: string;
  /** "yyyy-mm-dd" Jakarta */
  date: string;
  /** "HH:MM" WIB */
  start: string;
  end?: string;
  place?: string;
  mode?: "onsite" | "online";
  href?: string;
  hrefLabel?: string;
  note?: string;
  /** ISO, untuk pengurutan dan <time dateTime>. */
  startsAt: string;
};

/** Semua kejadian jadwal dalam rentang [from, to], kedua ujung ikut. */
export function expandItems(items: CalendarItem[], from: string, to: string): Occurrence[] {
  const result: Occurrence[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    for (const item of items) {
      if (!occursOn(item.recurrence, date)) continue;
      result.push({
        key: `${item.id}:${date}`,
        kind: "schedule",
        category: item.category,
        title: item.title,
        date,
        start: item.start,
        end: item.end,
        place: item.place || undefined,
        mode: item.mode,
        href: item.href,
        hrefLabel: item.href ? (item.mode === "online" ? "Buka Zoom" : "Buka tautan") : undefined,
        note: item.note,
        startsAt: jakartaInstant(date, item.start),
      });
    }
  }
  return result;
}

export type CalendarEventInput = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
};

export function eventToOccurrence(event: CalendarEventInput): Occurrence {
  const date = isoDateWib(event.starts_at);
  const sameDayEnd = event.ends_at && isoDateWib(event.ends_at) === date ? clockWib(event.ends_at) : undefined;
  return {
    key: `event:${event.id}`,
    kind: "event",
    category: "acara",
    title: event.title,
    date,
    start: clockWib(event.starts_at),
    end: sameDayEnd,
    place: event.location ?? undefined,
    mode: "onsite",
    href: `/event/${event.slug}`,
    hrefLabel: "Lihat detail",
    startsAt: new Date(event.starts_at).toISOString(),
  };
}

/** Anchor form Gabung Life Group, sekalian memilih kelompoknya bila diketahui. */
const JOIN_ANCHOR: Record<LifeGroupSegment, string> = {
  family: "#gabung-family",
  young_professional: "#gabung-young-professional",
  youth: "#gabung-youth",
};

export const joinAnchor = (segment: LifeGroupSegment | null) => (segment ? JOIN_ANCHOR[segment] : "#gabung-life-group");

/** "YP Sunter" → "Life Group YP Sunter"; nama yang sudah diawali "Life Group"/"LG" dibiarkan. */
export const lgTitle = (name: string) => (/^(life\s*group|lg)\b/i.test(name) ? name : `Life Group ${name}`);

/**
 * Life Group yang AMAN untuk publik: nama, kelompok, wilayah, dan jadwal
 * rutinnya. Kolom `location` (bisa alamat rumah) tidak pernah masuk ke sini.
 */
export type PublicLifeGroup = {
  id: string;
  name: string;
  segment: LifeGroupSegment | null;
  area: string | null;
  /** 0 = Minggu … 6 = Sabtu, null bila belum punya hari tetap. */
  meeting_day: number | null;
  /** "19:30:00" dari kolom time Postgres. */
  meeting_time: string | null;
};

/**
 * Bentuk pertemuan Life Group yang AMAN untuk publik: nama grup, jam, dan
 * wilayahnya saja. Tempat, topik, dan laporan pertemuan tidak pernah masuk ke sini.
 */
export type PublicLgMeeting = {
  id: string;
  starts_at: string;
  name: string;
  segment: LifeGroupSegment | null;
  area: string | null;
  /** Grup pemilik pertemuan, untuk menggantikan jadwal rutinnya di pekan yang sama. */
  groupId?: string;
};

/** Hari & jam rutin sebuah grup, atau null kalau belum tetap. */
export function lifeGroupRoutine(group: Pick<PublicLifeGroup, "meeting_day" | "meeting_time">) {
  const clock = toClock(group.meeting_time);
  if (group.meeting_day === null || group.meeting_day < 0 || group.meeting_day > 6 || !clock) return null;
  return { weekday: group.meeting_day, start: clock };
}

/** "Setiap Jumat · 19.30" atau "Jadwal menyesuaikan". */
export function lifeGroupRoutineText(group: Pick<PublicLifeGroup, "meeting_day" | "meeting_time">) {
  const routine = lifeGroupRoutine(group);
  return routine ? `Setiap ${WEEKDAYS[routine.weekday]} · ${dotClock(routine.start)}` : "Jadwal menyesuaikan";
}

export function lgMeetingToOccurrence(meeting: PublicLgMeeting, note?: string): Occurrence {
  return {
    key: `lg:${meeting.id}`,
    kind: "life_group",
    category: "life_group",
    title: lgTitle(meeting.name),
    date: isoDateWib(meeting.starts_at),
    start: clockWib(meeting.starts_at),
    place: meeting.area ?? undefined,
    mode: "onsite",
    href: joinAnchor(meeting.segment),
    hrefLabel: "Mau ikut? Daftar dulu",
    note,
    startsAt: new Date(meeting.starts_at).toISOString(),
  };
}

/**
 * Semua pertemuan Life Group dalam rentang [from, to]:
 *  - pertemuan yang dijadwalkan leader selalu tampil;
 *  - grup yang punya hari & jam rutin tampil tiap pekan di hari itu, KECUALI
 *    pekan (Minggu sampai Sabtu) yang sudah punya pertemuan terjadwal dari
 *    leader: jadwal leader menggantikan jadwal rutin pekan itu.
 */
export function lifeGroupOccurrences(
  groups: PublicLifeGroup[],
  meetings: PublicLgMeeting[],
  from: string,
  to: string,
): Occurrence[] {
  const scheduledWeeks = new Set(
    meetings.filter((meeting) => meeting.groupId).map((meeting) => `${meeting.groupId}:${weekStart(isoDateWib(meeting.starts_at))}`),
  );
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const result: Occurrence[] = [];

  for (const meeting of meetings) {
    const date = isoDateWib(meeting.starts_at);
    if (date < from || date > to) continue;
    // Kalau pertemuan ini bergeser dari jadwal rutinnya, beri tahu pengunjung.
    const routine = meeting.groupId ? lifeGroupRoutine(groupById.get(meeting.groupId) ?? { meeting_day: null, meeting_time: null }) : null;
    const moved = routine && (weekdayOf(date) !== routine.weekday || clockWib(meeting.starts_at) !== routine.start);
    result.push(
      lgMeetingToOccurrence(
        meeting,
        moved ? `Pekan ini bergeser dari jadwal biasanya (${WEEKDAYS[routine.weekday]} ${dotClock(routine.start)}).` : undefined,
      ),
    );
  }

  for (const group of groups) {
    const routine = lifeGroupRoutine(group);
    if (!routine) continue;
    // Hari pertama di rentang yang jatuh pada hari rutin grup ini, lalu tiap 7 hari.
    for (let date = addDays(from, (routine.weekday - weekdayOf(from) + 7) % 7); date <= to; date = addDays(date, 7)) {
      if (scheduledWeeks.has(`${group.id}:${weekStart(date)}`)) continue;
      result.push({
        key: `lgr:${group.id}:${date}`,
        kind: "life_group",
        category: "life_group",
        title: lgTitle(group.name),
        date,
        start: routine.start,
        place: group.area ?? undefined,
        mode: "onsite",
        href: joinAnchor(group.segment),
        hrefLabel: "Mau ikut? Daftar dulu",
        startsAt: jakartaInstant(date, routine.start),
      });
    }
  }
  return result;
}

/** Urutan tampil daftar Life Group publik: hari (Minggu dulu), jam, lalu nama. */
export function sortLifeGroups<T extends PublicLifeGroup>(groups: T[]): T[] {
  const rank = (group: T) => {
    const routine = lifeGroupRoutine(group);
    return routine ? `${routine.weekday}${routine.start}` : "9";
  };
  return [...groups].sort((a, b) => rank(a).localeCompare(rank(b)) || a.name.localeCompare(b.name, "id"));
}

export function sortOccurrences(list: Occurrence[]) {
  return [...list].sort(
    (a, b) =>
      a.startsAt.localeCompare(b.startsAt) ||
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      a.title.localeCompare(b.title, "id"),
  );
}

/* ── Ritme mingguan (ringkasan jadwal rutin) ─────────────────────────────── */

export type RhythmGroup = { label: string; next: Date; items: (RecurringItem & { next: Date })[] };

/**
 * Jadwal rutin dikelompokkan per pola ("Setiap Minggu", "Setiap Rabu",
 * "Jumat ke-4 setiap bulan"). Kelompok hari Minggu selalu pertama, sisanya
 * urut hari, dan isi tiap kelompok urut jam.
 */
export function rhythmGroups(items: CalendarItem[], now: Date): RhythmGroup[] {
  const recurring = items.filter(isRecurring).map((item) => ({ ...item, next: nextOccurrence(item.recurrence, item.start, now) }));
  const rank = (rec: Recurrence) => rec.weekday * 10 + (rec.kind === "monthly-nth" ? rec.nth : 0);

  const labels = [...new Set(recurring.sort((a, b) => rank(a.recurrence) - rank(b.recurrence)).map((item) => recurrenceLabel(item.recurrence)))];
  return labels.map((label) => {
    const groupItems = recurring
      .filter((item) => recurrenceLabel(item.recurrence) === label)
      .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title, "id"));
    const next = groupItems.reduce((soonest, item) => (item.next < soonest ? item.next : soonest), groupItems[0]!.next);
    return { label, next, items: groupItems };
  });
}

/**
 * Jadwal bawaan yang jamnya juga dipakai bagian lain halaman utama. Ditampilkan
 * di admin supaya pengurus tahu akibatnya sebelum mengubah atau menghapus.
 */
export const SLUG_USAGE: Record<string, string> = {
  "sunday-service": "Jam Ibadah Minggu di Hero, Pelayanan, dan footer",
  "sunday-prayer": "Jam doa bersama di kartu Ibadah Minggu",
  "kids-church": "Jam di kartu Kids Church",
  heritage: "Jam di kartu Heritage",
  "wednesday-prayer": "Jadwal di kartu Prayer Meeting",
  "friday-prayer": "Kartu Onsite Prayer Meeting di News",
};
