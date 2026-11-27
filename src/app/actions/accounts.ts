"use server";

import { revalidatePath } from "next/cache";

import { adminDb } from "@/lib/admin-auth";
import { TABLES } from "@/lib/db-types";
import { bool, text } from "@/lib/form-data";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { phoneDigits } from "@/lib/people";
import { whatsappLink } from "@/lib/whatsapp";

/*
 * Akun portal leader, dikelola admin dari halaman data jemaat. Semua aksi
 * lewat adminDb(). Password sementara hanya dikembalikan sekali ke admin yang
 * membuatnya dan tidak pernah disimpan dalam bentuk asli.
 */

export type AccountActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Hanya ada tepat setelah dibuat / di-reset. */
  tempPassword?: string;
  login?: string;
  waUrl?: string;
};

const LOGIN = /^\d{8,15}$/;

function credentialsMessage(name: string, login: string, password: string) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://everynationkg.com").replace(/\/+$/, "");
  return [
    `Halo ${name}, ini akun Portal Leader Life Group ENKG kamu.`,
    "",
    `Masuk di: ${site}/portal/login`,
    `Nomor WhatsApp: ${login}`,
    `Password sementara: ${password}`,
    "",
    "Waktu pertama masuk, kamu akan diminta membuat password baru.",
  ].join("\n");
}

type PersonRow = { id: string; full_name: string; nickname: string | null; phone: string | null };

async function loadPerson(supabase: Awaited<ReturnType<typeof adminDb>>, personId: string) {
  const { data } = await supabase.from(TABLES.people).select("id, full_name, nickname, phone").eq("id", personId).maybeSingle();
  return data as PersonRow | null;
}

function refresh(personId: string) {
  revalidatePath(`/admin/jemaat/${personId}`);
  revalidatePath("/admin/life-group");
}

export async function createLeaderAccount(_prev: AccountActionState, fd: FormData): Promise<AccountActionState> {
  const supabase = await adminDb();
  const person = await loadPerson(supabase, text(fd, "person_id", 60));
  if (!person) return { status: "error", message: "Data jemaat tidak ditemukan." };

  const login = phoneDigits(person.phone ?? "");
  if (!LOGIN.test(login)) return { status: "error", message: "Isi nomor WhatsApp yang lengkap di data jemaat dulu." };

  const { data: existing } = await supabase.from(TABLES.accounts).select("id").eq("person_id", person.id).maybeSingle();
  if (existing) return { status: "error", message: "Orang ini sudah punya akun portal. Pakai Reset password." };

  const tempPassword = generateTempPassword();
  const { error } = await supabase.from(TABLES.accounts).insert({
    person_id: person.id,
    login,
    password_hash: await hashPassword(tempPassword),
    must_change_password: true,
  });
  if (error) {
    console.error("[akun] createLeaderAccount:", error);
    return {
      status: "error",
      message: error.code === "23505" ? "Nomor WhatsApp ini sudah dipakai akun leader lain." : "Gagal membuat akun. Coba lagi sebentar.",
    };
  }

  refresh(person.id);
  const name = person.nickname || person.full_name.split(" ")[0]!;
  return {
    status: "success",
    message: "Akun dibuat.",
    tempPassword,
    login,
    waUrl: whatsappLink(person.phone!, credentialsMessage(name, login, tempPassword)),
  };
}

/**
 * Password sementara baru. Sesi lama otomatis gugur (sidik jari password
 * berubah), dan nomor login ikut disamakan dengan nomor WA terbaru.
 */
export async function resetLeaderPassword(_prev: AccountActionState, fd: FormData): Promise<AccountActionState> {
  const supabase = await adminDb();
  const { data: account } = await supabase
    .from(TABLES.accounts)
    .select("id, person_id, login")
    .eq("id", text(fd, "account_id", 60))
    .maybeSingle();
  if (!account) return { status: "error", message: "Akun tidak ditemukan." };

  const person = await loadPerson(supabase, account.person_id);
  if (!person) return { status: "error", message: "Data jemaat tidak ditemukan." };

  const phoneLogin = phoneDigits(person.phone ?? "");
  const login = LOGIN.test(phoneLogin) ? phoneLogin : account.login;
  const tempPassword = generateTempPassword();

  const { error } = await supabase
    .from(TABLES.accounts)
    .update({ login, password_hash: await hashPassword(tempPassword), must_change_password: true })
    .eq("id", account.id);
  if (error) {
    console.error("[akun] resetLeaderPassword:", error);
    return {
      status: "error",
      message: error.code === "23505" ? "Nomor WhatsApp terbaru sudah dipakai akun leader lain." : "Gagal reset password.",
    };
  }

  refresh(person.id);
  const name = person.nickname || person.full_name.split(" ")[0]!;
  return {
    status: "success",
    message: "Password sementara baru sudah dibuat. Sesi lama otomatis keluar.",
    tempPassword,
    login,
    waUrl: person.phone ? whatsappLink(person.phone, credentialsMessage(name, login, tempPassword)) : undefined,
  };
}

export async function setLeaderAccountActive(fd: FormData) {
  const supabase = await adminDb();
  const { data } = await supabase
    .from(TABLES.accounts)
    .update({ is_active: bool(fd, "active") })
    .eq("id", text(fd, "account_id", 60))
    .select("person_id")
    .maybeSingle();
  if (data?.person_id) refresh(data.person_id);
}
