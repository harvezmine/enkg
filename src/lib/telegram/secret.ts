import { timingSafeEqual } from "node:crypto";

/** Bandingkan rahasia tanpa membocorkan posisi karakter yang berbeda lewat waktu. */
export function secretMatches(given: string | null | undefined, expected: string | null | undefined) {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Header "Authorization: Bearer <CRON_SECRET>". Secret di bawah 16 karakter dianggap belum diisi. */
export function bearerMatches(header: string | null | undefined, secret: string | null | undefined) {
  if (!secret || secret.length < 16) return false;
  const match = /^Bearer\s+(.+)$/i.exec(header?.trim() ?? "");
  return secretMatches(match?.[1], secret);
}
