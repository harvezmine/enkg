/**
 * next/image hanya mengoptimasi gambar dari sumber yang terdaftar di
 * next.config.ts: file lokal dan Supabase Storage. Tautan gambar lain yang
 * ditempel di admin panel tetap tampil tanpa optimasi, bukan membuat halaman error.
 */
export function canOptimizeImage(src: string, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  if (!supabaseUrl) return false;
  return src.startsWith(`${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/`);
}

/** Tautan ke halaman situs sendiri dibuka di tab yang sama, tautan luar di tab baru. */
export function linkTarget(href: string) {
  return href.startsWith("/") && !href.startsWith("//") ? {} : { target: "_blank", rel: "noopener noreferrer" };
}
