import { NextResponse } from "next/server";

import { MATERIALS_BUCKET } from "@/lib/db-types";
import { getLeaderContext } from "@/lib/leader-auth";
import { groupMaterial } from "@/lib/portal-data";
import { safeFileName } from "@/lib/portal-format";
import { publicUrl } from "@/lib/public-url";

/**
 * Unduh booklet: sesi leader dicek ulang ke database, materi harus terbit dan
 * memang untuk grup ini, lalu dialihkan ke signed URL yang hanya hidup sebentar.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getLeaderContext();
  if (!context || context.account.must_change_password) {
    return NextResponse.redirect(publicUrl(request, "/keluar?alasan=sesi"));
  }

  const material = await groupMaterial(context, (await params).id);
  if (!material?.file_path) return new NextResponse("Materi tidak ditemukan.", { status: 404 });

  const { data, error } = await context.supabase.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(material.file_path, 60, { download: safeFileName(material.file_name ?? material.title) });
  if (error || !data) {
    console.error("[materi] unduh:", error);
    return new NextResponse("Gagal menyiapkan unduhan. Coba lagi sebentar.", { status: 502 });
  }

  const response = NextResponse.redirect(data.signedUrl, 302);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
