"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { adminDb } from "@/lib/admin-auth";
import { PEOPLE_BUCKET, PERSON_STATUS_LABEL, TABLES, type PersonStatus } from "@/lib/db-types";
import { bool, nullable, text } from "@/lib/form-data";
import { RELATION_AS_OPTIONS, isValidDate, phoneDigits, toStoredRelation, todayWib, type RelationAs } from "@/lib/people";
import { notifyNewMember } from "@/lib/telegram/notify";

import type { ActionState } from "./admin";

/*
 * Aksi database jemaat & pelayanan. Sama seperti actions/admin.ts, setiap
 * aksi mengambil klien lewat adminDb() yang menolak permintaan tanpa sesi
 * admin, karena data ini berisi alamat, tanggal lahir, dan nomor pribadi.
 */

/** Path foto hasil /admin/upload/foto: "<uuid>.jpg". Path lain ditolak. */
const PHOTO_PATH = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isRelationAs = (value: string): value is RelationAs => RELATION_AS_OPTIONS.some((option) => option.value === value);

function refreshPeople(...ids: (string | null | undefined)[]) {
  revalidatePath("/admin");
  revalidatePath("/admin/jemaat");
  revalidatePath("/admin/pelayanan");
  for (const id of ids) if (id) revalidatePath(`/admin/jemaat/${id}`);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Jemaat
   ═══════════════════════════════════════════════════════════════════════════ */

export async function savePerson(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id", 60);
  const fullName = text(fd, "full_name", 160).replace(/\s+/g, " ");
  const email = text(fd, "email", 200).toLowerCase();
  const phone = text(fd, "phone", 40);
  const photoPath = text(fd, "photo_path", 120);
  const status = text(fd, "status", 20) as PersonStatus;
  const gender = text(fd, "gender", 2);
  const lifeGroupId = text(fd, "life_group_id", 60);
  const submissionId = text(fd, "submission_id", 60);

  const dates = {
    birth_date: text(fd, "birth_date", 10),
    joined_on: text(fd, "joined_on", 10),
    baptized_on: text(fd, "baptized_on", 10),
  };
  const today = todayWib();

  if (fullName.length < 2) return { status: "error", message: "Nama lengkap wajib diisi." };
  if (Object.values(dates).some((value) => value && !isValidDate(value))) {
    return { status: "error", message: "Ada tanggal yang tidak valid. Periksa lagi tanggal lahir, bergabung, atau baptis." };
  }
  if (dates.birth_date && dates.birth_date > today) {
    return { status: "error", message: "Tanggal lahir tidak boleh setelah hari ini." };
  }
  if (phone && !/^\d{8,15}$/.test(phoneDigits(phone))) {
    return { status: "error", message: "Nomor WhatsApp sepertinya belum lengkap. Tulis seperti 0812 3456 7890." };
  }
  if (email && !EMAIL.test(email)) return { status: "error", message: "Alamat email belum benar." };
  if (photoPath && !PHOTO_PATH.test(photoPath)) return { status: "error", message: "Foto tidak valid. Unggah ulang fotonya." };

  const payload = {
    full_name: fullName,
    nickname: nullable(text(fd, "nickname", 60)),
    gender: gender === "L" || gender === "P" ? gender : null,
    birth_place: nullable(text(fd, "birth_place", 80)),
    birth_date: nullable(dates.birth_date),
    phone: nullable(phone),
    email: nullable(email),
    photo_path: nullable(photoPath),
    address: nullable(text(fd, "address", 400)),
    area: nullable(text(fd, "area", 80)),
    occupation: nullable(text(fd, "occupation", 120)),
    life_group_id: nullable(lifeGroupId),
    life_group_role: lifeGroupId && text(fd, "life_group_role", 10) === "leader" ? "leader" : "anggota",
    status: status in PERSON_STATUS_LABEL ? status : "aktif",
    joined_on: nullable(dates.joined_on),
    baptized_on: nullable(dates.baptized_on),
    notes: nullable(text(fd, "notes", 4000)),
    edited_by: "Admin",
    // Asal kiriman Contact Us hanya dicatat saat data pertama kali dibuat.
    ...(!id && submissionId ? { submission_id: submissionId } : {}),
  };

  const supabase = await adminDb();

  let previousPhoto: string | null = null;
  if (id) {
    const { data } = await supabase.from(TABLES.people).select("photo_path").eq("id", id).maybeSingle();
    previousPhoto = data?.photo_path ?? null;
  }
  // Path foto milik orang lain tidak boleh dipakai: saat foto diganti, file lama dihapus.
  if (payload.photo_path && payload.photo_path !== previousPhoto) {
    const { data: owner } = await supabase.from(TABLES.people).select("id").eq("photo_path", payload.photo_path).limit(1).maybeSingle();
    if (owner && owner.id !== id) return { status: "error", message: "Foto tidak valid. Unggah ulang fotonya." };
  }

  const { data, error } = id
    ? await supabase.from(TABLES.people).update(payload).eq("id", id).select("id").single()
    : await supabase.from(TABLES.people).insert(payload).select("id").single();

  if (error || !data) {
    console.error("[jemaat] savePerson:", error);
    return { status: "error", message: "Gagal menyimpan. Coba lagi sebentar." };
  }

  // Foto lama yang diganti atau dihapus ikut dibuang dari Storage, kecuali masih dipakai orang lain.
  const { count: sharedPhoto } = previousPhoto
    ? await supabase.from(TABLES.people).select("id", { count: "exact", head: true }).eq("photo_path", previousPhoto)
    : { count: 0 };
  if (previousPhoto && previousPhoto !== payload.photo_path && !sharedPhoto) {
    await supabase.storage.from(PEOPLE_BUCKET).remove([previousPhoto]);
  }

  // Jemaat baru yang belum punya Life Group dikabarkan ke grup Telegram pengurus,
  // lengkap dengan tombol untuk langsung memasukkannya ke Life Group.
  if (!id && payload.status === "baru" && !payload.life_group_id) {
    const personId = data.id;
    after(() => notifyNewMember({ personId }));
  }

  // Dibuat dari tombol "Tambah anggota keluarga": langsung catat relasinya.
  const relateTo = text(fd, "relate_to", 60);
  const relateAs = text(fd, "relate_as", 20);
  if (!id && relateTo && isRelationAs(relateAs)) {
    await linkRelatives(supabase, relateTo, data.id, relateAs, fd.getAll("also_parent").map(String));
    refreshPeople(relateTo, data.id);
    redirect(`/admin/jemaat/${relateTo}?saved=keluarga`);
  }

  refreshPeople(data.id);
  redirect(`/admin/jemaat/${data.id}?saved=1`);
}

export async function deletePerson(fd: FormData) {
  const id = text(fd, "id", 60);
  const supabase = await adminDb();
  const { data } = await supabase.from(TABLES.people).delete().eq("id", id).select("photo_path").maybeSingle();
  if (data?.photo_path) await supabase.storage.from(PEOPLE_BUCKET).remove([data.photo_path]);
  refreshPeople();
  redirect("/admin/jemaat?deleted=1");
}

/* ═══════════════════════════════════════════════════════════════════════════
   Relasi keluarga
   ═══════════════════════════════════════════════════════════════════════════ */

type Db = Awaited<ReturnType<typeof adminDb>>;

/**
 * "relativeId adalah `as` dari viewerId". Untuk anak, `alsoParentIds` (biasanya
 * pasangan si orang tua) ikut dicatat sebagai orang tuanya, supaya pengurus
 * tidak perlu memasukkan anak yang sama dua kali.
 */
async function linkRelatives(
  supabase: Db,
  viewerId: string,
  relativeId: string,
  as: RelationAs,
  alsoParentIds: string[] = [],
  marriedOn: string | null = null,
) {
  const { error } = await supabase
    .from(TABLES.relationships)
    .insert({ ...toStoredRelation(viewerId, relativeId, as), married_on: as === "pasangan" ? marriedOn : null });
  if (error) return error;

  if (as === "anak") {
    const extra = alsoParentIds
      .filter((parentId) => parentId && parentId !== viewerId && parentId !== relativeId)
      .map((parentId) => toStoredRelation(parentId, relativeId, "anak"));
    // Kalau salah satunya sudah tercatat, sisanya tetap dicoba satu per satu.
    for (const row of extra) await supabase.from(TABLES.relationships).insert(row);
  }
  return null;
}

export async function addRelative(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const viewerId = text(fd, "person_id", 60);
  const relativeId = text(fd, "relative_id", 60);
  const as = text(fd, "as", 20);

  if (!relativeId) return { status: "error", message: "Pilih dulu orangnya." };
  if (relativeId === viewerId) return { status: "error", message: "Tidak bisa menghubungkan seseorang dengan dirinya sendiri." };
  if (!isRelationAs(as)) return { status: "error", message: "Pilih hubungan keluarganya." };
  const marriedOn = text(fd, "married_on", 10);
  if (marriedOn && (!isValidDate(marriedOn) || marriedOn > todayWib())) {
    return { status: "error", message: "Tanggal menikah tidak valid." };
  }

  const supabase = await adminDb();
  const error = await linkRelatives(supabase, viewerId, relativeId, as, fd.getAll("also_parent").map(String), marriedOn || null);

  if (error) {
    console.error("[jemaat] addRelative:", error);
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "Keduanya sudah tercatat punya hubungan keluarga. Hapus yang lama dulu kalau mau mengubahnya."
          : "Gagal menyimpan hubungan keluarga.",
    };
  }

  refreshPeople(viewerId, relativeId, ...fd.getAll("also_parent").map(String));
  return { status: "success", message: "Anggota keluarga ditambahkan." };
}

/** Ubah tanggal menikah sepasang suami-istri (dipakai untuk pengingat anniversary). */
export async function setMarriedOn(fd: FormData) {
  const marriedOn = text(fd, "married_on", 10);
  if (marriedOn && (!isValidDate(marriedOn) || marriedOn > todayWib())) return;
  const supabase = await adminDb();
  const { data } = await supabase
    .from(TABLES.relationships)
    .update({ married_on: marriedOn || null })
    .eq("id", text(fd, "id", 60))
    .eq("kind", "pasangan")
    .select("person_id, relative_id")
    .maybeSingle();
  refreshPeople(data?.person_id, data?.relative_id);
}

export async function removeRelative(fd: FormData) {
  const supabase = await adminDb();
  const { data } = await supabase
    .from(TABLES.relationships)
    .delete()
    .eq("id", text(fd, "id", 60))
    .select("person_id, relative_id")
    .maybeSingle();
  refreshPeople(data?.person_id, data?.relative_id);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Pelayanan
   ═══════════════════════════════════════════════════════════════════════════ */

/** Tambah orang ke tim, atau perbarui perannya kalau sudah ada di tim itu. */
export async function saveMembership(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const teamId = text(fd, "team_id", 60);
  const personId = text(fd, "person_id", 60);
  if (!teamId) return { status: "error", message: "Pilih dulu timnya." };
  if (!personId) return { status: "error", message: "Pilih dulu orangnya." };

  const supabase = await adminDb();
  const { error } = await supabase
    .from(TABLES.teamMembers)
    .upsert(
      { team_id: teamId, person_id: personId, role: nullable(text(fd, "role", 60)), is_lead: bool(fd, "is_lead") },
      { onConflict: "team_id,person_id" },
    );

  if (error) {
    console.error("[pelayanan] saveMembership:", error);
    return { status: "error", message: "Gagal menyimpan pelayanan." };
  }

  refreshPeople(personId);
  revalidatePath(`/admin/pelayanan/${teamId}`);
  return { status: "success", message: "Tersimpan." };
}

export async function removeMembership(fd: FormData) {
  const supabase = await adminDb();
  const { data } = await supabase
    .from(TABLES.teamMembers)
    .delete()
    .eq("id", text(fd, "id", 60))
    .select("team_id, person_id")
    .maybeSingle();
  refreshPeople(data?.person_id);
  if (data?.team_id) revalidatePath(`/admin/pelayanan/${data.team_id}`);
}

export async function saveTeam(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id", 60);
  const name = text(fd, "name", 60).replace(/\s+/g, " ");
  const order = Number.parseInt(text(fd, "sort_order", 6), 10);
  if (name.length < 2) return { status: "error", message: "Nama tim terlalu pendek." };

  const payload = {
    name,
    description: nullable(text(fd, "description", 200)),
    ...(Number.isFinite(order) ? { sort_order: order } : {}),
  };

  const supabase = await adminDb();
  const { data, error } = id
    ? await supabase.from(TABLES.teams).update(payload).eq("id", id).select("id").single()
    : await supabase.from(TABLES.teams).insert(payload).select("id").single();

  if (error || !data) {
    console.error("[pelayanan] saveTeam:", error);
    return {
      status: "error",
      message: error?.code === "23505" ? "Sudah ada tim dengan nama itu." : "Gagal menyimpan tim.",
    };
  }

  refreshPeople();
  revalidatePath(`/admin/pelayanan/${data.id}`);
  redirect(`/admin/pelayanan/${data.id}${id ? "?saved=1" : ""}`);
}

export async function deleteTeam(fd: FormData) {
  const supabase = await adminDb();
  await supabase.from(TABLES.teams).delete().eq("id", text(fd, "id", 60));
  refreshPeople();
  redirect("/admin/pelayanan?deleted=1");
}
