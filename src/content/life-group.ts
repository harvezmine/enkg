/**
 * Life Group: jantung pemuridan ENKG, tempat jemaat saling mengenal di luar
 * ibadah Minggu. Nama ketiga kelompok diambil dari Google Form pendaftaran
 * gereja (lihat resources/google-forms.json) dan harus sama dengan
 * LIFE_GROUPS di lib/google-forms.ts, karena `anchor` mengisi pilihan itu
 * otomatis di formulir Terhubung.
 *
 * ⚠️ Keterangan "untuk siapa" dan frekuensi pertemuan masih turunan dari
 * deskripsi Google Form, belum dikonfirmasi pengurus. Jangan tambahkan hari,
 * jam, atau lokasi Life Group sebelum datanya resmi.
 */
export const lifeGroup = {
  title: "Gereja tidak berhenti hari Minggu.",
  intro:
    "Life Group adalah kelompok kecil yang bertemu rutin di luar ibadah. Di sinilah kami saling kenal nama dan saling tahu kabar.",
  quote:
    "Hidup sehari-hari lebih ringan kalau ada yang jalan bareng. Waktu kamu senang, ada yang ikut senang. Waktu kamu berat, ada yang tahu dan mendoakan.",
  groups: [
    { name: "Family", icon: "home", forWhom: "Untuk pasangan dan keluarga.", anchor: "#gabung-family" },
    {
      name: "Young Professional",
      icon: "briefcase",
      forWhom: "Untuk yang sudah bekerja.",
      anchor: "#gabung-young-professional",
    },
    { name: "Youth", icon: "school", forWhom: "Untuk pelajar dan mahasiswa.", anchor: "#gabung-youth" },
  ],
  /**
   * Post asalnya di Instagram gereja memang bicara soal persekutuan dan Life Group
   * ("birthdays, anniversaries, fellowship, and Life Groups"), jadi foto ini jujur
   * dipakai di sini. Lihat resources/instagram/README.md.
   */
  photo: {
    src: "/images/photos/lifegroup-meja.jpg",
    alt: "Jemaat Every Nation Kelapa Gading berkumpul dan makan bersama seusai ibadah",
  },
  reassurance: "Kamu tidak perlu jadi anggota dulu. Datang saja sekali, lihat sendiri.",
  cta: { label: "Gabung Life Group", href: "#gabung-life-group" },
} as const;
