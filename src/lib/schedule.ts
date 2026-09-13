/** Jakarta = UTC+7 sepanjang tahun (tanpa DST), jadi offset tetap aman dipakai. */
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** weekday: 0 = Minggu … 6 = Sabtu. nth: minggu ke-berapa dalam bulan (1–5). */
export type Recurrence =
  | { kind: "weekly"; weekday: number }
  | { kind: "monthly-nth"; weekday: number; nth: number };

/**
 * Jadwal berikutnya yang BELUM dimulai, dihitung dalam waktu Jakarta
 * berapa pun zona waktu server.
 */
export function nextOccurrence(rec: Recurrence, startTime: string, now: Date): Date {
  const [hh, mm] = startTime.split(":").map(Number);
  const local = new Date(now.getTime() + JAKARTA_OFFSET_MS);
  const today = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());

  for (let i = 0; i <= 62; i++) {
    const day = new Date(today + i * DAY_MS);
    if (day.getUTCDay() !== rec.weekday) continue;
    if (rec.kind === "monthly-nth" && Math.ceil(day.getUTCDate() / 7) !== rec.nth) continue;

    const start = new Date(
      Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hh, mm) - JAKARTA_OFFSET_MS,
    );
    if (start.getTime() > now.getTime()) return start;
  }
  throw new Error("Tidak ada jadwal dalam 62 hari ke depan");
}

export function recurrenceLabel(rec: Recurrence): string {
  const day = WEEKDAYS[rec.weekday];
  return rec.kind === "weekly" ? `Setiap ${day}` : `${day} ke-${rec.nth} setiap bulan`;
}

/** "Jumat, 25 September" */
export function formatJakartaDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** "18.00 WIB" */
export function formatJakartaTime(date: Date): string {
  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${time} WIB`;
}
