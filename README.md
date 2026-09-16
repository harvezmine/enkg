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

Isi artikel ditulis sebagai teks biasa: `## Judul`, `### Subjudul`, `> kutipan`, `- daftar`, `1. daftar bernomor`, `**tebal**`, `*miring*`.

### Menyiapkan (sekali)

1. Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dan `ADMIN_PASSWORD` di `.env.local` (komputer sendiri) atau `.env.production` (server). Boleh memakai project Supabase dan kata sandi yang sama dengan `jp/`.
2. Buka Supabase → SQL Editor, lalu jalankan seluruh isi `supabase/schema.sql`. Aman dijalankan ulang. File ini membuat tabel `enkg_posts`, `enkg_events`, `enkg_contact_submissions`, aturan RLS, dan bucket gambar `enkg-media`, tanpa menyentuh tabel milik `jp`.
3. Build ulang (`npm run build` atau `deploy/deploy.sh`), karena alamat Supabase ikut ditanam ke bundel dan ke daftar host gambar.

Tanpa langkah di atas situs tetap berjalan: section News dan ProCon memakai konten statis, form Contact Us tetap diteruskan ke Google Form, dan `/admin` menampilkan petunjuk konfigurasi.

### Cara kerja singkat

- Simpan, terbitkan, atau hapus langsung memperbarui beranda dan halaman detail tanpa build ulang.
- Kiriman Contact Us disimpan ke database **dan** diteruskan ke Google Form. Pengunjung hanya melihat pesan gagal kalau keduanya gagal.
- Gambar sampul diunggah ke Supabase Storage (JPG, PNG, WebP, GIF, AVIF; maksimal 5 MB).
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server. Jangan dibagikan dan jangan diberi awalan `NEXT_PUBLIC_`.

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
