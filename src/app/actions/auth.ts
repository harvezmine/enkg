"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSession, homeFor, leaderGroupOf } from "@/lib/auth";
import { TABLES, type Account } from "@/lib/db-types";
import { dummyPasswordHash, hashPassword, MIN_LEADER_PASSWORD_LENGTH, passwordFingerprint, verifyPassword } from "@/lib/password";
import { checkSetupCode, createSessionToken, isAuthConfigured, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = { error?: string; success?: string };

/*
 * Batas percobaan salah, per IP dan per email. Disimpan di memori proses:
 * cukup untuk memperlambat tebak-tebakan password; tiap worker PM2 menghitung sendiri.
 */
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; until: number }>();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function clientIp() {
  const h = await headers();
  // nginx menimpa X-Real-IP dengan IP asli, jadi tidak bisa dipalsukan pengunjung.
  // Entri PERTAMA X-Forwarded-For justru bisa diisi sembarang oleh klien, jadi pakai yang terakhir.
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "local";
}

function lockedMinutes(keys: string[], now: number) {
  for (const [key, record] of failures) if (record.until <= now) failures.delete(key);
  const until = Math.max(0, ...keys.map((key) => (failures.get(key)?.count ?? 0) >= MAX_FAILS ? failures.get(key)!.until : 0));
  return until ? Math.ceil((until - now) / 60_000) : 0;
}

function recordFailure(keys: string[], now: number) {
  for (const key of keys) {
    const record = failures.get(key);
    failures.set(key, { count: (record && record.until > now ? record.count : 0) + 1, until: now + LOCK_MS });
  }
}

async function setSessionCookie(accountId: string, passwordHash: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(accountId, passwordFingerprint(passwordHash)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Tujuan "next" hanya dipakai kalau memang boleh dibuka akun ini. */
function destination(next: string, roles: { isAdmin: boolean; isLeader: boolean }) {
  if (roles.isAdmin && /^\/admin(\/|$|\?)/.test(next)) return next;
  if (roles.isLeader && /^\/portal(\/|$|\?)/.test(next)) return next;
  return homeFor(roles);
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isAuthConfigured()) return { error: "Login belum dikonfigurasi di server ini." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const now = Date.now();
  const keys = [`ip:${await clientIp()}`, `email:${email}`];

  const locked = lockedMinutes(keys, now);
  if (locked) return { error: `Terlalu banyak percobaan. Coba lagi dalam ${locked} menit.` };
  if (!EMAIL.test(email) || !password) return { error: "Isi email dan password kamu." };

  const supabase = createAdminClient();
  // Email selalu disimpan huruf kecil; cocokkan persis (ilike akan menganggap "_" wildcard).
  const { data } = await supabase.from(TABLES.accounts).select("*").eq("email", email).maybeSingle<Account>();

  // Email tak terdaftar tetap diverifikasi ke hash palsu: waktu jawabnya sama.
  const valid = await verifyPassword(password, data?.password_hash ?? (await dummyPasswordHash()));
  if (!data || !valid) {
    recordFailure(keys, now);
    return { error: "Email atau password salah." };
  }
  if (!data.is_active) return { error: "Akun ini sedang dinonaktifkan. Hubungi admin gereja." };

  const { lifeGroup } = await leaderGroupOf(supabase, data.person_id);
  const roles = { isAdmin: data.is_admin, isLeader: Boolean(lifeGroup) };
  if (!roles.isAdmin && !roles.isLeader) {
    return { error: "Akun ini belum punya akses. Minta admin menjadikanmu admin atau leader Life Group." };
  }

  for (const key of keys) failures.delete(key);
  await supabase.from(TABLES.accounts).update({ last_login_at: new Date().toISOString() }).eq("id", data.id);
  await setSessionCookie(data.id, data.password_hash);

  if (data.must_change_password) redirect(roles.isAdmin ? "/admin/akun?wajib=1" : "/portal/akun?wajib=1");
  redirect(destination(String(formData.get("next") ?? ""), roles));
}

/**
 * Admin pertama. Hanya bisa selama belum ada satu pun admin aktif, dan butuh
 * kode pengaturan (ADMIN_PASSWORD di server), jadi orang luar tidak bisa
 * memakainya walau halamannya terbuka.
 */
export async function setupFirstAdmin(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isAuthConfigured()) return { error: "Login belum dikonfigurasi di server ini." };

  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const code = String(formData.get("code") ?? "").slice(0, 200);
  const now = Date.now();
  const keys = [`ip:${await clientIp()}`, "setup"];

  const locked = lockedMinutes(keys, now);
  if (locked) return { error: `Terlalu banyak percobaan. Coba lagi dalam ${locked} menit.` };
  if (name.length < 2) return { error: "Isi nama kamu." };
  if (!EMAIL.test(email)) return { error: "Alamat email belum benar." };
  if (password.length < MIN_LEADER_PASSWORD_LENGTH) return { error: `Password minimal ${MIN_LEADER_PASSWORD_LENGTH} karakter.` };
  if (!(await checkSetupCode(code))) {
    recordFailure(keys, now);
    return { error: "Kode pengaturan salah." };
  }

  const supabase = createAdminClient();
  const { count } = await supabase
    .from(TABLES.accounts)
    .select("id", { count: "exact", head: true })
    .eq("is_admin", true)
    .eq("is_active", true);
  if (count) return { error: "Admin pertama sudah dibuat. Masuk dengan akunnya." };

  const passwordHash = await hashPassword(password);
  const { data, error } = await supabase
    .from(TABLES.accounts)
    .insert({ email, name, is_admin: true, password_hash: passwordHash, must_change_password: false })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[auth] setupFirstAdmin:", error);
    return { error: error?.code === "23505" ? "Email itu sudah dipakai akun lain." : "Gagal membuat akun. Coba lagi sebentar." };
  }

  await setSessionCookie(data.id, passwordHash);
  redirect("/admin");
}

/** Ganti password sendiri. Sesi di perangkat lain otomatis gugur. */
export async function changePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const session = await getSession();
  if (!session) redirect("/keluar?alasan=sesi");

  const current = String(formData.get("current") ?? "").slice(0, 200);
  const next = String(formData.get("next") ?? "").slice(0, 200);
  const confirm = String(formData.get("confirm") ?? "").slice(0, 200);

  if (next.length < MIN_LEADER_PASSWORD_LENGTH) return { error: `Password baru minimal ${MIN_LEADER_PASSWORD_LENGTH} karakter.` };
  if (next !== confirm) return { error: "Konfirmasi password baru belum sama." };
  if (next === current) return { error: "Password baru harus berbeda dari yang sekarang." };

  const { data } = await session.supabase.from(TABLES.accounts).select("password_hash").eq("id", session.account.id).single();
  if (!data || !(await verifyPassword(current, data.password_hash))) return { error: "Password sekarang salah." };

  const passwordHash = await hashPassword(next);
  const { error } = await session.supabase
    .from(TABLES.accounts)
    .update({ password_hash: passwordHash, must_change_password: false })
    .eq("id", session.account.id);
  if (error) {
    console.error("[auth] changePassword:", error);
    return { error: "Gagal menyimpan password. Coba lagi sebentar." };
  }

  await setSessionCookie(session.account.id, passwordHash);
  redirect(`${homeFor(session)}?password=1`);
}

export async function signOut() {
  const store = await cookies();
  store.delete({ name: SESSION_COOKIE, path: "/" });
  redirect("/masuk");
}
