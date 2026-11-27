"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PEOPLE_BUCKET, TABLES, type LgMaterial } from "@/lib/db-types";
import { nullable, text } from "@/lib/form-data";
import { groupMembers, requireLeader, type LeaderContext } from "@/lib/leader-auth";
import { phoneDigits, todayWib } from "@/lib/people";
import { parsePersonFields } from "@/lib/person-fields";
import { createAdminClient } from "@/lib/supabase/admin";
import { fromWibInput } from "@/lib/utils";

/*
 * Aksi portal leader Life Group. Setiap aksi diawali
 * requireLeader(), dan setiap query dibatasi ke life_group_id milik leader
 * itu sendiri. id pertemuan dari form hanya dipakai bersama filter grupnya.
 */

export type PortalState = { status: "idle" | "success" | "error"; message?: string };

/* Masuk, keluar, dan ganti password ada di actions/auth.ts (satu akun untuk admin & leader). */

/* ── Pertemuan & laporan ──────────────────────────────────────────────────── */

/** Materi yang boleh dipakai grup ini: terbit, untuk semua atau untuk segmen grupnya. */
async function allowedMaterial(context: LeaderContext, id: string) {
  if (!id) return null;
  const { data } = await context.supabase
    .from(TABLES.lgMaterials)
    .select("id, segment, published")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  const material = data as Pick<LgMaterial, "id" | "segment" | "published"> | null;
  if (!material) return undefined;
  if (material.segment && material.segment !== context.lifeGroup.segment) return undefined;
  return material.id;
}

async function ownMeeting(context: LeaderContext, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await context.supabase
    .from(TABLES.lgMeetings)
    .select("id, starts_at, reported_at")
    .eq("id", id)
    .eq("life_group_id", context.lifeGroup.id)
    .maybeSingle();
  return data as { id: string; starts_at: string; reported_at: string | null } | null;
}

export async function saveMeeting(_prev: PortalState, fd: FormData): Promise<PortalState> {
  const context = await requireLeader();
  const id = text(fd, "id", 60);
  const startsRaw = text(fd, "starts_at", 20);
  const startsAt = fromWibInput(startsRaw);
  if (!startsAt) return { status: "error", message: "Isi tanggal dan jam pertemuan." };

  const materialId = await allowedMaterial(context, text(fd, "material_id", 60));
  if (materialId === undefined) return { status: "error", message: "Materi itu tidak tersedia untuk grup ini." };

  const payload = {
    starts_at: startsAt,
    place: nullable(text(fd, "place", 200)),
    topic: nullable(text(fd, "topic", 160)),
    material_id: materialId,
  };

  if (id) {
    if (!(await ownMeeting(context, id))) return { status: "error", message: "Pertemuan tidak ditemukan." };
    const { error } = await context.supabase
      .from(TABLES.lgMeetings)
      .update(payload)
      .eq("id", id)
      .eq("life_group_id", context.lifeGroup.id);
    if (error) {
      console.error("[portal] saveMeeting:", error);
      return { status: "error", message: "Gagal menyimpan. Coba lagi sebentar." };
    }
    redirect(`/portal/pertemuan/${id}?saved=1`);
  }

  const { data, error } = await context.supabase
    .from(TABLES.lgMeetings)
    .insert({ ...payload, life_group_id: context.lifeGroup.id, created_by: context.account.id })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[portal] saveMeeting:", error);
    return { status: "error", message: "Gagal menyimpan. Coba lagi sebentar." };
  }
  redirect(`/portal/pertemuan/${data.id}?saved=1`);
}

/** Laporan boleh diisi mulai satu jam sebelum jadwal (kalau leader mengisi di tempat). */
const REPORT_EARLY_MS = 60 * 60 * 1000;

export async function saveReport(_prev: PortalState, fd: FormData): Promise<PortalState> {
  const context = await requireLeader();
  const meeting = await ownMeeting(context, text(fd, "id", 60));
  if (!meeting) return { status: "error", message: "Pertemuan tidak ditemukan." };
  if (new Date(meeting.starts_at).getTime() - REPORT_EARLY_MS > Date.now()) {
    return { status: "error", message: "Laporan bisa diisi setelah pertemuannya berlangsung." };
  }

  // Yang hadir hanya boleh anggota grup ini; id lain dari form dibuang.
  const { members } = await groupMembers(context);
  const memberIds = new Set(members.map((member) => member.id));
  const attendees = [...new Set(fd.getAll("attendee").map(String))].filter((id) => memberIds.has(id));

  const guests = Number.parseInt(text(fd, "guest_count", 4) || "0", 10);
  if (!Number.isInteger(guests) || guests < 0 || guests > 500) {
    return { status: "error", message: "Jumlah tamu tidak valid." };
  }

  const report = text(fd, "report", 8000);
  if (!attendees.length && !guests && !report) {
    return { status: "error", message: "Centang siapa saja yang hadir atau tulis catatan pertemuannya." };
  }

  const { error } = await context.supabase
    .from(TABLES.lgMeetings)
    .update({
      attendee_ids: attendees,
      guest_count: guests,
      report: nullable(report),
      prayer_requests: nullable(text(fd, "prayer_requests", 8000)),
      reported_at: meeting.reported_at ?? new Date().toISOString(),
    })
    .eq("id", meeting.id)
    .eq("life_group_id", context.lifeGroup.id);

  if (error) {
    console.error("[portal] saveReport:", error);
    return { status: "error", message: "Gagal menyimpan laporan. Coba lagi sebentar." };
  }
  redirect(`/portal/pertemuan/${meeting.id}?laporan=1`);
}

export async function deleteMeeting(fd: FormData) {
  const context = await requireLeader();
  const meeting = await ownMeeting(context, text(fd, "id", 60));
  if (meeting) {
    await context.supabase.from(TABLES.lgMeetings).delete().eq("id", meeting.id).eq("life_group_id", context.lifeGroup.id);
  }
  redirect("/portal/pertemuan?deleted=1");
}

/* ── Data anggota ─────────────────────────────────────────────────────────── */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Leader memperbarui data diri anggota grupnya sendiri. Hanya field di
 * LEADER_EDITABLE_FIELDS yang dibaca; status, catatan pengurus, Life Group,
 * dan peran tetap urusan admin. Setiap query dibatasi life_group_id leader.
 */
export async function saveMember(_prev: PortalState, fd: FormData): Promise<PortalState> {
  const context = await requireLeader();
  const { supabase, lifeGroup } = context;
  const id = text(fd, "id", 60);
  if (!UUID.test(id)) return { status: "error", message: "Anggota tidak ditemukan." };

  const parsed = parsePersonFields((key) => fd.get(key), todayWib());
  if (!parsed.ok) return { status: "error", message: parsed.message };
  const fields = parsed.fields;

  const { data: current } = await supabase
    .from(TABLES.people)
    .select("id, photo_path")
    .eq("id", id)
    .eq("life_group_id", lifeGroup.id)
    .maybeSingle();
  if (!current) return { status: "error", message: "Anggota ini tidak ada di grup kamu." };

  // Foto baru tidak boleh menunjuk foto milik orang lain: kalau nanti diganti,
  // foto orang itu ikut terhapus dari Storage.
  if (fields.photo_path && fields.photo_path !== current.photo_path) {
    const { data: taken } = await supabase
      .from(TABLES.people)
      .select("id")
      .eq("photo_path", fields.photo_path)
      .neq("id", id)
      .limit(1);
    if (taken?.length) return { status: "error", message: "Foto tidak valid. Unggah ulang fotonya." };
  }

  const leaderName = context.person.nickname || context.person.full_name.split(" ")[0];
  const { data: updated, error } = await supabase
    .from(TABLES.people)
    .update({ ...fields, edited_by: `Leader ${leaderName}` })
    .eq("id", id)
    .eq("life_group_id", lifeGroup.id)
    .select("id");

  if (error) {
    console.error("[portal] saveMember:", error);
    return { status: "error", message: "Gagal menyimpan. Coba lagi sebentar." };
  }
  if (updated?.length !== 1) return { status: "error", message: "Anggota ini tidak ada di grup kamu." };

  // Foto lama dibuang hanya bila memang milik orang ini dan tidak dipakai data lain.
  if (current.photo_path && current.photo_path !== fields.photo_path) {
    const { data: shared } = await supabase.from(TABLES.people).select("id").eq("photo_path", current.photo_path).limit(1);
    if (!shared?.length) await supabase.storage.from(PEOPLE_BUCKET).remove([current.photo_path]);
  }

  revalidatePath("/portal");
  revalidatePath("/portal/anggota");
  revalidatePath("/admin/jemaat");
  revalidatePath(`/admin/jemaat/${id}`);
  redirect(`/portal/anggota?diubah=${id}#anggota-${id}`);
}
