import {
  EVENT_CATEGORY_LABEL,
  LIFE_GROUP_SEGMENT_LABEL,
  POST_CATEGORY_LABEL,
  SUBMISSION_FORM_LABEL,
  SUBMISSION_STATUS_LABEL,
  type ChurchEvent,
  type ContactSubmission,
  type LifeGroup,
  type Person,
  type Post,
  type Team,
} from "../db-types";
import { scheduleLabel } from "../life-groups";
import { formatDate, formatDateTime } from "../utils";

/*
 * Batas data asisten internal. Tentang jemaat, asisten HANYA boleh melihat
 * nama, panggilan, dan nomor WA (plus id internal untuk aksi). Sisanya data
 * pribadi: tanggal lahir, alamat, email, foto, catatan, keluarga, isi doa, dst.
 *
 * Dijaga dua lapis: query memakai daftar kolom di bawah (tidak pernah "*"),
 * lalu setiap baris dilewatkan fungsi proyeksi yang memilih field satu per
 * satu. Tes di projections.test.ts memastikan field terlarang tidak lolos.
 */

/** Kolom jemaat yang boleh diambil dari database. */
export const PERSON_COLUMNS = "id, full_name, nickname, phone";
/** Kolom tambahan khusus untuk menyaring/mengelompokkan di server; tidak pernah dikirim ke AI. */
export const PERSON_FILTER_COLUMNS = "id, full_name, nickname, phone, life_group_id, life_group_role, status";
export const LIFE_GROUP_COLUMNS = "id, name, segment, meeting_day, meeting_time, area, is_active";
export const SUBMISSION_COLUMNS = "id, form, name, phone, status, created_at";
export const EVENT_COLUMNS = "id, slug, title, category, starts_at, ends_at, location, published";
export const POST_COLUMNS = "id, slug, title, category, published, published_at, created_at";
export const TEAM_COLUMNS = "id, name, description, sort_order";

/** Field jemaat yang TIDAK boleh pernah sampai ke AI. */
export const FORBIDDEN_PERSON_FIELDS = [
  "birth_date",
  "birth_place",
  "address",
  "email",
  "photo_path",
  "notes",
  "area",
  "occupation",
  "gender",
  "status",
  "joined_on",
  "baptized_on",
  "married_on",
  "submission_id",
  "edited_by",
  "life_group_id",
] as const;

/** Field kiriman Contact Us yang tidak boleh sampai ke AI (isi doa, domisili, umur, catatan). */
export const FORBIDDEN_SUBMISSION_FIELDS = ["request", "domicile", "age_range", "gender", "admin_notes", "life_group"] as const;

type PersonRow = Pick<Person, "id" | "full_name" | "nickname" | "phone">;

export function personOut(row: PersonRow) {
  return { id: row.id, nama: row.full_name, panggilan: row.nickname ?? null, wa: row.phone ?? null };
}

export function memberOut(row: PersonRow & Pick<Person, "life_group_role">) {
  return { ...personOut(row), peran: row.life_group_role === "leader" ? "leader" : "anggota" };
}

export function lifeGroupOut(group: Pick<LifeGroup, "id" | "name" | "segment" | "meeting_day" | "meeting_time" | "area" | "is_active">) {
  return {
    id: group.id,
    nama: group.name,
    kelompok: group.segment ? LIFE_GROUP_SEGMENT_LABEL[group.segment] : null,
    jadwal: scheduleLabel(group),
    wilayah: group.area ?? null,
    aktif: group.is_active,
  };
}

export function submissionOut(row: Pick<ContactSubmission, "id" | "form" | "name" | "phone" | "status" | "created_at">) {
  return {
    id: row.id,
    nama: row.name,
    wa: row.phone,
    jenis: SUBMISSION_FORM_LABEL[row.form] ?? row.form,
    status: SUBMISSION_STATUS_LABEL[row.status] ?? row.status,
    tanggal: formatDate(row.created_at),
  };
}

export function eventOut(row: Pick<ChurchEvent, "id" | "slug" | "title" | "category" | "starts_at" | "ends_at" | "location" | "published">) {
  return {
    judul: row.title,
    jenis: EVENT_CATEGORY_LABEL[row.category] ?? row.category,
    mulai: row.starts_at ? formatDateTime(row.starts_at) : "Segera hadir",
    lokasi: row.location ?? null,
    terbit: row.published,
    admin: `/admin/event/${row.id}`,
  };
}

export function postOut(row: Pick<Post, "id" | "slug" | "title" | "category" | "published" | "published_at" | "created_at">) {
  return {
    judul: row.title,
    jenis: POST_CATEGORY_LABEL[row.category] ?? row.category,
    terbit: row.published,
    tanggal: formatDate(row.published_at ?? row.created_at),
    admin: `/admin/news/${row.id}`,
  };
}

export function teamOut(team: Pick<Team, "id" | "name" | "description">, members: { nama: string; wa: string | null; peran: string | null; koordinator: boolean }[]) {
  return { nama: team.name, keterangan: team.description ?? null, jumlah: members.length, anggota: members };
}
