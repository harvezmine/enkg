"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { adminDb } from "@/lib/admin-auth";
import { LIFE_GROUP_SEGMENT_LABEL, TABLES, type LifeGroupRole, type LifeGroupSegment } from "@/lib/db-types";
import { bool, nullable, text } from "@/lib/form-data";
import { leaderNotice } from "@/lib/life-group-notify";

import type { ActionState } from "./admin";

/*
 * Aksi Life Group untuk admin. Leader dan anggota dicatat di enkg_people
 * (life_group_id + life_group_role). Status leader inilah yang membuka akses
 * portal leader, jadi hanya admin (adminDb) yang boleh mengubahnya.
 */

export type AssignState = ActionState & { notify?: { href: string; label: string } };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function refresh(...groupIds: (string | null | undefined)[]) {
  revalidatePath("/admin");
  revalidatePath("/admin/life-group");
  revalidatePath("/admin/jemaat");
  for (const id of groupIds) if (id) revalidatePath(`/admin/life-group/${id}`);
  // Jadwal Life Group bisa tampil di kalender publik.
  revalidatePath("/");
}

export async function saveLifeGroup(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id", 60);
  const name = text(fd, "name", 80).replace(/\s+/g, " ");
  const segment = text(fd, "segment", 30);
  const dayRaw = text(fd, "meeting_day", 2);
  const time = text(fd, "meeting_time", 5);
  const day = dayRaw === "" ? null : Number(dayRaw);

  if (name.length < 2) return { status: "error", message: "Nama Life Group terlalu pendek." };
  if (day !== null && !(Number.isInteger(day) && day >= 0 && day <= 6)) {
    return { status: "error", message: "Hari pertemuan tidak valid." };
  }
  if (time && !TIME.test(time)) return { status: "error", message: "Jam pertemuan tidak valid." };

  const payload = {
    name,
    segment: segment in LIFE_GROUP_SEGMENT_LABEL ? (segment as LifeGroupSegment) : null,
    description: nullable(text(fd, "description", 300)),
    meeting_day: day,
    meeting_time: nullable(time),
    location: nullable(text(fd, "location", 300)),
    area: nullable(text(fd, "area", 80)),
    show_on_calendar: bool(fd, "show_on_calendar"),
    is_active: bool(fd, "is_active"),
  };

  const supabase = await adminDb();
  const { data, error } = id
    ? await supabase.from(TABLES.lifeGroups).update(payload).eq("id", id).select("id").single()
    : await supabase.from(TABLES.lifeGroups).insert(payload).select("id").single();

  if (error || !data) {
    console.error("[life-group] save:", error);
    return {
      status: "error",
      message: error?.code === "23505" ? "Sudah ada Life Group dengan nama itu." : "Gagal menyimpan Life Group.",
    };
  }

  refresh(data.id);
  redirect(`/admin/life-group/${data.id}${id ? "?saved=1" : ""}`);
}

export async function deleteLifeGroup(fd: FormData) {
  const id = text(fd, "id", 60);
  const supabase = await adminDb();
  // Leader grup ini kehilangan status leader-nya, jadi akses portalnya ikut tertutup.
  await supabase.from(TABLES.people).update({ life_group_role: "anggota" }).eq("life_group_id", id);
  await supabase.from(TABLES.lifeGroups).delete().eq("id", id);
  refresh();
  redirect("/admin/life-group?deleted=1");
}

/**
 * Masukkan seseorang ke Life Group (atau pindahkan dari grup lamanya).
 * Setelah berhasil, admin mendapat tautan WhatsApp untuk mengabari leader.
 */
export async function assignLifeGroup(_prev: AssignState, fd: FormData): Promise<AssignState> {
  const personId = text(fd, "person_id", 60);
  const groupId = text(fd, "life_group_id", 60);
  const role: LifeGroupRole = text(fd, "role", 10) === "leader" ? "leader" : "anggota";

  if (!personId) return { status: "error", message: "Pilih dulu orangnya." };
  if (!groupId) return { status: "error", message: "Pilih Life Group-nya." };

  const supabase = await adminDb();
  const [{ data: person }, { data: group }] = await Promise.all([
    supabase.from(TABLES.people).select("id, full_name, nickname, phone, life_group_id").eq("id", personId).maybeSingle(),
    supabase.from(TABLES.lifeGroups).select("id, name").eq("id", groupId).maybeSingle(),
  ]);
  if (!person || !group) return { status: "error", message: "Data tidak ditemukan. Muat ulang halaman." };

  const { error } = await supabase
    .from(TABLES.people)
    .update({ life_group_id: groupId, life_group_role: role })
    .eq("id", personId);
  if (error) {
    console.error("[life-group] assign:", error);
    return { status: "error", message: "Gagal memasukkan ke Life Group." };
  }

  refresh(groupId, person.life_group_id);
  revalidatePath(`/admin/jemaat/${personId}`);

  // Dari antrean jemaat baru, kartunya hilang setelah masuk grup. Pesan dan
  // tautan "kabari leader" lalu ditampilkan halaman tujuan lewat ?assigned=.
  const returnTo = text(fd, "return_to", 120);
  if (/^\/admin\/[a-z-]+$/.test(returnTo)) redirect(`${returnTo}?assigned=${personId}`);

  const notice = await leaderNotice(supabase, personId);
  return { status: "success", message: notice?.message ?? "Tersimpan.", notify: notice?.notify };
}

export async function setLifeGroupRole(fd: FormData) {
  const personId = text(fd, "person_id", 60);
  const groupId = text(fd, "life_group_id", 60);
  const role: LifeGroupRole = text(fd, "role", 10) === "leader" ? "leader" : "anggota";

  const supabase = await adminDb();
  // Hanya berlaku bila orangnya memang anggota grup ini.
  await supabase.from(TABLES.people).update({ life_group_role: role }).eq("id", personId).eq("life_group_id", groupId);
  refresh(groupId);
  revalidatePath(`/admin/jemaat/${personId}`);
}

export async function removeFromLifeGroup(fd: FormData) {
  const personId = text(fd, "person_id", 60);
  const supabase = await adminDb();
  const { data } = await supabase
    .from(TABLES.people)
    .update({ life_group_id: null, life_group_role: "anggota" })
    .eq("id", personId)
    .select("id")
    .maybeSingle();
  refresh(text(fd, "life_group_id", 60));
  if (data) revalidatePath(`/admin/jemaat/${personId}`);
}
