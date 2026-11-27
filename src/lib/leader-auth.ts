import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { TABLES, type Account, type LifeGroup, type Person } from "@/lib/db-types";
import { LEADER_COOKIE, verifyLeaderToken } from "@/lib/leader-session";
import { passwordFingerprint } from "@/lib/password";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Satu-satunya pintu ke database untuk portal leader.
 *
 * Portal memakai service-role key (melewati RLS), jadi batas aksesnya ada di
 * sini: setiap halaman, Server Action, dan Route Handler portal WAJIB lewat
 * requireLeader(), lalu menyaring setiap query dengan lifeGroup.id dari hasil
 * fungsi ini, tidak pernah dari isian form atau URL.
 */

/** Kolom jemaat yang boleh dilihat leader. Catatan pengurus sengaja tidak ikut. */
export const MEMBER_COLUMNS =
  "id, full_name, nickname, gender, birth_place, birth_date, phone, email, photo_path, address, area, occupation, life_group_id, life_group_role, status, joined_on";

export type PortalMember = Pick<
  Person,
  | "id"
  | "full_name"
  | "nickname"
  | "gender"
  | "birth_place"
  | "birth_date"
  | "phone"
  | "email"
  | "photo_path"
  | "address"
  | "area"
  | "occupation"
  | "life_group_id"
  | "life_group_role"
  | "status"
  | "joined_on"
>;

export type PortalAccount = Omit<Account, "password_hash">;

export type LeaderContext = {
  supabase: ReturnType<typeof createAdminClient>;
  account: PortalAccount;
  person: PortalMember;
  lifeGroup: LifeGroup;
  /** Sidik jari password saat ini, untuk menerbitkan ulang cookie setelah ganti password. */
  fingerprint: string;
};

/**
 * Sesi leader yang masih sah menurut database, atau null. Dicek ulang setiap
 * request: akun aktif, sidik jari password cocok, orangnya masih leader, dan
 * Life Group-nya masih ada dan aktif. Di-cache per request (layout + halaman).
 */
export const getLeaderContext = cache(async (): Promise<LeaderContext | null> => {
  const store = await cookies();
  const token = await verifyLeaderToken(store.get(LEADER_COOKIE)?.value);
  if (!token) return null;

  const supabase = createAdminClient();
  const { data: account } = await supabase.from(TABLES.accounts).select("*").eq("id", token.accountId).maybeSingle<Account>();
  if (!account || !account.is_active || account.role !== "leader") return null;

  const fingerprint = passwordFingerprint(account.password_hash);
  if (fingerprint !== token.fingerprint) return null;

  const { data: person } = await supabase
    .from(TABLES.people)
    .select(MEMBER_COLUMNS)
    .eq("id", account.person_id)
    .maybeSingle<PortalMember>();
  if (!person || person.life_group_role !== "leader" || !person.life_group_id) return null;

  const { data: lifeGroup } = await supabase
    .from(TABLES.lifeGroups)
    .select("*")
    .eq("id", person.life_group_id)
    .maybeSingle<LifeGroup>();
  if (!lifeGroup || !lifeGroup.is_active) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _hash, ...safeAccount } = account;
  return { supabase, account: safeAccount, person, lifeGroup, fingerprint };
});

/**
 * Wajib dipanggil di awal setiap halaman/aksi/rute portal. Sesi tidak sah →
 * cookie dihapus lewat /portal/keluar lalu kembali ke halaman masuk. Akun
 * dengan password sementara hanya boleh membuka halaman ganti password.
 */
export async function requireLeader({ allowPasswordChange = false } = {}) {
  const context = await getLeaderContext();
  if (!context) redirect("/portal/keluar?alasan=sesi");
  if (context.account.must_change_password && !allowPasswordChange) redirect("/portal/akun?wajib=1");
  return context;
}

/** Anggota Life Group si leader, termasuk leader sendiri. Urut nama. */
export async function groupMembers(context: LeaderContext) {
  const { data, error } = await context.supabase
    .from(TABLES.people)
    .select(MEMBER_COLUMNS)
    .eq("life_group_id", context.lifeGroup.id)
    .order("full_name")
    .returns<PortalMember[]>();
  const members = (data ?? []).sort((a, b) => a.full_name.localeCompare(b.full_name, "id", { sensitivity: "base" }));
  return { members, error };
}
