import { NextResponse } from "next/server";

import { PEOPLE_BUCKET } from "@/lib/db-types";
import { getLeaderContext } from "@/lib/leader-auth";
import { signPhoto } from "@/lib/people-data";

const MAX_BYTES = 5 * 1024 * 1024;

/** Ekstensi diambil dari tipe file. Browser sudah mengecilkan foto ke JPEG sebelum dikirim. */
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Unggah foto anggota dari portal leader ke bucket PRIVAT "enkg-people".
 * Aturannya sama dengan /admin/upload/foto, tetapi sesinya sesi leader yang
 * dicek ulang ke database. Foto baru terpasang ke anggota hanya lewat
 * saveMember, yang membatasi ke grup leader ini.
 */
export async function POST(request: Request) {
  const context = await getLeaderContext();
  if (!context || context.account.must_change_password) {
    return NextResponse.json({ error: "Sesi berakhir. Muat ulang halaman lalu masuk lagi." }, { status: 401 });
  }

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return NextResponse.json({ error: "Format foto harus JPG, PNG, atau WebP." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran maksimal 5 MB." }, { status: 413 });

  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await context.supabase.storage
    .from(PEOPLE_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });

  if (error) {
    console.error("[portal upload foto]", error);
    return NextResponse.json({ error: "Gagal mengunggah. Coba lagi sebentar." }, { status: 500 });
  }

  return NextResponse.json({ path, url: await signPhoto(context.supabase, path) });
}
