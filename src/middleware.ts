import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Alamat tujuan redirect di domain yang dibuka pengunjung.
 *
 * request.nextUrl memakai hostname server Node (localhost:3001), bukan domain
 * publik. Di balik Cloudflare Tunnel + nginx, domain asli dikirim lewat header
 * Host / X-Forwarded-Host dan X-Forwarded-Proto (lihat deploy/nginx.conf).
 */
function redirectTo(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.slice(0, -1);
  const url = new URL(pathname, host ? `${proto}://${host}` : request.nextUrl.origin);
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

/**
 * Gerbang pertama admin panel dan portal Life Group: tanpa sesi yang sah
 * (tanda tangan & kedaluwarsa), semua rute dialihkan ke /masuk. Peran
 * admin/leader dicek ulang ke database oleh adminDb() dan requireLeader()
 * di setiap halaman, Server Action, dan Route Handler.
 *
 * Halaman masuk lama (/admin/login, /portal/login) sekarang cukup /masuk.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const next = request.nextUrl.searchParams.get("next") ?? "";

  if (pathname === "/admin/login" || pathname === "/portal/login") {
    return redirectTo(request, "/masuk", /^\/(admin|portal)(\/|$)/.test(next) ? { next } : undefined);
  }
  if (pathname === "/portal/keluar") return redirectTo(request, "/keluar");

  const authed = Boolean(await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value));
  if (!authed) return redirectTo(request, "/masuk", { next: pathname });
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/portal", "/portal/:path*"],
};
