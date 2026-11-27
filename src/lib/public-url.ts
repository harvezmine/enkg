/**
 * Alamat absolut di domain yang dibuka pengunjung. Di balik Cloudflare Tunnel +
 * nginx, request.url berisi hostname server Node (localhost:3001), jadi domain
 * asli diambil dari X-Forwarded-Host / Host (lihat deploy/nginx.conf).
 */
export function publicUrl(request: Request, pathname: string) {
  const fallback = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? fallback.protocol.slice(0, -1);
  return new URL(pathname, host ? `${proto}://${host}` : fallback.origin);
}
