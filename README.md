# Every Nation Kelapa Gading — Website

Situs satu halaman untuk Every Nation Kelapa Gading (ENKG).
Urutan section: **Beranda → Siapa Kita → Nilai & Statement of Faith → Pelayanan → News → ProCon → Contact Us → Give**.

- **Stack**: Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Vitest
- **Data**: file statis di `src/content/`, tanpa database
- **Form**: diteruskan ke Google Form gereja yang sudah ada, jadi jawaban masuk ke Google Sheet yang sama
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
| Kabar & event (News) | `src/content/news.ts` |
| Event ProCon | `src/content/procon.ts` |
| Koreksi salah ketik judul khotbah | `TITLE_FIXES` di `src/content/sermons.ts` |

### Rekening Give

Isi `bank` dan `accountNumber` di `site.give` (`src/content/site.ts`). Selama keduanya masih kosong, section Give menampilkan ajakan menanyakan rekening lewat WhatsApp. Setelah diisi, nomor rekening tampil lengkap dengan tombol salin.

### ProCon

Event di `src/content/procon.ts` masih **placeholder**. Isi `date` dengan format `yyyy-mm-dd`; kalau dibiarkan `null`, kartu menampilkan "Segera hadir". Isi `href` kalau pendaftarannya sudah punya link. Kalau kosong, tombolnya membuka WhatsApp.

### Jadwal

Tulis pola, bukan tanggal, misalnya `{ kind: "monthly-nth", weekday: 5, nth: 4 }` untuk Jumat ke-4. Tanggal "berikutnya" dihitung otomatis dalam WIB, dan halaman dibangun ulang tiap jam.

### Khotbah

Pemutar di section News selalu memutar video terbaru dari channel YouTube, tanpa perlu diubah. Daftar "Khotbah terbaru" memakai snapshot:

1. Perbarui `src/content/youtube-videos.json`, dengan kolom `id`, `date` (tanggal unggah), `title`, dan `url`.
2. Simpan thumbnail di `public/images/sermons/<id>.jpg`, dari `https://i.ytimg.com/vi/<id>/maxresdefault.jpg`.
3. Jalankan `npm test` dan sesuaikan jumlah khotbah di `sermons.test.ts`.

### Foto

Foto di situs adalah potongan frame asli dari rekaman ibadah ENKG di YouTube (`resources/youtube/frames/`). Ganti atau tambah potongan di `scripts/make-photos.mjs`, lalu jalankan `node scripts/make-photos.mjs`. Kalau nanti ada foto dokumentasi resmi, cukup timpa file di `public/images/photos/` dengan nama yang sama.

### Animasi (AOS + parallax)

Pengaturannya sama dengan situs Janji Pengharapan (`jp/`):

- `src/components/motion.tsx`: menjalankan AOS dan `ParallaxProvider`. Keduanya otomatis mati bila perangkat meminta "kurangi gerakan".
- `<Reveal variant="up|left|right|scale|fade|curtain" delay={100}>`: animasi masuk saat scroll lewat atribut `data-aos`. Jarak geraknya disetel di `globals.css`. Jangan dipakai di hero.
- `<Parallax speed={-8}>`: elemen bergerak lebih lambat (angka negatif) atau lebih cepat (positif) dari scroll. Dipakai di hero, Siapa Kita, Give, dan footer.

### Aset brand

`npm run brand` membuat logo transparan, `opengraph-image.png`, `icon.png`, dan `apple-icon.png` dari `resources/linktree/avatar-enkg.png`.

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
