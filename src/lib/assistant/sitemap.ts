/*
 * Peta halaman admin untuk asisten: pertanyaan "cara bikin…" dijawab dengan
 * langkah singkat plus tombol ke halamannya. Dipakai juga di UI untuk menolak
 * tautan ke halaman yang tidak ada. Semua alamat dites ada di src/app
 * (sitemap.test.ts). Tidak berisi data, aman ikut ke browser.
 */

export type Destination = { task: string; href: string; steps?: string };

export const DESTINATIONS: Destination[] = [
  { task: "ringkasan admin", href: "/admin" },
  { task: "tambah jemaat baru", href: "/admin/jemaat/baru", steps: "isi nama, Simpan; sisanya boleh menyusul" },
  { task: "cari jemaat (ganti NAMA)", href: "/admin/jemaat?q=NAMA" },
  { task: "semua data jemaat", href: "/admin/jemaat" },
  { task: "impor jemaat dari Excel", href: "/admin/jemaat/impor", steps: "unduh template, isi, unggah, cek, Simpan" },
  { task: "ekspor data jemaat ke Excel", href: "/admin/jemaat-excel/ekspor" },
  { task: "jemaat baru yang menunggu Life Group", href: "/admin/life-group" },
  { task: "buat Life Group baru", href: "/admin/life-group?baru=1" },
  { task: "semua Life Group", href: "/admin/life-group" },
  { task: "buat tim pelayanan baru", href: "/admin/pelayanan?baru=1" },
  { task: "semua tim pelayanan", href: "/admin/pelayanan" },
  { task: "tambah jadwal kalender (ibadah, doa, rutin atau sekali)", href: "/admin/kalender/baru" },
  { task: "kalender gereja", href: "/admin/kalender" },
  { task: "tulis News", href: "/admin/news/baru" },
  { task: "semua News", href: "/admin/news" },
  { task: "buat event gereja", href: "/admin/event/baru" },
  { task: "buat kelas ProCon", href: "/admin/event/baru?kategori=procon" },
  { task: "semua event", href: "/admin/event" },
  { task: "upload materi Life Group (PDF/tulisan)", href: "/admin/materi/baru" },
  { task: "semua materi Life Group", href: "/admin/materi" },
  { task: "Contact Us yang belum ditanggapi", href: "/admin/kontak?status=baru" },
  { task: "semua Contact Us", href: "/admin/kontak" },
  { task: "tambah akun admin atau leader", href: "/admin/pengguna?baru=1", steps: "isi email dan password, pilih data jemaat (wajib untuk leader)" },
  { task: "pengguna & akses", href: "/admin/pengguna" },
  { task: "ganti password sendiri", href: "/admin/akun" },
  { task: "bot Telegram & penerima pengingat", href: "/admin/telegram" },
  { task: "panduan", href: "/admin/panduan" },
];

export const GUIDE_ANCHORS = [
  "tambah-jemaat",
  "impor-excel",
  "keluarga",
  "life-group",
  "leader",
  "pelayanan",
  "kalender",
  "materi",
  "kontak",
  "telegram",
] as const;

/** Halaman per data. {id} diisi dari hasil alat dan hanya muncul di dalam tautan. */
export const ENTITY_LINKS = [
  { what: "profil jemaat (keluarga, Life Group, pelayanan, akun)", href: "/admin/jemaat/{id}" },
  { what: "ubah data jemaat", href: "/admin/jemaat/{id}/ubah" },
  { what: "buat akun login untuk jemaat ini", href: "/admin/jemaat/{id}#akun-portal" },
  { what: "tambah anak yang belum terdaftar", href: "/admin/jemaat/baru?dari={id}&sebagai=anak" },
  { what: "detail Life Group (anggota, leader)", href: "/admin/life-group/{id}" },
  { what: "laporan Life Group", href: "/admin/life-group/{id}/laporan" },
  { what: "detail tim pelayanan", href: "/admin/pelayanan/{id}" },
  { what: "ubah jadwal kalender", href: "/admin/kalender/{id}" },
  { what: "ubah event", href: "/admin/event/{id}" },
  { what: "ubah News", href: "/admin/news/{id}" },
  { what: "ubah materi", href: "/admin/materi/{id}" },
] as const;

/** Rute unduhan (bukan halaman): dibuka sebagai tautan biasa, bukan navigasi klien. */
export const DOWNLOAD_PATHS = ["/admin/jemaat-excel/ekspor", "/admin/jemaat-excel/template"];

const pathOf = (href: string) => href.split(/[?#]/)[0]!;
/** Semua id di database berupa uuid. */
const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

const KNOWN = [
  ...new Set([...DESTINATIONS.map((d) => d.href), ...ENTITY_LINKS.map((e) => e.href), ...DOWNLOAD_PATHS].map(pathOf)),
].map((path) => new RegExp(`^${path.replace(/\{id\}/g, UUID)}/?$`));

/** Benar kalau href menuju halaman admin yang memang ada (query dan anchor diabaikan). */
export function isKnownAdminHref(href: string) {
  if (!href.startsWith("/admin") || /[{}\s\\]|\/\//.test(href)) return false;
  const path = pathOf(href);
  return KNOWN.some((pattern) => pattern.test(path));
}

export function isDownloadHref(href: string) {
  return DOWNLOAD_PATHS.includes(pathOf(href));
}

/** Ringkasan peta untuk prompt sistem, satu baris per tujuan. */
export function sitemapForPrompt() {
  return [
    "Halaman admin (pakai alamat persis):",
    ...DESTINATIONS.map((d) => `- ${d.task}: ${d.href}${d.steps ? ` (${d.steps})` : ""}`),
    `- panduan per topik: /admin/panduan#TOPIK, TOPIK salah satu: ${GUIDE_ANCHORS.join(", ")}`,
    "Halaman per data (ganti {id} dengan id dari hasil alat):",
    ...ENTITY_LINKS.map((e) => `- ${e.what}: ${e.href}`),
  ].join("\n");
}
