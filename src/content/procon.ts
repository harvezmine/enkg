/**
 * ProCon — pertemuan & jejaring profesional. Detail program nantinya tinggal di
 * situs Janji Pengharapan (folder jp/); deskripsinya diambil dari jp/src/lib/ruang.ts.
 *
 * ⚠️ PLACEHOLDER: event di bawah masih contoh. Ganti judul, tanggal, dan link
 * setelah jadwal resmi keluar. `date: null` ditampilkan sebagai "Segera hadir".
 */

export const procon = {
  name: "ProCon",
  tagline: "Pertemuan dan jejaring untuk para profesional.",
  intro:
    "Kelas dan diskusi pengembangan diri untuk pelajar, mahasiswa, profesional, dan pemimpin yang ingin terus bertumbuh di pekerjaan, keuangan, dan kepemimpinan.",
  when: "Sebulan sekali",
  format: "Tatap muka di Jakarta",
  partnerSite: { name: "Janji Pengharapan", url: "https://janjipengharapan.com" },
} as const;

export type ProconEvent = {
  id: string;
  title: string;
  topic: string;
  summary: string;
  /** yyyy-mm-dd, atau null bila jadwal belum diumumkan */
  date: string | null;
  partner?: string;
  href?: string;
};

export const proconEvents: ProconEvent[] = [
  {
    id: "monetize-with-ai",
    title: "Monetize with AI",
    topic: "Teknologi & karier",
    summary: "Memanfaatkan AI untuk bekerja lebih produktif dan membuka peluang penghasilan baru.",
    date: null,
  },
  {
    id: "kelola-uang",
    title: "Mengelola Uang dengan Bijak",
    topic: "Keuangan",
    summary: "Mengatur arus kas, menabung, dan merencanakan keuangan pribadi maupun keluarga.",
    date: null,
    partner: "Bersama blu by BCA Digital",
  },
  {
    id: "c-level",
    title: "C-Level Leadership Class",
    topic: "Kepemimpinan",
    summary: "Kelas kepemimpinan untuk pemimpin tim, pemilik usaha, dan eksekutif.",
    date: null,
  },
];
