import { fromWibInput } from "../utils";

/* Bantuan murni untuk alat asisten: cocok nama dan baca tanggal WIB. */

export const fold = (value: string) =>
  value
    .toLocaleLowerCase("id")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Cocokkan nama (lengkap atau panggilan). Kecocokan persis didahulukan. */
export function matchByName<T>(rows: T[], query: string, names: (row: T) => (string | null | undefined)[]) {
  const q = fold(query);
  if (!q) return [];
  const exact = rows.filter((row) => names(row).some((name) => name && fold(name) === q));
  if (exact.length) return exact;
  const words = q.split(" ");
  return rows.filter((row) => {
    const hay = fold(names(row).filter(Boolean).join(" "));
    return words.every((word) => hay.includes(word));
  });
}

/** "2026-12-20 16:00" / "2026-12-20T16.00" → ISO (dibaca sebagai WIB), atau null. */
export function parseWib(value: string) {
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2})[:.](\d{2})$/);
  if (!match) return null;
  return fromWibInput(`${match[1]}T${match[2]!.padStart(2, "0")}:${match[3]}`);
}
