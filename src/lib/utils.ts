/** Gabung className, buang yang falsy. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const TZ = "Asia/Jakarta";

/** "25 September 2026" */
export function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(
    new Date(iso),
  );
}

/** "25 Sep 2026" */
export function formatDateShort(iso: string | null | undefined) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(
    new Date(iso),
  );
}

/** "18.00 WIB" */
export function formatTime(iso: string | null | undefined) {
  if (!iso) return "";
  const time = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(
    new Date(iso),
  );
  return `${time} WIB`;
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

/** ISO → "yyyy-mm-dd" menurut tanggal di Jakarta (bukan tanggal UTC). */
export function isoDateWib(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ }).format(
    new Date(iso),
  );
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** ISO → nilai <input type="datetime-local"> dalam WIB, sama di server maupun browser. */
export function toWibInput(iso: string | null | undefined) {
  if (!iso) return "";
  // Locale sv-SE memformat tanggal sebagai "YYYY-MM-DD HH:MM".
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TZ,
  })
    .format(new Date(iso))
    .replace(" ", "T");
}

/**
 * Nilai <input type="datetime-local"> (tanpa zona waktu) → ISO, dibaca sebagai WIB.
 * Tanpa ini `new Date()` memakai zona waktu server: di server ber-UTC, acara jam
 * 18.00 tersimpan sebagai 01.00 WIB keesokan harinya. WIB tidak mengenal DST.
 */
export function fromWibInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
