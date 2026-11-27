import "server-only";

import { redirect } from "next/navigation";

import { getSession, MEMBER_COLUMNS, type PortalMember, type SafeAccount, type Session } from "@/lib/auth";
import { TABLES, type LifeGroup } from "@/lib/db-types";

export { MEMBER_COLUMNS, type PortalMember } from "@/lib/auth";

/*
 * Satu-satunya pintu ke database untuk portal Life Group.
 *
 * Portal memakai service-role key (melewati RLS), jadi batas aksesnya ada di
 * sini: setiap halaman, Server Action, dan Route Handler portal WAJIB lewat
 * requireLeader(), lalu menyaring setiap query dengan lifeGroup.id dari hasil
 * fungsi ini, tidak pernah dari isian form atau URL.
 */

export type PortalAccount = SafeAccount;

export type LeaderContext = {
  supabase: Session["supabase"];
  account: PortalAccount;
  person: PortalMember;
  lifeGroup: LifeGroup;
  /** Sidik jari password saat ini, untuk menerbitkan ulang cookie setelah ganti password. */
  fingerprint: string;
  /** Leader ini juga admin: portal menampilkan jalan ke admin panel. */
  isAdmin: boolean;
};

/** Sesi yang sah DAN orangnya masih leader Life Group yang aktif, atau null. */
export async function getLeaderContext(): Promise<LeaderContext | null> {
  const session = await getSession();
  if (!session?.isLeader || !session.person || !session.lifeGroup) return null;
  return {
    supabase: session.supabase,
    account: session.account,
    person: session.person,
    lifeGroup: session.lifeGroup,
    fingerprint: session.fingerprint,
    isAdmin: session.isAdmin,
  };
}

/**
 * Wajib dipanggil di awal setiap halaman/aksi/rute portal. Tanpa sesi → halaman
 * masuk. Admin yang bukan leader → admin panel. Akun dengan password sementara
 * hanya boleh membuka halaman ganti password.
 */
export async function requireLeader({ allowPasswordChange = false } = {}) {
  const context = await getLeaderContext();
  if (!context) {
    const session = await getSession();
    redirect(session?.isAdmin ? "/admin" : session ? "/keluar?alasan=akses" : "/keluar?alasan=sesi");
  }
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
