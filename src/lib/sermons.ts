const MONTHS: Record<string, number> = {
  januari: 1, january: 1, februari: 2, february: 2, maret: 3, march: 3, april: 4,
  mei: 5, may: 5, juni: 6, june: 6, juli: 7, july: 7, agustus: 8, august: 8,
  september: 9, oktober: 10, october: 10, november: 11, desember: 12, december: 12,
};

export type ParsedTitle =
  | { kind: "sermon"; title: string; speaker: string; day: number; month: number }
  | { kind: "video"; title: string };

const tidy = (s: string) => s.replace(/\s+/g, " ").replace(/\s+([?!.,])/g, "$1").trim();

function titleCaseIfShouting(s: string) {
  if (s !== s.toUpperCase() || !/[A-Z]/.test(s)) return s;
  return s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

/**
 * Judul rekaman di channel YouTube ENKG ditulis manual dan formatnya tidak
 * seragam, misalnya:
 *   (Live Recording)   6 September  " The End  " ~ Ps. Raswan Gautama
 *   Live Recording) 1 Februari  '' Ketika Tuhan Berkata!  '' ~ Ps Raswan Gautama
 * Pola yang selalu ada: "<tanggal> <bulan> <judul> ~ <pembicara>". Judul yang
 * tidak cocok dianggap video biasa (bukan khotbah).
 */
export function parseSermonTitle(raw: string): ParsedTitle {
  const cleaned = raw.replace(/^\s*\(?\s*live recording\s*\)\s*/i, "");
  const tilde = cleaned.lastIndexOf("~");
  const head = tilde === -1 ? cleaned : cleaned.slice(0, tilde);
  const match = head.match(/^\s*(\d{1,2})\s+([A-Za-z]+)\s+(.+)$/);
  const month = match ? MONTHS[match[2].toLowerCase()] : undefined;
  if (tilde === -1 || !match || !month) return { kind: "video", title: tidy(raw) };

  const title = titleCaseIfShouting(tidy(match[3].replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "")));
  const speaker = tidy(cleaned.slice(tilde + 1)).replace(/\b(Ps|Bp)\.?\s+/g, "$1. ");
  return { kind: "sermon", title, speaker, day: Number(match[1]), month };
}

/** Tahun diambil dari tanggal unggah; mundur setahun kalau khotbah Desember diunggah Januari. */
export function sermonDate(day: number, month: number, publishDate: string): string {
  const [publishYear, publishMonth] = publishDate.split("-").map(Number);
  const year = month > publishMonth ? publishYear - 1 : publishYear;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
