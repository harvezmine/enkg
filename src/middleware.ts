import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

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
 * Gerbang pertama admin panel: tanpa sesi yang sah, semua rute /admin dialihkan
 * ke halaman login. Pemeriksaan diulang di adminDb() untuk setiap halaman dan
 * Server Action. Situs publik tidak memakai sesi, jadi tidak melewati sini.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const authed = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);

  if (!authed && !isLogin) return redirectTo(request, "/admin/login", { next: pathname });
  if (authed && isLogin) {
    // Sudah login: langsung ke halaman yang tadinya dituju, hanya bila masih di dalam /admin.
    const next = request.nextUrl.searchParams.get("next") ?? "";
    return redirectTo(request, /^\/admin(\/|$)/.test(next) && next !== "/admin/login" ? next : "/admin");
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
