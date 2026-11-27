import { NextResponse, type NextRequest } from "next/server";

import { publicUrl } from "@/lib/public-url";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Hapus sesi lalu kembali ke halaman masuk. Dipakai saat sesi tidak lagi sah
 * (Server Component tidak boleh mengubah cookie) dan dari tombol Keluar.
 */
export function GET(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get("alasan");
  const target = reason === "sesi" || reason === "akses" ? `/masuk?alasan=${reason}` : "/masuk";
  const response = NextResponse.redirect(publicUrl(request, target));
  response.cookies.delete({ name: SESSION_COOKIE, path: "/" });
  // Cookie lama dari versi sebelumnya ikut dibersihkan.
  response.cookies.delete({ name: "enkg_admin", path: "/" });
  response.cookies.delete({ name: "enkg_leader", path: "/portal" });
  return response;
}
