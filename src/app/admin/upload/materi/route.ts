import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/admin-auth";
import { MATERIALS_BUCKET } from "@/lib/db-types";
import { MATERIAL_MAX_BYTES, MATERIAL_MAX_MB } from "@/lib/materials";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Siapkan unggahan booklet ke bucket PRIVAT "enkg-materials".
 *
 * Booklet bisa puluhan MB, lebih besar dari batas nginx (6 MB) dan batas body
 * middleware Next. Jadi route ini hanya membuat signed upload URL (sekali pakai,
 * untuk path acak yang ditentukan server), lalu browser mengunggah langsung ke
 * Supabase Storage. Path-nya dicek ulang di saveMaterial sebelum dicatat.
 */
export async function POST(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Sesi berakhir. Muat ulang halaman lalu masuk lagi." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { type?: unknown; size?: unknown } | null;
  const size = Number(body?.size);
  if (body?.type !== "application/pdf") {
    return NextResponse.json({ error: "Booklet harus berupa file PDF." }, { status: 415 });
  }
  if (!Number.isFinite(size) || size <= 0 || size > MATERIAL_MAX_BYTES) {
    return NextResponse.json({ error: `Ukuran maksimal ${MATERIAL_MAX_MB} MB.` }, { status: 413 });
  }

  const path = `${crypto.randomUUID()}.pdf`;
  const { data, error } = await createAdminClient().storage.from(MATERIALS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[upload materi]", error);
    return NextResponse.json({ error: "Gagal menyiapkan unggahan. Coba lagi sebentar." }, { status: 500 });
  }

  return NextResponse.json({ path, signedUrl: data.signedUrl });
}
