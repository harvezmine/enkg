/**
 * Sesi portal leader Life Group.
 *
 * Terpisah total dari sesi admin (lib/admin-session.ts):
 *  - cookie lain (`enkg_leader`), format token lain (4 bagian, admin 2 bagian);
 *  - kunci HMAC diturunkan dengan label lain, jadi tanda tangan sesi leader
 *    tidak pernah sah sebagai sesi admin, begitu juga sebaliknya.
 *
 * Token: `<accountId>.<sidikJariPassword>.<exp>.<tandaTangan>`. Sidik jari
 * berubah setiap password diganti atau di-reset, sehingga sesi lama gugur.
 *
 * Hanya memakai Web Crypto supaya bisa dicek di middleware (edge). Middleware
 * cuma memeriksa tanda tangan & kedaluwarsa; akun aktif, peran leader, dan
 * sidik jari dicek ulang ke database di lib/leader-auth.ts pada setiap request.
 */

export const LEADER_COOKIE = "enkg_leader";
export const LEADER_SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 hari, dalam detik

const encoder = new TextEncoder();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FINGERPRINT = /^[0-9a-f]{16,64}$/;

export function isLeaderPortalConfigured() {
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
    encoder.encode(`enkg-leader-portal-v1|${process.env.SUPABASE_SERVICE_ROLE_KEY}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`leader:${message}`))));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type LeaderToken = { accountId: string; fingerprint: string; exp: number };

export async function createLeaderToken(accountId: string, fingerprint: string, now = Date.now()) {
  if (!isLeaderPortalConfigured()) throw new Error("Portal leader belum dikonfigurasi");
  if (!UUID.test(accountId) || !FINGERPRINT.test(fingerprint)) throw new Error("Data sesi tidak valid");
  const exp = Math.floor(now / 1000) + LEADER_SESSION_MAX_AGE;
  const body = `${accountId}.${fingerprint}.${exp}`;
  return `${body}.${await sign(body)}`;
}

export async function verifyLeaderToken(token: string | undefined, now = Date.now()): Promise<LeaderToken | null> {
  if (!token || !isLeaderPortalConfigured()) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [accountId, fingerprint, exp, sig] = parts as [string, string, string, string];
  if (!UUID.test(accountId) || !FINGERPRINT.test(fingerprint) || !/^\d{1,12}$/.test(exp) || !sig) return null;
  if (Number(exp) * 1000 < now) return null;

  if (!safeEqual(sig, await sign(`${accountId}.${fingerprint}.${exp}`))) return null;
  return { accountId, fingerprint, exp: Number(exp) };
}
