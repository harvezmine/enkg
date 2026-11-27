import type { LifeGroup } from "./db-types";

/*
 * Format tampilan portal leader & laporan Life Group. Semua jam dalam WIB.
 */

const TZ = "Asia/Jakarta";
const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

export function weekdayName(day: number | null | undefined) {
  return day === null || day === undefined ? "" : (WEEKDAYS[day] ?? "");
}

/** "19:30:00" → "19.30" */
export function formatClock(time: string | null | undefined) {
  if (!time) return "";
  const [hh, mm] = time.split(":");
  return `${hh}.${mm}`;
}

/** "Setiap Jumat · 19.30 WIB", atau "" kalau jadwal rutin belum diisi. */
export function groupScheduleLabel(group: Pick<LifeGroup, "meeting_day" | "meeting_time">) {
  const day = weekdayName(group.meeting_day);
  const time = formatClock(group.meeting_time);
  if (!day && !time) return "";
  return [day && `Setiap ${day}`, time && `${time} WIB`].filter(Boolean).join(" · ");
}

/** "Jumat, 25 September 2026" */
export function formatLongDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** "Jum, 25 Sep" untuk daftar yang rapat. */
export function formatShortDay(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", timeZone: TZ }).format(
    new Date(iso),
  );
}

/** 2_400_000 → "2,3 MB" */
export function formatBytes(bytes: number | null | undefined) {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

/** Nama file unduhan yang aman: huruf, angka, spasi, titik, tanda hubung. */
export function safeFileName(name: string | null | undefined, fallback = "materi.pdf") {
  const cleaned = (name ?? "")
    .normalize("NFKD")
    .replace(/[^\w .-]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  if (!cleaned) return fallback;
  return /\.pdf$/i.test(cleaned) ? cleaned : `${cleaned}.pdf`;
}
