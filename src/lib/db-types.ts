/**
 * Tipe baris database admin panel. Semua tabel berawalan `enkg_` (lihat
 * supabase/schema.sql) supaya bisa berbagi project Supabase dengan situs lain.
 */

export const TABLES = {
  posts: "enkg_posts",
  events: "enkg_events",
  submissions: "enkg_contact_submissions",
} as const;

export const MEDIA_BUCKET = "enkg-media";

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
