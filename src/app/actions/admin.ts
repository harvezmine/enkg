"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { adminDb } from "@/lib/admin-auth";
import { SUBMISSION_STATUS_LABEL, TABLES, type SubmissionStatus } from "@/lib/db-types";
import { fromWibInput, slugify } from "@/lib/utils";

/**
 * Aksi CRUD admin panel.
 *
 * Server Action adalah endpoint POST publik, dan klien database-nya memakai
 * service role (melewati RLS). Karena itu setiap aksi mengambil klien lewat
 * adminDb(), yang menolak permintaan tanpa sesi admin yang sah.
 */

export type ActionState = { status: "idle" | "success" | "error"; message?: string };

const text = (fd: FormData, key: string, max = 500) => String(fd.get(key) ?? "").trim().slice(0, max);
const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";
const nullable = (value: string) => (value === "" ? null : value);
const isUrl = (value: string) => value === "" || /^https?:\/\//i.test(value);

/** Halaman publik ikut diperbarui supaya perubahan langsung terlihat. */
function refreshSite(paths: string[] = []) {
  revalidatePath("/");
  for (const path of paths) revalidatePath(path);
}

/* ═══════════════════════════════════════════════════════════════════════════
   News: kabar & artikel
   ═══════════════════════════════════════════════════════════════════════════ */

export async function savePost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id", 60);
  const title = text(fd, "title", 200);
  const body = text(fd, "body", 60000);
  const published = bool(fd, "published");
  const coverUrl = text(fd, "cover_url", 600);

  if (title.length < 3) return { status: "error", message: "Judul terlalu pendek." };
  if (body.length < 10) return { status: "error", message: "Isi tulisan masih kosong." };
  if (!isUrl(coverUrl)) return { status: "error", message: "Alamat gambar harus diawali http:// atau https://" };

  const slug = slugify(text(fd, "slug", 120) || title);
  if (!slug) return { status: "error", message: "Slug tidak valid. Gunakan huruf atau angka." };

  const payload = {
    title,
    slug,
    excerpt: nullable(text(fd, "excerpt", 400)),
    body,
    cover_url: nullable(coverUrl),
    category: text(fd, "category", 20) === "artikel" ? "artikel" : "kabar",
    author: nullable(text(fd, "author", 120)),
    published,
    // Tanggal terbit dikunci saat pertama kali diterbitkan, jadi urutannya tidak bergeser.
    published_at: nullable(text(fd, "published_at", 40)) ?? (published ? new Date().toISOString() : null),
  };

  const supabase = await adminDb();
  const { error } = id
    ? await supabase.from(TABLES.posts).update(payload).eq("id", id)
    : await supabase.from(TABLES.posts).insert(payload);

  if (error) {
    console.error("[admin] savePost:", error);
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "Slug sudah dipakai tulisan lain. Ubah judul atau slug-nya."
          : "Gagal menyimpan. Coba lagi sebentar.",
    };
  }

  refreshSite([`/news/${slug}`]);
  revalidatePath("/admin/news");
  revalidatePath("/admin");
  redirect("/admin/news?saved=1");
}

export async function togglePost(fd: FormData) {
  const id = text(fd, "id", 60);
  const next = bool(fd, "next");
  const supabase = await adminDb();
  const { data: current } = await supabase.from(TABLES.posts).select("slug, published_at").eq("id", id).maybeSingle();
  await supabase
    .from(TABLES.posts)
    .update({ published: next, published_at: current?.published_at ?? (next ? new Date().toISOString() : null) })
    .eq("id", id);
  refreshSite(current?.slug ? [`/news/${current.slug}`] : []);
  revalidatePath("/admin/news");
}

export async function deletePost(fd: FormData) {
  const supabase = await adminDb();
  await supabase.from(TABLES.posts).delete().eq("id", text(fd, "id", 60));
  refreshSite();
  revalidatePath("/admin/news");
  revalidatePath("/admin");
}

/* ═══════════════════════════════════════════════════════════════════════════
   Event gereja & ProCon
   ═══════════════════════════════════════════════════════════════════════════ */

export async function saveEvent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id", 60);
  const title = text(fd, "title", 200);
  const category = text(fd, "category", 20) === "procon" ? "procon" : "gereja";
  const startsRaw = text(fd, "starts_at", 40);
  const endsRaw = text(fd, "ends_at", 40);
  // Jam di form selalu dibaca sebagai WIB, apa pun zona waktu server.
  const startsAt = fromWibInput(startsRaw);
  const endsAt = fromWibInput(endsRaw);
  const links = { map_url: text(fd, "map_url", 600), cover_url: text(fd, "cover_url", 600), register_url: text(fd, "register_url", 600) };

  if (title.length < 3) return { status: "error", message: "Nama event terlalu pendek." };
  if ((startsRaw && !startsAt) || (endsRaw && !endsAt)) return { status: "error", message: "Format tanggal atau jam tidak valid." };
  if (category === "gereja" && !startsAt) {
    return { status: "error", message: "Tanggal dan jam mulai wajib diisi untuk event gereja." };
  }
  if (endsAt && !startsAt) return { status: "error", message: "Isi jam mulai sebelum jam selesai." };
  if (startsAt && endsAt && endsAt <= startsAt) return { status: "error", message: "Jam selesai harus setelah jam mulai." };
  if (!Object.values(links).every(isUrl)) {
    return { status: "error", message: "Tautan peta, gambar, dan pendaftaran harus diawali http:// atau https://" };
  }

  const slug = slugify(text(fd, "slug", 120) || title);
  if (!slug) return { status: "error", message: "Slug tidak valid. Gunakan huruf atau angka." };

  const payload = {
    title,
    slug,
    category,
    description: nullable(text(fd, "description", 20000)),
    topic: nullable(text(fd, "topic", 80)),
    partner: nullable(text(fd, "partner", 160)),
    starts_at: startsAt,
    ends_at: endsAt,
    location: nullable(text(fd, "location", 200)),
    address: nullable(text(fd, "address", 400)),
    map_url: nullable(links.map_url),
    cover_url: nullable(links.cover_url),
    register_url: nullable(links.register_url),
    published: bool(fd, "published"),
  };

  const supabase = await adminDb();
  const { error } = id
    ? await supabase.from(TABLES.events).update(payload).eq("id", id)
    : await supabase.from(TABLES.events).insert(payload);

  if (error) {
    console.error("[admin] saveEvent:", error);
    return {
      status: "error",
      message:
        error.code === "23505" ? "Slug sudah dipakai event lain. Ubah nama atau slug-nya." : "Gagal menyimpan event.",
    };
  }

  refreshSite([`/event/${slug}`]);
  revalidatePath("/admin/event");
  revalidatePath("/admin");
  redirect(`/admin/event?saved=1${category === "procon" ? "&kategori=procon" : ""}`);
}

export async function toggleEvent(fd: FormData) {
  const id = text(fd, "id", 60);
  const supabase = await adminDb();
  const { data } = await supabase
    .from(TABLES.events)
    .update({ published: bool(fd, "next") })
    .eq("id", id)
    .select("slug")
    .maybeSingle();
  refreshSite(data?.slug ? [`/event/${data.slug}`] : []);
  revalidatePath("/admin/event");
}

export async function deleteEvent(fd: FormData) {
  const supabase = await adminDb();
  await supabase.from(TABLES.events).delete().eq("id", text(fd, "id", 60));
  refreshSite();
  revalidatePath("/admin/event");
  revalidatePath("/admin");
}

/* ═══════════════════════════════════════════════════════════════════════════
   Kiriman Contact Us
   ═══════════════════════════════════════════════════════════════════════════ */

export async function updateSubmission(fd: FormData) {
  const id = text(fd, "id", 60);
  const status = text(fd, "status", 20) as SubmissionStatus;
  if (!(status in SUBMISSION_STATUS_LABEL)) return;

  const supabase = await adminDb();
  await supabase
    .from(TABLES.submissions)
    .update({ status, admin_notes: nullable(text(fd, "admin_notes", 4000)) })
    .eq("id", id);

  revalidatePath("/admin/kontak");
  revalidatePath("/admin");
}

export async function deleteSubmission(fd: FormData) {
  const supabase = await adminDb();
  await supabase.from(TABLES.submissions).delete().eq("id", text(fd, "id", 60));
  revalidatePath("/admin/kontak");
  revalidatePath("/admin");
}
