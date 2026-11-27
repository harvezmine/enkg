# Every Nation Kelapa Gading — Website

Situs satu halaman untuk Every Nation Kelapa Gading (ENKG).
Urutan section: **Beranda → Siapa Kita → Nilai & Statement of Faith → Pelayanan → News → ProCon → Contact Us → Give**.

- **Stack**: Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Vitest
- **Data**: file statis di `src/content/`; News, event, ProCon, dan kiriman Contact Us dikelola lewat [admin panel](#admin-panel) (Supabase)
- **Form**: disimpan ke database admin panel sekaligus diteruskan ke Google Form gereja yang sudah ada, jadi Google Sheet tetap terisi
- **Deploy**: home server + PM2 + nginx + Cloudflare Tunnel (lihat [Deploy](#deploy))
- **Bahan mentah** (Linktree, YouTube, Google Form): `resources/README.md`

## Menjalankan di komputer sendiri

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit test: jadwal, parser khotbah, WhatsApp, Google Form
npm run build        # build produksi (sekaligus typecheck)
```

## Mengubah konten

Semua teks dan data ada di `src/content/`. Untuk perubahan konten, komponen tidak perlu disentuh.

| Yang ingin diubah | File |
|---|---|
| Alamat, WhatsApp, sosial media, Zoom, **rekening Give** | `src/content/site.ts` |
| Cerita, angka, gembala, visi, misi, nilai, Statement of Faith | `src/content/about.ts` |
| Jadwal ibadah & doa | `src/content/schedule.ts` |
| Kartu pelayanan | `src/content/ministries.ts` |
| Kabar, artikel & event (News) | **Admin panel** `/admin` → News / Event & ProCon (cadangan: `src/content/news.ts`) |
| Event ProCon | **Admin panel** `/admin` → Event & ProCon (cadangan: `src/content/procon.ts`) |
| Koreksi salah ketik judul khotbah | `TITLE_FIXES` di `src/content/sermons.ts` |

### Rekening Give

Isi `bank` dan daftar `accounts` di `site.give` (`src/content/site.ts`). Tulis nomor rekening **tanpa spasi** (`"7660400189"`); `sections/give.tsx` yang merapikannya jadi `7660 400 189`. Tiap rekening butuh `id`, `label` (peruntukannya, mis. "Gedung"), dan `number`. Selama `accounts` masih kosong, section Give menampilkan ajakan menanyakan rekening lewat WhatsApp.

QRIS-nya ada di `public/qris.png` dan dibuka lewat popup dari tombol "Beri lewat QRIS". Kalau kodenya diganti, timpa file itu dan sesuaikan `width`/`height` di `site.give.qris`.

### Video Siapa Kita

Dua klip yang berjalan berdampingan di samping "Honor God. Make Disciples." diatur di `aboutVideos` (`src/content/about.ts`). Kalau salah satu `src` dikosongkan, yang tampil foto posternya saja, jadi situs tetap utuh selama penggantinya belum siap.

Berkasnya (`public/media/siapa-kita-1.mp4` dan `-2.mp4`) dirakit dari klip mentah dengan ffmpeg: audionya dibuang karena diputar tanpa suara, bagian hitam di awal dan akhir dipotong, lalu dikompres. **Bagian hitam wajib dipotong**: videonya berulang terus, jadi kalau awalnya hitam, itu yang berulang kali dilihat pengunjung.

```bash
# 1. Cari bagian hitamnya dulu, catat detiknya:
ffmpeg -i klip-mentah.mp4 -vf "blackdetect=d=0.3:pix_th=0.12" -an -f null -

# 2. Potong, buang audio, kompres (ganti angka -ss/-to sesuai hasil langkah 1):
ffmpeg -ss 4.0 -to 56.3 -i klip-mentah.mp4 \
  -vf "scale=480:854,setsar=1,fps=30" -an \
  -c:v libx264 -crf 31 -preset slow -pix_fmt yuv420p -movflags +faststart \
  public/media/siapa-kita-1.mp4

# 3. Pastikan sudah bersih:
ffmpeg -i public/media/siapa-kita-1.mp4 -vf "blackdetect=d=0.3:pix_th=0.12" -an -f null -

# 4. Poster diambil dari frame pertama, supaya tidak ada lompatan gambar saat mulai:
ffmpeg -i public/media/siapa-kita-1.mp4 -frames:v 1 -q:v 3 public/media/siapa-kita-1.jpg
```

Sesuaikan `width`/`height` di `aboutVideos` kalau rasio klipnya berubah; frame di situs mengikuti angka itu, jadi tidak ada sisi yang terpotong. Jaga tiap berkas di bawah ~2,5 MB: keduanya ikut terunduh di setiap kunjungan halaman depan.

### Animasi (AOS + parallax)

Pengaturannya sama dengan situs Janji Pengharapan (`jp/`):

- `src/components/motion.tsx`: menjalankan AOS dan `ParallaxProvider`. Keduanya otomatis mati bila perangkat meminta "kurangi gerakan".
- `<Reveal variant="up|left|right|scale|fade|curtain" delay={100}>`: animasi masuk saat scroll lewat atribut `data-aos`. Jarak geraknya disetel di `globals.css`. Jangan dipakai di hero.
- `<Parallax speed={-8}>`: elemen bergerak lebih lambat (angka negatif) atau lebih cepat (positif) dari scroll. Dipakai di hero, Siapa Kita, Give, dan footer.

### Aset brand

`npm run brand` membuat logo transparan, `opengraph-image.png`, `icon.png`, dan `apple-icon.png` dari `resources/linktree/avatar-enkg.png`.

## Admin panel

Pengurus mengelola konten di **`/admin`**. Polanya sama dengan admin panel Janji Pengharapan (`jp/`): satu kata sandi bersama, sesi berlaku 7 hari, dan login dikunci 15 menit setelah 5 kali salah.

| Menu | Isi | Tampil di situs |
|---|---|---|
| Ringkasan | Jumlah kiriman baru, draf, dan event mendatang | Tidak |
| Contact Us | Pendaftaran Life Group dan permohonan doa: status (Baru / Sudah dihubungi / Selesai), catatan pengurus, tombol WhatsApp | Tidak (privat) |
| News | Kabar dan artikel dengan gambar sampul | Section News + `/news/<slug>` |
| Event & ProCon | Event gereja dan kelas ProCon | Event gereja di section News, ProCon di section ProCon, detail di `/event/<slug>` |
| Data jemaat | Kartu jemaat: data diri, foto, alamat, ulang tahun, relasi keluarga (pasangan dengan tanggal menikah, orang tua, anak, saudara), status. **Impor Excel** (template bisa diunduh, pratinjau dan validasi sebelum disimpan) dan **Ekspor** ke Excel | Tidak (privat) |
| Life Group | Grup beserta leader dan anggotanya, antrean jemaat baru yang menunggu grup, tombol kabari leader, laporan pertemuan | Hanya nama, jam, dan wilayah grup yang menyalakan "Tampil di kalender publik" |
| Pelayanan | Tim pelayanan (Musisi, Usher, dst.), anggota, peran, koordinator | Tidak (privat) |
| Materi LG | Tulisan dan booklet PDF untuk leader Life Group | Hanya di portal leader |
| Kalender | Jadwal rutin (mingguan, minggu ke-N tiap bulan, atau sekali) | Section Kalender, jam ibadah di hero dan Pelayanan |

### Impor & ekspor Excel

Di **Data jemaat → Impor Excel**: unduh template (berisi contoh, petunjuk, dan daftar Life Group serta tim yang ada), isi satu baris per orang, lalu unggah `.xlsx` atau `.csv`. Spreadsheet lama juga bisa langsung dipakai selama ada kolom nama; judul seperti "No WA" atau "Tgl Lahir" dikenali otomatis. Semua baris diperiksa dulu: data dobel, tanggal yang salah, Life Group atau tim yang belum ada. Orang yang sudah ada (cocok lewat nomor WA atau nama) bisa dilewati atau diperbarui, dan kolom kosong tidak menghapus data lama. Nama pasangan dihubungkan otomatis sebagai suami/istri beserta tanggal menikahnya.

**Ekspor** menghasilkan file dengan kolom yang sama ditambah ID, jadi bisa diubah di Excel lalu diimpor balik.

### Portal leader Life Group (`/portal`)

Leader masuk dengan **nomor WhatsApp + password sendiri**, terpisah dari kata sandi pengurus. Akunnya dibuat admin dari halaman data jemaat si leader (bagian "Akun portal leader"); password sementara tampil sekali dan bisa langsung dikirim lewat WhatsApp, lalu wajib diganti saat pertama masuk.

- Leader hanya melihat anggota grupnya sendiri (tanpa catatan pengurus), bisa mengubah data diri anggotanya (bukan status, catatan, atau Life Group), menjadwalkan pertemuan, mengisi laporan (kehadiran, tamu, jalannya pertemuan, pokok doa), dan membaca atau mengunduh materi. Setiap perubahan tercatat "diubah oleh" di halaman admin.
- Akses dicek ulang ke database di setiap request: begitu akun dinonaktifkan, password di-reset, atau orangnya tidak lagi tercatat sebagai leader, sesinya langsung gugur.
- Cookie leader tidak pernah bisa membuka `/admin`.

Isi artikel ditulis sebagai teks biasa: `## Judul`, `### Subjudul`, `> kutipan`, `- daftar`, `1. daftar bernomor`, `**tebal**`, `*miring*`.

### Menyiapkan (sekali)

1. Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dan `ADMIN_PASSWORD` di `.env.local` (komputer sendiri) atau `.env.production` (server). Boleh memakai project Supabase dan kata sandi yang sama dengan `jp/`.
2. Buka Supabase → SQL Editor, lalu jalankan seluruh isi `supabase/schema.sql`. Aman dijalankan ulang. File ini membuat semua tabel `enkg_*` (konten, jemaat, Life Group, pelayanan, akun leader, materi, pertemuan, kalender), aturan RLS, bucket gambar publik `enkg-media`, serta bucket **privat** `enkg-people` (foto jemaat) dan `enkg-materials` (booklet PDF), tanpa menyentuh tabel milik `jp`.
3. Build ulang (`npm run build` atau `deploy/deploy.sh`), karena alamat Supabase ikut ditanam ke bundel dan ke daftar host gambar.

Tanpa langkah di atas situs tetap berjalan: section News dan ProCon memakai konten statis, form Contact Us tetap diteruskan ke Google Form, dan `/admin` menampilkan petunjuk konfigurasi.

### Cara kerja singkat

- Simpan, terbitkan, atau hapus langsung memperbarui beranda dan halaman detail tanpa build ulang.
- Kiriman Contact Us disimpan ke database **dan** diteruskan ke Google Form. Pengunjung hanya melihat pesan gagal kalau keduanya gagal.
- Gambar sampul diunggah ke Supabase Storage (JPG, PNG, WebP, GIF, AVIF; maksimal 5 MB).
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server. Jangan dibagikan dan jangan diberi awalan `NEXT_PUBLIC_`.
- Data jemaat, akun, dan laporan Life Group tidak punya policy RLS sama sekali, jadi anon key tidak bisa membaca satu baris pun. Foto jemaat dan booklet hanya dibuka lewat signed URL berumur pendek.

## Bot Telegram internal

Bot untuk tim internal, dikirim **satu per satu ke tiap orang** lewat chat pribadi (tidak ada grup). Setiap pagi bot mengirim ringkasan berisi ulang tahun, anniversary pernikahan, jadwal hari ini dan besok, serta jumlah jemaat baru yang belum punya Life Group. Pendaftar "Gabung Life Group" dari situs dan jemaat baru yang ditambahkan admin langsung dikabarkan dengan tombol Life Group, jadi bisa di-assign dari Telegram, lalu ada tombol untuk mengabari leader-nya lewat WhatsApp. Permohonan doa dari situs juga langsung diteruskan.

Perintah di Telegram: `/ulangtahun`, `/anniversary`, `/jadwal`, `/jemaatbaru`, `/bantuan`.

### Menyiapkan (sekali)

1. Di Telegram, chat **@BotFather** → `/newbot` → beri nama, lalu salin tokennya.
2. Isi `.env.production` (lihat `.env.example`):
   - `TELEGRAM_BOT_TOKEN`: token dari BotFather.
   - `TELEGRAM_WEBHOOK_SECRET`: teks acak 16-256 karakter buatan sendiri, misalnya `openssl rand -hex 32`. Bukan dari Telegram.
   - `CRON_SECRET`: teks acak lain buatan sendiri, minimal 16 karakter.
3. Jalankan ulang `supabase/schema.sql` di Supabase SQL Editor, lalu deploy.
4. Buka **admin panel → Bot Telegram → Sambungkan bot**. Ini butuh `NEXT_PUBLIC_SITE_URL` berupa alamat https publik.
5. Di halaman yang sama, **Tambah penerima**: nama, nomor Telegram, dan pengingat yang dia terima (Ulang tahun, Anniversary pernikahan, Jadwal gereja, Jemaat baru, Permohonan doa).
6. Orangnya membuka bot, menekan **Mulai**, lalu **Kirim nomor saya**. Kalau nomornya cocok dengan daftar, dia langsung tersambung. Tombol "Kirim petunjuk lewat WhatsApp" di admin panel mengirimkan langkah ini ke orangnya.

### Cara kerja

- **Hanya penerima yang tersambung dan aktif** yang menerima data jemaat atau bisa memakai perintah. Orang lain hanya diminta mengirim nomornya, dan nomor yang tidak terdaftar ditolak.
- Nomor dicocokkan dari kontak yang dikirim lewat tombol "Kirim nomor saya", dan hanya kontak milik pengirimnya sendiri yang diterima (kontak orang lain yang diteruskan ditolak).
- Tombol assign Life Group hanya berlaku untuk penerima yang mengikuti pengingat "Jemaat baru", dan hanya kalau ditekan oleh orangnya sendiri. Orang yang sudah punya Life Group tidak pernah dipindah dari Telegram.
- Bot tidak melayani grup: kalau dimasukkan ke grup, bot pamit lalu keluar. Kalau penerima memblokir bot, statusnya kembali "Menunggu" sampai dia membuka bot lagi.
- Ringkasan pagi: proses PM2 `enkg-telegram-daily` jalan tiap jam (menit ke-5) dan memanggil `POST /api/telegram/daily`. Ringkasan terkirim sekali sehari per orang, mulai 06.00 WIB, apa pun zona waktu server. Log ada di `logs/telegram-daily.log`.
- Tanggal menikah diisi di data keluarga jemaat (relasi pasangan). Tanpa tanggal itu, anniversary tidak diingatkan.
- Nama, nomor WA, domisili jemaat baru, dan isi permohonan doa ikut terkirim ke Telegram, jadi daftarkan hanya tim internal.

### Uji di komputer sendiri

Telegram hanya bisa memanggil webhook di alamat https publik. Untuk mencoba bot dari `next dev`, jalankan:

```bash
node --env-file=.env.local scripts/telegram-poll.mjs 3000
```

Skrip ini mengambil pesan masuk lewat `getUpdates` lalu meneruskannya ke `http://localhost:3000/api/telegram/webhook` dengan secret yang sama. Skrip **hanya jalan selama bot belum punya webhook**. Kalau situs online sudah menekan "Sambungkan bot", Telegram menolak `getUpdates` (409) dan skrip berhenti. Skrip ini sengaja tidak pernah menghapus webhook, supaya bot di situs online tidak terputus.

## Chatbot di halaman utama

Tombol WhatsApp melayang di halaman utama diganti chatbot "Tanya kami". Pengunjung bisa bertanya soal jadwal ibadah, Life Group, lokasi, Kids Church, ProCon, atau cara memberi, dan di bagian atas chat selalu ada tombol **Chat WhatsApp** untuk lanjut ke tim.

- Jawaban AI memakai DeepSeek. Isi `DEEPSEEK_API_KEY` di `.env.production`. Kalau kosong (atau DeepSeek sedang bermasalah), chatbot tetap jalan dengan jawaban otomatis dari isi situs plus tombol WhatsApp.
- Chatbot hanya tahu informasi publik: isi `src/content/`, jadwal kalender, event yang terbit, dan Life Group yang punya jadwal tetap. Data jemaat tidak pernah dikirim ke AI. Pertanyaan pengunjung dikirim ke DeepSeek.
- Pesan yang menunjukkan krisis (mis. ingin mengakhiri hidup) langsung dijawab dengan nomor bantuan 119 ext 8 dan healing119.id, tanpa AI.
- Batas: 20 pesan per 10 menit per pengunjung, pesan maksimal 600 karakter. Butuh Node 20.3 atau lebih baru di server.

## Google Form

`src/lib/google-forms.ts` memetakan field situs ke **entry ID** dan **teks opsi** Google Form asli. Kalau pertanyaan atau opsi di Google Form diubah, file ini wajib ikut disesuaikan, karena jawaban dengan teks opsi yang berbeda akan ditolak Google tanpa pesan error.

## Deploy

Situs berjalan di home server tanpa membuka port router:

```
Pengunjung ─HTTPS─▶ Cloudflare ─tunnel─▶ cloudflared ─▶ nginx 127.0.0.1:8080 ─▶ PM2 (Next.js) 127.0.0.1:3001
```

| File | Fungsi |
|---|---|
| `ecosystem.config.js` | Konfigurasi PM2: 2 worker cluster, membaca `/var/www/enkg/.env.production` |
| `deploy/setup-server.sh` | Persiapan sekali: Node 22, PM2, nginx, folder app, PM2 startup, rotasi log |
| `deploy/deploy.sh` | Test → build → rilis baru → tukar symlink → `pm2 startOrReload` (tanpa downtime) |
| `deploy/nginx.conf` | nginx di `127.0.0.1:8080`, IP asli dari `CF-Connecting-IP`, www → domain utama |
| `deploy/cloudflared.example.yml` | Contoh config tunnel |

Semua perintah di bawah ditujukan untuk home server dengan Ubuntu/Debian.

### 1. Sekali di awal: PM2 + nginx

```bash
git clone <repo> ~/enkg && cd ~/enkg
./deploy/setup-server.sh        # memasang Node 22, PM2, nginx, dan membuat /var/www/enkg
nano /var/www/enkg/.env.production   # cek NEXT_PUBLIC_SITE_URL & PORT
./deploy/deploy.sh              # build + start PM2
pm2 save

# Cek dari server itu sendiri:
curl -I -H 'Host: everynationkg.com' http://127.0.0.1:8080
```

### 2. Menyambungkan domain lewat Cloudflare Tunnel

Domain harus sudah memakai nameserver Cloudflare.

```bash
# Pasang cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
cloudflared tunnel login
cloudflared tunnel create enkg                          # catat TUNNEL_ID
cloudflared tunnel route dns enkg everynationkg.com
cloudflared tunnel route dns enkg www.everynationkg.com

sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/<TUNNEL_ID>.json /etc/cloudflared/
sudo cp deploy/cloudflared.example.yml /etc/cloudflared/config.yml
sudo nano /etc/cloudflared/config.yml                   # ganti TUNNEL_ID
sudo cloudflared service install
```

Di dashboard Cloudflare, atur **SSL/TLS → Full** dan aktifkan **Always Use HTTPS**.

### Setiap kali memperbarui

Push ke GitHub, lalu di server cukup satu perintah:

```bash
~/enkg/deploy.sh           # pull + test + build + reload, lalu cek situs sehat
~/enkg/deploy.sh --force   # ulangi walau tidak ada commit baru
```

Urutannya: `git pull --ff-only` → `deploy/deploy.sh` (test, build, rilis baru,
tukar symlink, `pm2 startOrReload`) → cek situs menjawab 200 dan semua worker
PM2 online. Kalau tidak ada commit baru (dan commit sekarang sudah ter-deploy),
skrip ini langsung selesai tanpa build.

Kalau test atau build gagal, rilis lama tetap jalan dan commit itu tidak dicatat
sebagai ter-deploy (`/var/www/enkg/.deployed-rev`), jadi menjalankan `deploy.sh`
lagi akan mencobanya ulang. Log: `/var/www/enkg/logs/deploy.log`.

### Perintah PM2 harian

```bash
pm2 status              # ringkasan proses
pm2 logs enkg           # log langsung
pm2 reload enkg         # muat ulang tanpa downtime
pm2 monit               # CPU & memori
```

### Yang perlu diingat

- **`NEXT_PUBLIC_SITE_URL` ditanam ke bundel saat build.** Setelah mengubahnya, jalankan ulang `./deploy/deploy.sh`; `pm2 restart` saja tidak cukup.
- **Port 3001** dipakai supaya tidak bentrok dengan situs lain (mis. Janji Pengharapan di 3000). Kalau diubah, samakan `PORT` di `.env.production` dan `upstream` di `deploy/nginx.conf`.
- **Selalu jalankan lewat `ecosystem.config.js`**, bukan `pm2 start server.js` langsung, karena `.env.production` dibaca di sana.
