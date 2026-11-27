/**
 * Sesi login (email + password) untuk admin panel dan portal Life Group.
 *
 * Satu cookie untuk semua peran. Token: `<accountId>.<sidikJariPassword>.<exp>.<tandaTangan>`.
 * Sidik jari berubah setiap password diganti atau di-reset, jadi sesi lama gugur.
 * Kunci HMAC diturunkan dari SUPABASE_SERVICE_ROLE_KEY: token tidak bisa
 * dipalsukan tanpa kunci server.
 *
 * Hanya memakai Web Crypto supaya bisa dicek di middleware (edge). Middleware
 * cuma memeriksa tanda tangan & kedaluwarsa; akun aktif, peran admin/leader,
 * dan sidik jari dicek ulang ke database di lib/auth.ts pada setiap request.
 */

export const SESSION_COOKIE = "enkg_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 hari, dalam detik

const encoder = new TextEncoder();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FINGERPRINT = /^[0-9a-f]{16,64}$/;

export function isAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function base64url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`enkg-session-v2|${process.env.SUPABASE_SERVICE_ROLE_KEY}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`session:${message}`))));
}

/** Bandingkan dua string tanpa membocorkan posisi karakter yang berbeda lewat waktu. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type SessionToken = { accountId: string; fingerprint: string; exp: number };

export async function createSessionToken(accountId: string, fingerprint: string, now = Date.now()) {
  if (!isAuthConfigured()) throw new Error("Login belum dikonfigurasi");
  if (!UUID.test(accountId) || !FINGERPRINT.test(fingerprint)) throw new Error("Data sesi tidak valid");
  const exp = Math.floor(now / 1000) + SESSION_MAX_AGE;
  const body = `${accountId}.${fingerprint}.${exp}`;
  return `${body}.${await sign(body)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<SessionToken | null> {
  if (!token || !isAuthConfigured()) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [accountId, fingerprint, exp, sig] = parts as [string, string, string, string];
  if (!UUID.test(accountId) || !FINGERPRINT.test(fingerprint) || !/^\d{1,12}$/.test(exp) || !sig) return null;
  if (Number(exp) * 1000 < now) return null;
  if (!safeEqual(sig, await sign(`${accountId}.${fingerprint}.${exp}`))) return null;
  return { accountId, fingerprint, exp: Number(exp) };
}

/** Kode untuk membuat admin pertama: ADMIN_PASSWORD di server (minimal 12 karakter). */
export async function checkSetupCode(input: string) {
  const code = process.env.ADMIN_PASSWORD ?? "";
  if (code.length < 12) return false;
  // Yang dibandingkan tanda tangannya, jadi panjang kode asli pun tidak bocor.
  const [given, expected] = await Promise.all([sign(`setup:${input}`), sign(`setup:${code}`)]);
  return safeEqual(given, expected);
}
