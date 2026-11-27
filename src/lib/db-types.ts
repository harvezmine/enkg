/**
 * Tipe baris database admin panel. Semua tabel berawalan `enkg_` (lihat
 * supabase/schema.sql) supaya bisa berbagi project Supabase dengan situs lain.
 */

export const TABLES = {
  posts: "enkg_posts",
  events: "enkg_events",
  submissions: "enkg_contact_submissions",
  lifeGroups: "enkg_life_groups",
  people: "enkg_people",
  relationships: "enkg_relationships",
  teams: "enkg_teams",
  teamMembers: "enkg_team_members",
  accounts: "enkg_accounts",
  lgMaterials: "enkg_lg_materials",
  lgMeetings: "enkg_lg_meetings",
  schedule: "enkg_schedule",
} as const;

export const MEDIA_BUCKET = "enkg-media";
/** Bucket PRIVAT untuk foto jemaat. Dibuka hanya lewat signed URL. */
export const PEOPLE_BUCKET = "enkg-people";
/** Bucket PRIVAT untuk booklet materi Life Group. */
export const MATERIALS_BUCKET = "enkg-materials";

export type PostCategory = "kabar" | "artikel";
export type EventCategory = "gereja" | "procon";
export type SubmissionForm = "lifeGroup" | "prayer";
export type SubmissionStatus = "baru" | "dihubungi" | "selesai";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
  category: PostCategory;
  author: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChurchEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: EventCategory;
  /** Topik ProCon, mis. "Keuangan". */
  topic: string | null;
  /** Mitra, mis. "Bersama blu by BCA Digital". */
  partner: string | null;
  /** Boleh kosong untuk ProCon yang jadwalnya belum diumumkan ("Segera hadir"). */
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  address: string | null;
  map_url: string | null;
  cover_url: string | null;
  register_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactSubmission = {
  id: string;
  form: SubmissionForm;
  name: string;
  gender: string | null;
  phone: string;
  domicile: string | null;
  age_range: string | null;
  life_group: string | null;
  request: string | null;
  status: SubmissionStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

/* ── Database jemaat & pelayanan (internal) ─────────────────────────────── */

export type Gender = "L" | "P";
export type PersonStatus = "baru" | "aktif" | "simpatisan" | "tidak_aktif" | "pindah";
export type LifeGroupRole = "anggota" | "leader";
export type LifeGroupSegment = "family" | "young_professional" | "youth";
/** Cara relasi disimpan. Untuk `orang_tua`, person_id adalah orang tuanya. */
export type RelationKind = "pasangan" | "orang_tua" | "saudara";

export type Person = {
  id: string;
  full_name: string;
  nickname: string | null;
  gender: Gender | null;
  birth_place: string | null;
  /** "yyyy-mm-dd", tanpa jam dan zona waktu. */
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  /** Path di bucket enkg-people, bukan URL. */
  photo_path: string | null;
  address: string | null;
  area: string | null;
  occupation: string | null;
  life_group_id: string | null;
  life_group_role: LifeGroupRole;
  status: PersonStatus;
  joined_on: string | null;
  baptized_on: string | null;
  notes: string | null;
  submission_id: string | null;
  /** "Admin" atau "Leader <nama>": siapa yang terakhir mengubah data ini. */
  edited_by: string | null;
  created_at: string;
  updated_at: string;
};

export type LifeGroup = {
  id: string;
  name: string;
  segment: LifeGroupSegment | null;
  description: string | null;
  /** 0 = Minggu … 6 = Sabtu */
  meeting_day: number | null;
  /** "19:30:00" dari kolom time Postgres. */
  meeting_time: string | null;
  /** INTERNAL, bisa alamat rumah. Jangan pernah tampil publik. */
  location: string | null;
  /** Wilayah singkat yang aman tampil di kalender publik. */
  area: string | null;
  show_on_calendar: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Akun login (email + password). Hak akses: is_admin untuk admin panel;
 * portal Life Group terbuka bila orang yang ditautkan (person_id) adalah
 * leader sebuah Life Group. password_hash jangan pernah dikirim ke browser.
 */
export type Account = {
  id: string;
  email: string;
  name: string;
  person_id: string | null;
  is_admin: boolean;
  password_hash: string;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LgMaterial = {
  id: string;
  title: string;
  summary: string | null;
  body: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  segment: LifeGroupSegment | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LgMeeting = {
  id: string;
  life_group_id: string;
  starts_at: string;
  /** INTERNAL */
  place: string | null;
  topic: string | null;
  material_id: string | null;
  reported_at: string | null;
  attendee_ids: string[];
  guest_count: number;
  report: string | null;
  prayer_requests: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleCategory = "ibadah" | "doa" | "life_group" | "lainnya";
export type ScheduleRecurrence = "weekly" | "monthly_nth" | "once";

export type ScheduleRow = {
  id: string;
  slug: string | null;
  title: string;
  category: ScheduleCategory;
  recurrence: ScheduleRecurrence;
  weekday: number | null;
  nth: number | null;
  on_date: string | null;
  /** "HH:MM:SS" */
  start_time: string;
  end_time: string | null;
  place: string | null;
  mode: "onsite" | "online";
  link_url: string | null;
  note: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Relationship = {
  id: string;
  person_id: string;
  relative_id: string;
  kind: RelationKind;
  /** Hanya untuk `pasangan`: tanggal menikah, "yyyy-mm-dd". */
  married_on: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  person_id: string;
  role: string | null;
  is_lead: boolean;
  created_at: string;
};

/* ── Label bahasa Indonesia ─────────────────────────────────────────────── */

export const POST_CATEGORY_LABEL: Record<PostCategory, string> = {
  kabar: "Kabar",
  artikel: "Artikel",
};

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  gereja: "Event gereja",
  procon: "ProCon",
};

export const SUBMISSION_FORM_LABEL: Record<SubmissionForm, string> = {
  lifeGroup: "Gabung Life Group",
  prayer: "Permohonan Doa",
};

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  baru: "Baru",
  dihubungi: "Sudah dihubungi",
  selesai: "Selesai",
};

export const GENDER_LABEL: Record<Gender, string> = {
  L: "Laki-laki",
  P: "Perempuan",
};

export const PERSON_STATUS_LABEL: Record<PersonStatus, string> = {
  baru: "Jemaat baru",
  aktif: "Jemaat aktif",
  simpatisan: "Simpatisan",
  tidak_aktif: "Tidak aktif",
  pindah: "Pindah gereja",
};

/** Sama dengan tiga Life Group di situs (content/life-group.ts). */
export const LIFE_GROUP_SEGMENT_LABEL: Record<LifeGroupSegment, string> = {
  family: "Family",
  young_professional: "Young Professional",
  youth: "Youth",
};

export const LIFE_GROUP_ROLE_LABEL: Record<LifeGroupRole, string> = {
  anggota: "Anggota",
  leader: "Leader",
};
