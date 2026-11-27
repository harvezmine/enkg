"use server";

import { revalidatePath } from "next/cache";

import { currentAdmin } from "@/lib/admin-auth";
import { TABLES } from "@/lib/db-types";
import { bool, text } from "@/lib/form-data";
import { generateTempPassword, hashPassword, MIN_LEADER_PASSWORD_LENGTH } from "@/lib/password";
import { whatsappLink } from "@/lib/whatsapp";

/*
 * Akun login (email + password), dikelola admin dari halaman Pengguna dan
 * halaman data jemaat. Semua aksi lewat currentAdmin() (= adminDb()).
 * Password sementara hanya dikembalikan sekali ke admin yang membuatnya dan
 * tidak pernah disimpan dalam bentuk asli.
 */

export type AccountActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Hanya ada tepat setelah dibuat / di-reset. */
  tempPassword?: string;
  email?: string;
  waUrl?: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f-]{36}$/i;

function credentialsMessage(name: string, email: string, password: string, mustChange = true) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://everynationkg.com").replace(/\/+$/, "");
  return [
    `Halo ${name}, ini akun ENKG kamu.`,
    "",
    `Masuk di: ${site}/masuk`,
    `Email: ${email}`,
    `Password${mustChange ? " sementara" : ""}: ${password}`,
    ...(mustChange ? ["", "Waktu pertama masuk, kamu akan diminta membuat password baru."] : []),
  ].join("\n");
}

function refresh(personId?: string | null) {
  revalidatePath("/admin/pengguna");
  revalidatePath("/admin/life-group");
  if (personId) revalidatePath(`/admin/jemaat/${personId}`);
}

type Db = Awaited<ReturnType<typeof currentAdmin>>["supabase"];

async function personPhone(supabase: Db, personId: string | null) {
  if (!personId) return null;
  const { data } = await supabase.from(TABLES.people).select("full_name, nickname, phone").eq("id", personId).maybeSingle();
  return data as { full_name: string; nickname: string | null; phone: string | null } | null;
}

export async function createAccount(_prev: AccountActionState, fd: FormData): Promise<AccountActionState> {
  const { supabase } = await currentAdmin();
  const email = text(fd, "email", 200).toLowerCase();
  const personId = text(fd, "person_id", 60) || null;
  const isAdmin = bool(fd, "is_admin");
  let name = text(fd, "name", 120).replace(/\s+/g, " ");

  if (!EMAIL.test(email)) return { status: "error", message: "Alamat email belum benar." };
  if (personId && !UUID.test(personId)) return { status: "error", message: "Data jemaat tidak valid." };

  const person = await personPhone(supabase, personId);
  if (personId && !person) return { status: "error", message: "Data jemaat tidak ditemukan." };
  if (!name) name = person?.full_name ?? "";
  if (name.length < 2) return { status: "error", message: "Isi nama pemilik akun." };

  // Password: dibuat otomatis, atau ditentukan admin sendiri.
  const manual = text(fd, "password_mode", 10) === "manual";
  const chosen = String(fd.get("password") ?? "").slice(0, 200);
  if (manual && chosen.length < MIN_LEADER_PASSWORD_LENGTH) {
    return { status: "error", message: `Password minimal ${MIN_LEADER_PASSWORD_LENGTH} karakter.` };
  }
  const tempPassword = manual ? chosen : generateTempPassword();
  // Password otomatis selalu wajib diganti; password pilihan admin boleh langsung dipakai.
  const mustChange = manual ? bool(fd, "must_change") : true;

  const { error } = await supabase.from(TABLES.accounts).insert({
    email,
    name,
    person_id: personId,
    is_admin: isAdmin,
    password_hash: await hashPassword(tempPassword),
    must_change_password: mustChange,
  });
  if (error) {
    console.error("[akun] createAccount:", error);
    const duplicate = error.code === "23505";
    return {
      status: "error",
      message: duplicate
        ? error.message.includes("person") ? "Orang ini sudah punya akun." : "Email itu sudah dipakai akun lain."
        : "Gagal membuat akun. Coba lagi sebentar.",
    };
  }

  refresh(personId);
  const first = person?.nickname || name.split(" ")[0]!;
  return {
    status: "success",
    message: "Akun dibuat.",
    tempPassword,
    email,
    waUrl: person?.phone ? whatsappLink(person.phone, credentialsMessage(first, email, tempPassword, mustChange)) : undefined,
  };
}

/** Password sementara baru. Sesi lama otomatis gugur (sidik jari password berubah). */
export async function resetAccountPassword(_prev: AccountActionState, fd: FormData): Promise<AccountActionState> {
  const { supabase } = await currentAdmin();
  const id = text(fd, "account_id", 60);
  const { data: account } = await supabase.from(TABLES.accounts).select("id, email, name, person_id").eq("id", id).maybeSingle();
  if (!account) return { status: "error", message: "Akun tidak ditemukan." };

  const tempPassword = generateTempPassword();
  const { error } = await supabase
    .from(TABLES.accounts)
    .update({ password_hash: await hashPassword(tempPassword), must_change_password: true })
    .eq("id", id);
  if (error) {
    console.error("[akun] reset:", error);
    return { status: "error", message: "Gagal membuat password baru." };
  }

  refresh(account.person_id);
  const person = await personPhone(supabase, account.person_id);
  const first = person?.nickname || account.name.split(" ")[0]!;
  return {
    status: "success",
    message: "Password sementara baru sudah dibuat. Sesi lamanya otomatis keluar.",
    tempPassword,
    email: account.email,
    waUrl: person?.phone ? whatsappLink(person.phone, credentialsMessage(first, account.email, tempPassword)) : undefined,
  };
}

export async function setAccountActive(fd: FormData) {
  const session = await currentAdmin();
  const id = text(fd, "account_id", 60);
  // Admin tidak bisa mengunci dirinya sendiri.
  if (id === session.account.id) return;
  const { data } = await session.supabase
    .from(TABLES.accounts)
    .update({ is_active: bool(fd, "active") })
    .eq("id", id)
    .select("person_id")
    .maybeSingle();
  refresh(data?.person_id);
}

export async function setAccountAdmin(fd: FormData) {
  const session = await currentAdmin();
  const id = text(fd, "account_id", 60);
  if (id === session.account.id) return;
  const { data } = await session.supabase
    .from(TABLES.accounts)
    .update({ is_admin: bool(fd, "admin") })
    .eq("id", id)
    .select("person_id")
    .maybeSingle();
  refresh(data?.person_id);
}

export async function deleteAccount(fd: FormData) {
  const session = await currentAdmin();
  // DeleteButton mengirim "id".
  const id = text(fd, "account_id", 60) || text(fd, "id", 60);
  if (id === session.account.id) return;
  const { data } = await session.supabase.from(TABLES.accounts).delete().eq("id", id).select("person_id").maybeSingle();
  refresh(data?.person_id);
}
