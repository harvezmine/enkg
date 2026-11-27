import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/*
 * Password akun portal leader Life Group. Hanya untuk server (node:crypto).
 *
 * Disimpan sebagai "scrypt$N$r$p$salt$hash" (salt & hash base64url), jadi
 * parameter bisa dinaikkan nanti tanpa merusak hash lama.
 */

const KEY_LENGTH = 64;
const PARAMS = { N: 2 ** 15, r: 8, p: 1 } as const;
/** 128 · N · r = 32 MB; batas bawaan node pas di angka itu, jadi beri ruang. */
const MAX_MEM = 64 * 1024 * 1024;

export const MIN_LEADER_PASSWORD_LENGTH = 8;

function derive(password: string, salt: Buffer, options: ScryptOptions & { N: number; r: number; p: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { ...options, maxmem: MAX_MEM }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every((value) => Number.isInteger(value) && value > 0)) return false;

  const salt = Buffer.from(parts[4]!, "base64url");
  const expected = Buffer.from(parts[5]!, "base64url");
  if (!salt.length || expected.length !== KEY_LENGTH) return false;

  try {
    const actual = await derive(password, salt, { N: N!, r: r!, p: p! });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Hash palsu untuk login dengan nomor yang tidak terdaftar: verifikasi tetap
 * dijalankan supaya waktu jawabnya sama dan nomor terdaftar tidak bisa ditebak.
 */
let dummyHash: Promise<string> | null = null;
export function dummyPasswordHash() {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

/**
 * Sidik jari hash password untuk sesi. Ikut ditandatangani di cookie, jadi
 * begitu password diganti atau di-reset admin, semua sesi lama gugur.
 */
export function passwordFingerprint(passwordHash: string) {
  return createHash("sha256").update(`leader-session-version|${passwordHash}`).digest("hex").slice(0, 24);
}

/** Tanpa huruf/angka yang mirip (0/o, 1/l/i), supaya mudah diketik dari pesan WA. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Password sementara, mis. "k7mp-q2xr-9tne" (±59 bit). Wajib diganti saat masuk pertama. */
export function generateTempPassword() {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return [group(), group(), group()].join("-");
}
