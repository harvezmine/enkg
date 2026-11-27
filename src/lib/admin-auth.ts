import "server-only";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Sesi admin yang sah dan sudah mengganti password sementaranya. Dipakai Route Handler. */
export async function isAdminSession() {
  const session = await getSession();
  return Boolean(session?.isAdmin && !session.account.must_change_password);
}

/**
 * Satu-satunya pintu ke database untuk admin panel.
 *
 * Panel memakai service-role key yang MELEWATI RLS, jadi setiap halaman dan
 * Server Action admin wajib mengambil klien lewat fungsi ini. Middleware saja
 * tidak cukup, sebab Server Action bisa dipanggil langsung dengan POST.
 *
 * Tanpa sesi → halaman masuk. Leader tanpa hak admin → portalnya sendiri.
 * Password sementara → wajib ganti dulu (kecuali halaman ganti password).
 */
export async function adminDb({ allowPasswordChange = false } = {}) {
  const session = await getSession();
  if (!session) redirect("/keluar?alasan=sesi");
  if (!session.isAdmin) redirect(session.isLeader ? "/portal" : "/keluar?alasan=akses");
  if (session.account.must_change_password && !allowPasswordChange) redirect("/admin/akun?wajib=1");
  return createAdminClient();
}

/** Akun admin yang sedang masuk (untuk mencegah admin mencabut aksesnya sendiri, dsb.). */
export async function currentAdmin() {
  await adminDb({ allowPasswordChange: true });
  return (await getSession())!;
}
