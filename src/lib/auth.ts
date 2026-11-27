import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { TABLES, type Account, type LifeGroup, type Person } from "@/lib/db-types";
import { passwordFingerprint } from "@/lib/password";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Sesi login yang masih sah menurut database. Semua halaman, Server Action,
 * dan Route Handler admin maupun portal lewat sini (melalui adminDb() dan
 * requireLeader()), karena keduanya memakai service-role key yang melewati RLS.
 *
 * Dicek ulang setiap request: akun aktif, sidik jari password cocok, lalu
 * peran dihitung dari data terbaru. Mencabut admin, menonaktifkan akun, atau
 * mengeluarkan seseorang dari posisi leader langsung berlaku.
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

export type SafeAccount = Omit<Account, "password_hash">;

export type Session = {
  supabase: ReturnType<typeof createAdminClient>;
  account: SafeAccount;
  /** Data jemaat yang ditautkan ke akun ini, kalau ada. */
  person: PortalMember | null;
  /** Life Group yang dipimpin, kalau orangnya leader grup yang aktif. */
  lifeGroup: LifeGroup | null;
  isAdmin: boolean;
  isLeader: boolean;
  /** Sidik jari password saat ini, untuk menerbitkan ulang cookie setelah ganti password. */
  fingerprint: string;
};

/** Peran leader: orang yang ditautkan tercatat leader sebuah Life Group yang aktif. */
export async function leaderGroupOf(supabase: Session["supabase"], personId: string | null) {
  if (!personId) return { person: null, lifeGroup: null };
  const { data: person } = await supabase.from(TABLES.people).select(MEMBER_COLUMNS).eq("id", personId).maybeSingle<PortalMember>();
  if (!person || person.life_group_role !== "leader" || !person.life_group_id) return { person, lifeGroup: null };
  const { data: lifeGroup } = await supabase
    .from(TABLES.lifeGroups)
    .select("*")
    .eq("id", person.life_group_id)
    .maybeSingle<LifeGroup>();
  return { person, lifeGroup: lifeGroup?.is_active ? lifeGroup : null };
}

export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const token = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!token) return null;

  const supabase = createAdminClient();
  const { data: account } = await supabase.from(TABLES.accounts).select("*").eq("id", token.accountId).maybeSingle<Account>();
  if (!account || !account.is_active) return null;

  const fingerprint = passwordFingerprint(account.password_hash);
  if (fingerprint !== token.fingerprint) return null;

  const { person, lifeGroup } = await leaderGroupOf(supabase, account.person_id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _hash, ...safe } = account;
  return {
    supabase,
    account: safe,
    person,
    lifeGroup,
    isAdmin: account.is_admin,
    isLeader: Boolean(lifeGroup),
    fingerprint,
  };
});

/** Halaman awal yang cocok untuk sebuah sesi. */
export function homeFor(session: Pick<Session, "isAdmin" | "isLeader">) {
  return session.isAdmin ? "/admin" : session.isLeader ? "/portal" : "/masuk";
}
