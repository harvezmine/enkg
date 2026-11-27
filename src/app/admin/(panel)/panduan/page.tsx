import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { AdminPageHeader, Card } from "@/components/admin/ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Panduan" };

type Guide = {
  id: string;
  title: string;
  summary: string;
  icon: (props: { className?: string }) => ReactNode;
  /** **teks** dicetak tebal: nama tombol atau menu yang perlu dicari di layar. */
  steps: string[];
  tip?: string;
  links: { href: string; label: string }[];
};

const GUIDES: Guide[] = [
  {
    id: "tambah-jemaat",
    title: "Menambah data jemaat",
    summary: "Satu orang, satu kartu. Cukup nama dulu, sisanya bisa dilengkapi kapan saja.",
    icon: Icon.addressBook,
    steps: [
      "Buka menu **Data jemaat**, lalu tekan **Jemaat baru**.",
      "Isi nama lengkap. Kolom lain boleh dikosongkan dulu.",
      "Kalau tahu, isi tanggal lahir. Ulang tahunnya nanti muncul di Ringkasan dan dikirim ke Telegram pengurus.",
      "Tekan **Simpan**. Kartunya langsung muncul di Data jemaat.",
    ],
    tip: "Untuk orang yang baru datang, pilih status Jemaat baru. Ia otomatis masuk antrean di halaman Life Group.",
    links: [
      { href: "/admin/jemaat/baru", label: "Tambah jemaat" },
      { href: "/admin/jemaat", label: "Buka Data jemaat" },
    ],
  },
  {
    id: "impor-excel",
    title: "Memasukkan banyak data sekaligus dari Excel",
    summary: "Punya daftar jemaat di Excel? Tidak perlu diketik ulang satu per satu.",
    icon: Icon.news,
    steps: [
      "Buka **Data jemaat**, lalu tekan **Impor Excel**.",
      "Tekan **Unduh template**, lalu isi satu baris untuk satu orang. File Excel lama juga boleh langsung dipakai, asal ada kolom nama.",
      "Pilih filenya. Semua baris diperiksa dulu, belum ada yang disimpan.",
      "Lihat kartu yang berwarna kuning atau merah. Kuning artinya ada yang perlu dicek, merah artinya baris itu tidak bisa disimpan (misalnya nama kosong).",
      "Kalau ada orang yang sudah terdaftar, pilih **Lewati** atau **Perbarui**.",
      "Tekan **Simpan**, tunggu sampai selesai.",
    ],
    tip: "Kolom yang kosong di Excel tidak menghapus data yang sudah ada. Untuk cadangan, tekan Ekspor di Data jemaat.",
    links: [
      { href: "/admin/jemaat/impor", label: "Impor dari Excel" },
      { href: "/admin/jemaat-excel/template", label: "Unduh template" },
    ],
  },
  {
    id: "keluarga",
    title: "Mencatat keluarga dan tanggal menikah",
    summary: "Hubungkan suami, istri, anak, dan orang tua supaya terlihat sebagai satu keluarga.",
    icon: Icon.heart,
    steps: [
      "Buka kartu salah satu anggota keluarga, misalnya sang ayah.",
      "Di bagian **Keluarga**, tekan **Tambah anggota keluarga**.",
      "Pilih hubungannya (Suami / istri, Anak, Ayah / ibu, atau Kakak / adik), lalu ketik namanya dan pilih orangnya.",
      "Orangnya belum terdaftar? Tekan **Belum terdaftar? Isi data baru**. Alamat dan wilayahnya ikut terisi.",
      "Untuk suami atau istri, isi **Tanggal menikah** supaya anniversary-nya diingatkan.",
    ],
    tip: "Saat menambah anak, biarkan centang \"Catat juga sebagai anak (nama pasangan)\" supaya anak itu langsung tercatat di ayah dan ibunya.",
    links: [{ href: "/admin/jemaat", label: "Buka Data jemaat" }],
  },
  {
    id: "life-group",
    title: "Life Group dan jemaat baru",
    summary: "Setiap jemaat baru sebaiknya cepat punya Life Group dan disapa leadernya.",
    icon: Icon.home,
    steps: [
      "Buka **Life Group**, tekan **Life Group baru**, lalu isi nama, hari, dan jam pertemuannya.",
      "Jemaat baru yang belum punya grup muncul di bagian **Jemaat baru menunggu Life Group**.",
      "Pilih grupnya di kartu orang itu, lalu tekan **Masukkan**.",
      "Tekan tombol hijau **Kabari (nama leader) lewat WhatsApp** supaya leadernya langsung menyapa.",
    ],
    tip: "Pendaftaran Gabung Life Group dari situs bisa dijadikan data jemaat lewat tombol Daftarkan sebagai jemaat baru di menu Contact Us.",
    links: [{ href: "/admin/life-group", label: "Buka Life Group" }],
  },
  {
    id: "leader",
    title: "Menunjuk leader dan mendaftarkan akun",
    summary: "Admin dan leader masuk dengan email dan password masing-masing. Leader punya portal sendiri untuk grupnya.",
    icon: Icon.star,
    steps: [
      "Buka Life Group-nya. Di **Masukkan ke grup ini**, cari namanya dan pilih **Sebagai: Leader**. Bisa juga tekan **Jadikan leader** di kartu anggota.",
      "Tekan nama leader itu untuk membuka datanya. Di bagian **Akun login**, isi emailnya lalu tekan **Buat akun**. Untuk admin, buka **Pengguna & akses** lalu **Tambah pengguna** dan centang **Admin**.",
      "Password sementara hanya tampil sekali. Tekan **Kirim lewat WhatsApp** atau **Salin** supaya sampai ke orangnya.",
      "Semua orang masuk di alamat situs ditambah /masuk (misalnya everynationkg.com/masuk) dengan email dan password itu, lalu membuat password sendiri.",
    ],
    tip: "Admin yang juga leader melihat tombol **Portal Life Group** di admin panel, jadi tidak perlu login dua kali. Leader hanya bisa melihat dan mengubah data anggota grupnya sendiri.",
    links: [
      { href: "/admin/life-group", label: "Buka Life Group" },
      { href: "/admin/pengguna", label: "Pengguna & akses" },
    ],
  },
  {
    id: "pelayanan",
    title: "Tim pelayanan",
    summary: "Catat siapa saja yang melayani dan perannya masing-masing.",
    icon: Icon.heartHandshake,
    steps: [
      "Buka **Pelayanan**. Tim seperti Musisi, Singer, dan Usher sudah disiapkan. Tim lain bisa ditambah lewat **Tim baru**.",
      "Buka timnya, lalu cari nama orangnya di **Tambah pelayan**.",
      "Isi perannya kalau perlu, misalnya Keyboard atau Pintu depan. Centang **Koordinator tim** untuk penanggung jawabnya.",
      "Tekan **Simpan pelayanan**.",
    ],
    links: [{ href: "/admin/pelayanan", label: "Buka Pelayanan" }],
  },
  {
    id: "kalender",
    title: "Jadwal di kalender",
    summary: "Kalender ini tampil di halaman utama situs, jadi pastikan jamnya selalu benar.",
    icon: Icon.calendar,
    steps: [
      "Buka **Kalender**. Jadwal ibadah dan doa rutin sudah terisi.",
      "Tekan jadwal yang mau diubah, atau tekan **Jadwal baru** untuk menambah.",
      "Pilih ulangannya: setiap minggu, minggu ke-berapa setiap bulan, atau sekali saja.",
      "Tekan **Simpan**. Kalender di halaman utama ikut berubah.",
    ],
    tip: "Jadwal Life Group diatur dari halaman Life Group (hari dan jam pertemuan), bukan dari Kalender. Grup yang belum punya jadwal tetap tidak tampil di situs.",
    links: [
      { href: "/admin/kalender", label: "Buka Kalender" },
      { href: "/#kalender", label: "Lihat di situs" },
    ],
  },
  {
    id: "materi",
    title: "Materi Life Group",
    summary: "Bahan pertemuan yang bisa dibaca dan diunduh para leader dari portal mereka.",
    icon: Icon.news,
    steps: [
      "Buka **Materi LG**, lalu tekan **Materi baru**.",
      "Tulis materinya, atau unggah booklet PDF (paling besar 25 MB).",
      "Pilih untuk kelompok mana, lalu nyalakan **Terbitkan** supaya leader bisa membacanya.",
      "Tekan **Simpan**.",
    ],
    links: [{ href: "/admin/materi", label: "Buka Materi LG" }],
  },
  {
    id: "kontak",
    title: "Kiriman Contact Us",
    summary: "Pendaftaran Life Group dan permohonan doa dari situs masuk ke sini.",
    icon: Icon.inbox,
    steps: [
      "Buka **Contact Us**. Angka kuning di menu menunjukkan jumlah kiriman yang belum ditanggapi.",
      "Tekan nomor WhatsApp pengirim untuk langsung menghubunginya.",
      "Ubah status jadi **Sudah dihubungi** atau **Selesai**, tulis catatan kalau perlu, lalu tekan **Simpan**.",
      "Untuk pendaftar Life Group, tekan **Daftarkan sebagai jemaat baru** supaya datanya masuk ke Data jemaat.",
    ],
    links: [{ href: "/admin/kontak", label: "Buka Contact Us" }],
  },
  {
    id: "telegram",
    title: "Bot Telegram pengurus",
    summary: "Pengingat dan pemberitahuan dikirim langsung ke Telegram masing-masing pengurus.",
    icon: Icon.message,
    steps: [
      "Buka **Bot Telegram**, lalu tambahkan nama dan nomor Telegram setiap pengurus yang mau menerima pengingat.",
      "Minta orang itu membuka **@enkgbot** di Telegram, tekan **Mulai**, lalu tekan tombol **Kirim nomor saya**.",
      "Setelah tersambung, setiap pagi ia menerima ringkasan: ulang tahun, anniversary, dan jadwal hari itu. Jemaat baru dan permohonan doa dikirim saat masuk.",
      "Jemaat baru bisa langsung dimasukkan ke Life Group dengan menekan tombol nama grupnya di Telegram.",
    ],
    tip: "Hanya nomor yang didaftarkan di sini yang bisa memakai bot. Orang lain yang membuka @enkgbot tidak mendapat data apa pun.",
    links: [{ href: "/admin/telegram", label: "Buka Bot Telegram" }],
  },
];

/** **teks** → teks tebal. Cukup untuk menandai nama tombol di langkah-langkah. */
function Emphasis({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, index) =>
        index % 2 ? (
          <strong key={index} className="font-semibold text-ink">
            {part}
          </strong>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export default function PanduanPage() {
  return (
    <>
      <AdminPageHeader
        title="Panduan"
      />

      <nav aria-label="Daftar topik" className="mb-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {GUIDES.map(({ id, title, icon: GuideIcon }) => (
          <a
            key={id}
            href={`#${id}`}
            className="group flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-ink/8 transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700 transition-colors group-hover:bg-navy-700 group-hover:text-cream-100">
              <GuideIcon className="h-5 w-5" />
            </span>
            <span className="text-[15px] font-semibold text-ink">{title}</span>
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        {GUIDES.map((guide) => (
          <Card key={guide.id} className="scroll-mt-24 p-5 sm:p-7">
            <section id={guide.id} aria-labelledby={`${guide.id}-judul`} className="scroll-mt-24">
              <div className="flex items-start gap-4">
                <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sun-400/25 text-navy-800 sm:grid">
                  <guide.icon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h2 id={`${guide.id}-judul`} className="font-display text-xl font-bold text-ink sm:text-2xl">
                    {guide.title}
                  </h2>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{guide.summary}</p>
                </div>
              </div>

              <ol className="mt-5 space-y-3.5">
                {guide.steps.map((step, index) => (
                  <li key={step} className="flex gap-3.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-700 text-sm font-bold text-cream-100">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-[15px] leading-relaxed text-ink-soft">
                      <Emphasis text={step} />
                    </p>
                  </li>
                ))}
              </ol>

              {guide.tip && (
                <p className="mt-5 rounded-2xl bg-cream-100 p-4 text-[15px] leading-relaxed text-ink">
                  <span className="font-semibold">Tips: </span>
                  {guide.tip}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {guide.links.map((link, index) => {
                  const className = `btn px-4 py-2.5 text-sm ${index === 0 ? "btn-navy" : "btn-outline"}`;
                  const content = (
                    <>
                      {link.label}
                      <Icon.arrowRight className="h-4 w-4" />
                    </>
                  );
                  // Unduhan file dan halaman situs dibuka sebagai tautan biasa, bukan navigasi panel.
                  return link.href.startsWith("/admin/jemaat-excel") || link.href.startsWith("/#") ? (
                    <a key={link.href} href={link.href} target={link.href.startsWith("/#") ? "_blank" : undefined} className={className}>
                      {content}
                    </a>
                  ) : (
                    <Link key={link.href} href={link.href} className={className}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </section>
          </Card>
        ))}
      </div>
    </>
  );
}
