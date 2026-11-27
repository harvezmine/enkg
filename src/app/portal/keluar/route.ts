import { NextResponse, type NextRequest } from "next/server";

import { LEADER_COOKIE } from "@/lib/leader-session";
import { publicUrl } from "@/lib/public-url";

/**
 * Hapus sesi leader lalu kembali ke halaman masuk. Dipakai requireLeader()
 * saat sesi tidak lagi sah (Server Component tidak boleh mengubah cookie).
 */
export function GET(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get("alasan") === "sesi";
  const response = NextResponse.redirect(publicUrl(request, reason ? "/portal/login?alasan=sesi" : "/portal/login"));
  response.cookies.delete({ name: LEADER_COOKIE, path: "/portal" });
  return response;
}
