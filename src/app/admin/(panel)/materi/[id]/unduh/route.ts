import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/admin-auth";
import { MATERIALS_BUCKET, TABLES } from "@/lib/db-types";
import { safeFileName } from "@/lib/portal-format";
import { createAdminClient } from "@/lib/supabase/admin";

/** Unduh booklet dari panel admin (termasuk yang masih draf), lewat signed URL berumur pendek. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return new NextResponse("Tidak diizinkan.", { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Materi tidak ditemukan.", { status: 404 });

  const supabase = createAdminClient();
  const { data } = await supabase.from(TABLES.lgMaterials).select("title, file_path, file_name").eq("id", id).maybeSingle();
  if (!data?.file_path) return new NextResponse("Materi tidak ditemukan.", { status: 404 });

  const { data: signed, error } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(data.file_path, 60, { download: safeFileName(data.file_name ?? data.title) });
  if (error || !signed) return new NextResponse("Gagal menyiapkan unduhan.", { status: 502 });

  const response = NextResponse.redirect(signed.signedUrl, 302);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
