import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { SUBMISSION_STATUS_LABEL, TABLES, type SubmissionStatus } from "../db-types";
import { leaderNotice } from "../life-group-notify";
import { slugify } from "../utils";
import type { ProposalKind } from "./proposals";

/*
 * Menjalankan usulan yang SUDAH dikonfirmasi admin dan diverifikasi tanda
 * tangannya. Semua isian dicek ulang di sini (jangan percaya isi usulan
 * begitu saja), dan setelahnya halaman yang sama dengan aksi biasa diperbarui.
 */

export type ExecuteResult = {
  ok: boolean;
  message: string;
  /** Halaman admin untuk melihat hasilnya. */
  href?: string;
  /** Tombol WhatsApp opsional, mis. kabari leader. */
  notify?: { href: string; label: string };
};

const UUID = /^[0-9a-f-]{36}$/i;
const str = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Slug unik: judul → slug, tambah -2, -3, ... kalau sudah dipakai. */
async function uniqueSlug(db: SupabaseClient, table: string, title: string) {
  const base = slugify(title) || "tanpa-judul";
  const { data } = await db.from(table).select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((row: { slug: string }) => row.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${Date.now()}`;
}

export async function executeProposal(db: SupabaseClient, kind: ProposalKind, data: Record<string, unknown>): Promise<ExecuteResult> {
  switch (kind) {
    case "news_draft": {
      const title = str(data.title, 200);
      const body = str(data.body, 60000);
      if (title.length < 3 || body.length < 10) return { ok: false, message: "Judul atau isi draf belum cukup." };
      const slug = await uniqueSlug(db, TABLES.posts, title);
      const { data: row, error } = await db
        .from(TABLES.posts)
        .insert({
          title,
          slug,
          body,
          excerpt: str(data.excerpt, 400) || null,
          category: data.category === "artikel" ? "artikel" : "kabar",
          author: "Tim ENKG",
          published: false,
          published_at: null,
        })
        .select("id")
        .single();
      if (error || !row) return { ok: false, message: "Gagal menyimpan draf." };
      revalidatePath("/admin/news");
      revalidatePath("/admin");
      return { ok: true, message: "Draf News tersimpan.", href: `/admin/news/${row.id}` };
    }

    case "event": {
      const title = str(data.title, 200);
      const startsAt = str(data.starts_at, 40);
      const endsAt = str(data.ends_at, 40) || null;
      const starts = Date.parse(startsAt);
      if (title.length < 3 || Number.isNaN(starts)) return { ok: false, message: "Nama atau tanggal event tidak valid." };
      if (endsAt && !(Date.parse(endsAt) > starts)) return { ok: false, message: "Jam selesai harus setelah jam mulai." };
      const slug = await uniqueSlug(db, TABLES.events, title);
      const { data: row, error } = await db
        .from(TABLES.events)
        .insert({
          title,
          slug,
          category: data.category === "procon" ? "procon" : "gereja",
          description: str(data.description, 20000) || null,
          starts_at: new Date(starts).toISOString(),
          ends_at: endsAt ? new Date(Date.parse(endsAt)).toISOString() : null,
          location: str(data.location, 200) || null,
          address: str(data.address, 400) || null,
          published: data.published === true,
        })
        .select("id")
        .single();
      if (error || !row) return { ok: false, message: "Gagal menyimpan event." };
      revalidatePath("/");
      revalidatePath(`/event/${slug}`);
      revalidatePath("/admin/event");
      revalidatePath("/admin");
      return { ok: true, message: data.published === true ? "Event tersimpan dan terbit." : "Event tersimpan sebagai draf.", href: `/admin/event/${row.id}` };
    }

    case "assign_lg": {
      const personId = str(data.person_id, 60);
      const groupId = str(data.group_id, 60);
      if (!UUID.test(personId) || !UUID.test(groupId)) return { ok: false, message: "Data tidak valid." };
      const [{ data: person }, { data: group }] = await Promise.all([
        db.from(TABLES.people).select("id, life_group_id").eq("id", personId).maybeSingle(),
        db.from(TABLES.lifeGroups).select("id, is_active").eq("id", groupId).maybeSingle(),
      ]);
      if (!person || !group?.is_active) return { ok: false, message: "Jemaat atau Life Group sudah tidak ada." };
      const { error } = await db.from(TABLES.people).update({ life_group_id: groupId, life_group_role: "anggota", edited_by: "Admin" }).eq("id", personId);
      if (error) return { ok: false, message: "Gagal memasukkan ke Life Group." };
      revalidatePath("/admin");
      revalidatePath("/admin/life-group");
      revalidatePath("/admin/jemaat");
      revalidatePath(`/admin/life-group/${groupId}`);
      if (person.life_group_id) revalidatePath(`/admin/life-group/${person.life_group_id}`);
      revalidatePath(`/admin/jemaat/${personId}`);
      revalidatePath("/");
      const notice = await leaderNotice(db, personId);
      return { ok: true, message: notice?.message ?? "Tersimpan.", href: `/admin/life-group/${groupId}`, notify: notice?.notify };
    }

    case "submission_status": {
      const id = str(data.id, 60);
      const status = str(data.status, 12) as SubmissionStatus;
      if (!UUID.test(id) || !(status in SUBMISSION_STATUS_LABEL)) return { ok: false, message: "Data tidak valid." };
      const { data: row, error } = await db.from(TABLES.submissions).update({ status }).eq("id", id).select("id").maybeSingle();
      if (error || !row) return { ok: false, message: "Kiriman tidak ditemukan." };
      revalidatePath("/admin/kontak");
      revalidatePath("/admin");
      return { ok: true, message: `Status jadi “${SUBMISSION_STATUS_LABEL[status]}”.`, href: "/admin/kontak" };
    }

    default:
      return { ok: false, message: "Jenis aksi tidak dikenal." };
  }
}
