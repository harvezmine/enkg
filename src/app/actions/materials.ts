"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/app/actions/admin";
import { adminDb } from "@/lib/admin-auth";
import { LIFE_GROUP_SEGMENT_LABEL, MATERIALS_BUCKET, TABLES, type LifeGroupSegment } from "@/lib/db-types";
import { bool, nullable, text } from "@/lib/form-data";
import { MATERIAL_MAX_BYTES, MATERIAL_PATH } from "@/lib/materials";

/*
 * Materi Life Group (admin). Semua aksi lewat adminDb(): leader tidak punya
 * sesi admin, jadi tidak bisa memanggil aksi ini meski tahu endpoint-nya.
 */

function refresh() {
  revalidatePath("/admin/materi");
  revalidatePath("/portal/materi");
}

export async function saveMaterial(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id", 60);
  const title = text(fd, "title", 200);
  const body = text(fd, "body", 60000);
  const filePath = text(fd, "file_path", 80);
  const fileSize = Number.parseInt(text(fd, "file_size", 12) || "0", 10);
  const segment = text(fd, "segment", 30);
  const published = bool(fd, "published");

  if (title.length < 3) return { status: "error", message: "Judul terlalu pendek." };
  if (filePath && !MATERIAL_PATH.test(filePath)) return { status: "error", message: "Booklet tidak valid. Unggah ulang file-nya." };
  if (!body && !filePath) return { status: "error", message: "Isi tulisannya atau unggah booklet, salah satu saja cukup." };
  if (filePath && (!Number.isInteger(fileSize) || fileSize < 0 || fileSize > MATERIAL_MAX_BYTES)) {
    return { status: "error", message: "Ukuran booklet tidak valid. Unggah ulang file-nya." };
  }

  const supabase = await adminDb();

  let previous: { file_path: string | null; published_at: string | null } | null = null;
  if (id) {
    const { data } = await supabase.from(TABLES.lgMaterials).select("file_path, published_at").eq("id", id).maybeSingle();
    if (!data) return { status: "error", message: "Materi tidak ditemukan. Mungkin sudah dihapus." };
    previous = data;
  }

  // File baru harus benar-benar sudah ada di Storage sebelum dicatat.
  if (filePath && filePath !== previous?.file_path) {
    const { error } = await supabase.storage.from(MATERIALS_BUCKET).createSignedUrl(filePath, 30);
    if (error) return { status: "error", message: "Booklet belum selesai terunggah. Unggah ulang file-nya." };
  }

  const payload = {
    title,
    summary: nullable(text(fd, "summary", 400)),
    body: nullable(body),
    segment: segment in LIFE_GROUP_SEGMENT_LABEL ? (segment as LifeGroupSegment) : null,
    file_path: nullable(filePath),
    file_name: filePath ? nullable(text(fd, "file_name", 160)) : null,
    file_size: filePath ? fileSize : null,
    published,
    // Tanggal terbit dikunci saat pertama kali diterbitkan.
    published_at: previous?.published_at ?? (published ? new Date().toISOString() : null),
  };

  const { error } = id
    ? await supabase.from(TABLES.lgMaterials).update(payload).eq("id", id)
    : await supabase.from(TABLES.lgMaterials).insert(payload);

  if (error) {
    console.error("[materi] saveMaterial:", error);
    return { status: "error", message: "Gagal menyimpan. Coba lagi sebentar." };
  }

  if (previous?.file_path && previous.file_path !== payload.file_path) {
    await supabase.storage.from(MATERIALS_BUCKET).remove([previous.file_path]);
  }

  refresh();
  redirect("/admin/materi?saved=1");
}

export async function toggleMaterial(fd: FormData) {
  const id = text(fd, "id", 60);
  const next = bool(fd, "next");
  const supabase = await adminDb();
  const { data } = await supabase.from(TABLES.lgMaterials).select("published_at").eq("id", id).maybeSingle();
  await supabase
    .from(TABLES.lgMaterials)
    .update({ published: next, published_at: data?.published_at ?? (next ? new Date().toISOString() : null) })
    .eq("id", id);
  refresh();
}

export async function deleteMaterial(fd: FormData) {
  const supabase = await adminDb();
  const { data } = await supabase.from(TABLES.lgMaterials).delete().eq("id", text(fd, "id", 60)).select("file_path").maybeSingle();
  if (data?.file_path) await supabase.storage.from(MATERIALS_BUCKET).remove([data.file_path]);
  refresh();
}
