# ENKG Website Revamp — Implementation Plan

**Goal:** Membangun ulang situs Every Nation Kelapa Gading sebagai satu halaman utama yang rapi (Hero → Pelayanan → Kabar & Khotbah → Kenapa Kami Ada → Terhubung), menggantikan Linktree sebagai pintu masuk jemaat dan tamu baru.

**Architecture:** Next.js 15 App Router, dirender statis. Konten tinggal di file TypeScript/JSON di `src/content/`, tanpa database di v1. Formulir mengirim data lewat server action ke Google Form yang sudah dipakai gereja, jadi data tetap masuk ke Google Sheet yang sama. Peta memakai embed Google Maps tanpa API key. Khotbah terbaru memakai embed playlist *uploads* YouTube yang otomatis mengikuti video terbaru.

**Tech Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Vitest · sharp (dibawa Next) · deploy standalone + PM2 + nginx (sama seperti `jp/`)

---

# Bagian A — Ringkasan untuk ditinjau

## A1. Resource yang sudah terkumpul

Semua ada di [`resources/`](../../../resources/README.md). Inventaris lengkapnya di `resources/README.md`.

| Sumber | Yang didapat |
|---|---|
| Linktree | Logo (PNG 600×600), 7 poster/banner Canva, peta statis, semua link (Zoom, 2 Google Form, WA, IG, FB, YouTube), alamat lengkap + koordinat + Place ID |
| Poster Canva | Jadwal: Ibadah Minggu 10.00, Doa Minggu 09.15, Kids Church 10.30 (Unit B6), Doa Rabu 20.00 via Zoom (ID 854 3276 0648, passcode `prayer`), Doa Onsite Jumat ke-4 18.00–20.00 di Stream Hall |
| YouTube | 31 video beserta thumbnail (29 rekaman khotbah Jan–Sep 2026 dan 2 video lain), banner, avatar. Lead pastor **Ps. Raswan Gautama & Ibu Sharon Gautama**. Ulang tahun ke-7 pada 30 Agustus 2026, jadi gereja berdiri 2019 |
| Google Form | Isi form **Life Group** (6 field; kelompok Family / Young Professional / Youth) dan **Permohonan Doa** (4 field, Yakobus 5:16), lengkap dengan entry ID untuk submit langsung |
| everynation.org | Misi resmi dan 5 core values beserta ayat: Lordship, Evangelism, Discipleship, Leadership, Family |

**Tidak bisa diambil:** foto Instagram (wajib login), Facebook (diblokir), file Drive "Youth Ministry" (404, link di Linktree mati), dan logo vektor (hanya ada PNG).

## A2. Struktur halaman

Satu halaman dengan anchor. Navigasi: **Beranda · Pelayanan · Kabar · Tentang · Terhubung**, ditambah tombol WhatsApp melayang di semua layar.

### 1. Hero — `#beranda`
- Eyebrow: "Every Nation Kelapa Gading · Sejak 2019"
- Judul diambil dari banner Life Group milik gereja sendiri: **"Bertumbuh, terhubung, dan berjalan bersama dalam iman."**
- Kartu **Ibadah berikutnya**, dihitung otomatis: "Minggu, 20 September · 10.00 WIB · Stream Hall, Mahaka Square Lt. 2", dengan catatan kecil "Doa bersama 09.15".
- CTA: **Rencanakan kunjungan** (ke `#terhubung`) dan **Tonton khotbah terbaru** (ke `#kabar`).
- Visual: hero berbasis tipografi di atas navy dengan motif globe dari logo, karena belum ada foto bersih. Sudah disiapkan slot `hero.jpg` untuk foto jemaat nanti.

### 2. Pelayanan & Jadwal — `#pelayanan`
- **Jadwal minggu ini:** 5 kegiatan, masing-masing dengan tanggal berikutnya yang dihitung (termasuk aturan "Jumat ke-4"). Detail Zoom ditampilkan pada Doa Rabu.
- **Kartu pelayanan** (isi hanya dari sumber asli):
  - Ibadah Minggu
  - Kids Church (banner Canva)
  - Life Group: teks deskripsi dari Google Form, CTA membuka tab form Life Group
  - Doa: poster Canva, CTA membuka tab Permohonan Doa
  - Youth: diarahkan ke Life Group dengan pilihan "Youth" sudah terisi

### 3. Kabar & Khotbah — `#kabar`
- **Pemutar utama:** playlist uploads YouTube, otomatis selalu video terbaru. Iframe baru dimuat saat diklik, supaya halaman tetap ringan.
- **Grid 6 khotbah terbaru:** thumbnail, judul, pembicara, dan tanggal, di-parse dari judul YouTube.
- **Kabar & Event:**
  - "7 Years, One Faithful God" (30 Agustus 2026)
  - Mother's Day 2026, ditandai "Telah berlangsung"
  - Event rutin berikutnya (Doa Onsite 25 September)
- **Artikel:** model data sudah disiapkan (`type: "artikel"`), tetapi belum ada isinya. Tidak ada artikel karangan.

### 4. Kenapa Kami Ada — `#tentang`
- Pernyataan besar: **"Honor God. Make Disciples."** dengan terjemahan *Menghormati Tuhan. Menjadikan murid.*
- Misi dalam bahasa Indonesia dan Inggris (dari deskripsi channel YouTube gereja).
- 5 core values beserta ayat, diterjemahkan dari everynation.org. **Perlu ditinjau pastor.**
- Gembala: Ps. Raswan Gautama & Ibu Sharon Gautama. Foto menyusul.

### 5. Terhubung — `#terhubung`
- **Form bertab:**
  - Gabung Life Group → Google Form Life Group
  - Permohonan Doa → Google Form Doa
  - Kirim Pesan → membuka WhatsApp dengan pesan yang sudah tersusun
- **Google Maps** embed, dengan alamat dan tombol "Buka di Google Maps".
- **Kartu WhatsApp** (+62 851-7543-6935) dan tautan Instagram, Facebook, YouTube.

**Footer:** logo, alamat, ringkasan jadwal, sosial media, © Every Nation Kelapa Gading.

## A3. Arah desain

Palet diambil dari aset gereja sendiri:

| Token | Warna | Asal |
|---|---|---|
| `navy-700` | `#1C4484` | Banner YouTube "Mission" dan logo Every Nation |
| `cream-100` | `#FCF4E4` | Latar banner YouTube |
| `sun-500` | `#FCBC04` | Aksen poster Prayer Meeting |
| `ink` | `#0C1414` | Latar poster doa |

- **Kontras:** navy di atas krem 8,7:1. Tombol kuning selalu memakai teks `ink` (11:1), tidak pernah teks putih.
- **Tipografi:** Bricolage Grotesque untuk judul (tegas, cocok dengan logo), Plus Jakarta Sans untuk teks, Instrument Serif italic untuk ayat dan kutipan.
- **Ritme:** section navy dan krem berselang-seling. Hero, Kenapa Kami Ada, dan footer memakai navy; Pelayanan, Kabar, dan Terhubung memakai krem.
- **Gerak:** reveal CSS ringan saat scroll, tanpa library animasi, dan menghormati `prefers-reduced-motion`.

## A4. Keputusan teknis

| Keputusan | Alasan |
|---|---|
| Next.js 15 + Tailwind v4, konfigurasi disalin dari `jp/` | Stack yang sama dengan proyek Anda sebelumnya, dan skrip deploy bisa dipakai ulang |
| Konten statis di `src/content/` | Belum ada artikel atau event yang perlu dikelola berkala. Admin panel (Supabase seperti `jp`) bisa ditambah di v2 bila memang dibutuhkan |
| Submit ke Google Form yang sudah ada | Tim gereja tetap membaca data di Sheet yang sama, tanpa backend dan tanpa perubahan kebiasaan. Sudah diverifikasi: entry ID dan opsi jawaban cocok persis |
| Embed Maps `google.com/maps/embed?origin=mfe&pb=…` | Sudah diuji: HTTP 200 tanpa `x-frame-options`, tanpa API key |
| Embed `youtube-nocookie.com/embed/videoseries?list=UU…` | Sudah diuji: HTTP 200. Selalu memutar video terbaru tanpa API key, karena RSS YouTube sudah 404 |
| Grid khotbah dari snapshot `youtube-videos.json` | Deterministik dan cepat. Diperbarui dengan menjalankan ulang skrip atau menyalin data baru |
| Logo transparan dibuat dari PNG dengan sharp | Sudah diuji: menghasilkan `logo-light.png` / `logo-navy.png` 431×156 yang bersih, plus `og.png` 1200×630 |

Logika inti sudah diuji dengan data asli sebelum plan ini ditulis:
- Parser judul khotbah membaca 29/29 khotbah dengan benar
- Perhitungan jadwal, termasuk Jumat ke-4 dan pergantian zona waktu
- Link WhatsApp
- Validasi dan payload Google Form

## A5. Perlu dikonfirmasi

Nilai di kolom *Default* dipakai kalau belum ada jawaban.

| # | Pertanyaan | Default |
|---|---|---|
| 1 | **Foto jemaat/ibadah.** Semua gambar yang ada berisi teks. Bisa minta 8–15 foto dari admin IG? | Hero tipografi, slot foto disiapkan |
| 2 | **Nomor unit bentrok:** A30-32 (Google Maps & poster), B5 (bio Linktree), B6 (Kids Church). Mana yang benar? | Ibadah A30-32 · Kids B6 · Kantor B5 |
| 3 | **Judul khotbah salah ketik** di YouTube: "God Friday", "Redemtion", "Bekata", "We Fails", "Di Mulai", "Joeseph". Boleh dirapikan di situs? | Dirapikan lewat peta koreksi (Task 5) |
| 4 | **Youth Ministry:** link Drive sudah mati. Diarahkan ke mana? | Ke form Life Group dengan pilihan Youth |
| 5 | **Campus Ministry** masih aktif? Buktinya hanya video tahun 2020 | Tidak dibuat kartu, hanya disebut dalam teks misi |
| 6 | Link Zoom dan passcode ditampilkan publik? Saat ini sudah publik di Linktree | Ditampilkan |
| 7 | **Domain dan hosting.** Satu server dengan `jp`? | `NEXT_PUBLIC_SITE_URL` diisi saat deploy, skrip deploy disalin dari `jp` |
| 8 | Terjemahan core values dan izin submit form dari situs perlu disetujui pengurus. Uji kirim 1 data bertanda "TEST — hapus" | Menunggu izin sebelum uji di produksi |
| 9 | Bahasa: Indonesia dengan istilah pelayanan tetap dalam bahasa Inggris (Sunday Service, Life Group)? | Ya, tanpa toggle bahasa di v1 |
| 10 | Logo vektor (SVG) dari tim desain? | Memakai PNG transparan hasil Task 2 |

---

# Bagian B — Implementasi

## Struktur file

```
enkg/                                  ← /Users/rafaeljosh/dev/enkg/enkg
├── resources/                         bahan mentah (sudah ada, tidak diubah)
├── scripts/
│   └── make-brand.mjs                 logo transparan + og.png + icon.png dari PNG Linktree
├── public/
│   ├── brand/  og.png, icon.png
│   └── images/ ministries/*.png, events/*.png, sermons/*.jpg
├── src/
│   ├── assets/brand/                  logo-light.png, logo-navy.png (di-import agar ukuran otomatis)
│   ├── app/
│   │   ├── layout.tsx                 font, metadata, JSON-LD
│   │   ├── page.tsx                   merangkai 5 section
│   │   ├── globals.css                token warna & font, reveal
│   │   ├── actions/connect.ts         server action → Google Forms
│   │   ├── sitemap.ts, robots.ts
│   ├── content/                       SEMUA teks & data situs
│   │   ├── site.ts                    identitas, alamat, kontak, misi, nilai, navigasi
│   │   ├── schedule.ts                5 jadwal rutin
│   │   ├── ministries.ts              kartu pelayanan
│   │   ├── news.ts                    kabar / event / artikel
│   │   ├── sermons.ts                 khotbah hasil parse + koreksi judul
│   │   └── youtube-videos.json        salinan resources/youtube/videos.json
│   ├── lib/                           logika murni, semuanya dites
│   │   ├── schedule.ts (+ .test.ts)   nextOccurrence, recurrenceLabel, format WIB
│   │   ├── sermons.ts  (+ .test.ts)   parseSermonTitle, sermonDate
│   │   ├── whatsapp.ts (+ .test.ts)   whatsappLink
│   │   └── google-forms.ts (+ .test.ts) FORMS, buildSubmission, isFormKey
│   └── components/
│       ├── icons.tsx                  ikon Tabler inline (currentColor)
│       ├── reveal.tsx                 scroll reveal
│       ├── section.tsx                pembungkus section + judul
│       ├── site-header.tsx            navbar + menu mobile
│       ├── whatsapp-fab.tsx           tombol WA melayang
│       ├── lite-youtube.tsx           facade → iframe saat diklik
│       ├── connect-form.tsx           form bertab (client)
│       ├── site-footer.tsx
│       └── sections/ hero.tsx, services.tsx, news.tsx, why.tsx, connect.tsx
├── vitest.config.ts, next.config.ts, tsconfig.json, postcss.config.mjs, package.json
```

## Daftar task

1. Scaffold proyek + git + Vitest
2. Aset brand & gambar
3. Token desain, font, layout dasar
4. `lib/schedule` (TDD) + `content/schedule`
5. `lib/sermons` (TDD) + `content/sermons`
6. `lib/whatsapp` (TDD)
7. `lib/google-forms` (TDD) + server action
8. `content/site`, `ministries`, `news`
9. Komponen dasar: icons, reveal, section, lite-youtube
10. Header, tombol WA, footer
11. Section Hero
12. Section Pelayanan
13. Section Kabar & Khotbah
14. Section Kenapa Kami Ada
15. Section Terhubung + form bertab
16. SEO: metadata, JSON-LD, sitemap, robots
17. Verifikasi menyeluruh
18. Deploy

---

# Status — 13 September 2026

Task 1–17 selesai. Task 18 (deploy) menunggu keputusan domain dan server (A5 #7).

**Verifikasi yang sudah dijalankan**
- `npm test`: 26/26 lulus (jadwal, parser khotbah terhadap 29 judul asli, WhatsApp, Google Form).
- `next build`: typecheck lulus. Halaman statis dengan revalidasi 1 jam, first load 115 kB.
- Playwright (Chrome), desktop 1440 px dan mobile 390 px:
  - tidak ada elemen terpotong atau overflow horizontal
  - tidak ada error console
  - semua reveal tampil
  - peta Google termuat
  - pemutar YouTube memuat video terbaru ("The End", 6 September)
- Interaksi:
  - `#gabung-youth` membuka tab Life Group dengan Youth tercentang
  - form doa dengan nomor tidak valid menampilkan error dan isian tetap ada
  - kiriman sungguhan ke Google Form **belum** diuji (A5 #8)

**Perbaikan yang muncul saat verifikasi**
- Kolom grid Terhubung melebar di mobile. Diperbaiki dengan `*:min-w-0`.
- Kartu Sunday Service kosong di tengah. Diganti kartu navy dengan jam besar.
- Judul pemutar video bertumpuk di mobile. Judulnya disembunyikan di bawah `sm`.
- URL embed Maps berbasis nama memicu 404 pencarian. Diganti ke format resmi dengan feature ID dari Place ID.

---

# Revisi 2 — 13 September 2026

## Struktur baru (permintaan user)

Hero → **Siapa Kita** (cerita, angka, gembala, visi, misi) → **Nilai & Statement of Faith** → **Pelayanan** → **News** → **ProCon News** → **Contact Us** (Life Group, doa, pesan WA) → **Give** → footer.

## Yang dikerjakan

**Desain**
- Permukaan bertekstur: grain, navy berlapis, dan krem hangat.
- Tipografi fluid, bayangan bernuansa navy, tombol dengan efek tekan, animasi reveal dan marquee.
- Header berbentuk pill melayang dengan penanda section aktif, dan menu mobile layar penuh.

**Foto asli**
- Frame dari rekaman ibadah ENKG di YouTube (`scripts/make-photos.mjs`).
- Frame "Tribes · Every Nation Music" tidak dipakai karena bukan jemaat ENKG.

**Siapa Kita**
- Kolase jemaat, kartu gembala, dan kutipan khotbah.
- Visi (Honor God. Make Disciples. dengan 3 fokus) dan misi dwibahasa.

**Nilai & Statement of Faith**
- 5 core values beserta ayat.
- Ringkasan 12 pokok iman dari everynation.org/what-we-believe, dengan 6 pokok tersembunyi di balik tombol.

**ProCon**
- Deskripsi program diambil dari `jp/src/lib/ruang.ts`.
- 3 event placeholder: Monetize with AI, kelola uang bersama blu by BCA Digital, C-Level.

**Give**
- Rekening atas nama "Gereja MSI Kelapa Gading".
- Nomor rekening kosong sampai data resmi diberikan. Selama itu, tombol mengarah ke WhatsApp.

**Form Contact Us**
- Panel tab navy dengan dukungan tombol panah keyboard.
- Ikon di input dan validasi nomor WA saat kolom ditinggalkan.
- Chip pilihan bercentang, penghitung karakter, spinner, dan tampilan sukses beranimasi.
- `noValidate`, supaya error tampil dengan gaya situs, bukan tooltip browser.

**Deploy (home server + Cloudflare Tunnel)**
- `ecosystem.config.js`: PM2 cluster 2 worker, port 3001.
- `deploy/setup-server.sh` dan `deploy/deploy.sh`.
- `deploy/nginx.conf`: nginx di `127.0.0.1:8080`, membaca `CF-Connecting-IP`.
- `deploy/cloudflared.example.yml`.

**Copy**
- Em dash dihapus dari teks yang terlihat pengunjung.
- Label di atas judul hero dihapus.

## Verifikasi

- `npm test`: 28/28 lulus, termasuk `isValidPhone`.
- `next build`: lulus, first load 117 kB.
- Playwright (Chrome) desktop 1440 dan mobile 390:
  - tidak ada elemen terpotong dan tidak ada error console
  - penanda section aktif benar dan menu mobile tertutup setelah navigasi
  - `#gabung-youth` membuka tab Life Group dengan Youth tercentang
  - tombol panah berpindah tab
  - submit kosong menampilkan 3 error field beserta banner, dan isian tetap tersimpan
- `bash -n` kedua skrip deploy lolos, dan `ecosystem.config.js` bisa di-load.

## Masih terbuka

1. Nomor rekening dan bank untuk Give.
2. Detail event ProCon (judul, tanggal, link).
3. Tinjauan pastor atas terjemahan nilai dan Statement of Faith.
4. Domain everynationkg.com disambungkan lewat Cloudflare Tunnel di home server.
5. Uji kirim form ke Google Form, setelah ada izin pengurus.
6. Nomor unit (A30-32 / B5 / B6) dan izin koreksi judul khotbah, dari revisi 1.

---

# Revisi 3 — 13 September 2026 (masukan user)

- **Hero lebih ringkas:**
  - judul "Bertumbuh bersama *dalam iman.*", satu baris tagline, dan tombol "Jadwal ibadah" serta "Tonton khotbah"
  - kartu ibadah berikutnya tinggal tanggal, jam, dan tempat
  - baris jam dan caption foto dihapus
- **Kontak tanpa nuansa "kunjungan":** judul section "Hubungi kami.", pesan WhatsApp jadi "saya ingin bertanya". Semua tombol "Rencanakan kunjungan" diganti "Hubungi kami" atau "Petunjuk arah" (link mati `#terhubung` ikut beres).
- **Responsif:**
  - hero dua kolom mulai 768 px
  - tumpukan kartu di hero dan Siapa Kita baru dipakai mulai 1280 px
  - jadwal jadi 2 kolom di tablet, bento pelayanan 3/3 di tablet
  - Nilai dan Visi/Misi tidak lagi sempit di 1024 px
  - kolom Jadwal di footer dihapus
- **Animasi:** AOS dan `react-scroll-parallax`, sama dengan `jp/`, lewat `components/motion.tsx`, `reveal.tsx`, dan `parallax.tsx`.
- **Verifikasi di 390, 768, 1024, dan 1440 px:**
  - tidak ada teks meluber, scroll horizontal, maupun error console
  - 63 elemen AOS teranimasi setelah scroll
  - parallax bergerak

