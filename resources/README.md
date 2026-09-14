# ENKG — Resource Inventory

Semua aset & data mentah yang dikumpulkan dari **linktr.ee/enkg** dan sumber yang ditautkannya,
diambil 13 September 2026. Ini bahan baku untuk revamp situs — belum dioptimasi untuk web.

## Identitas

| Item | Nilai | Sumber |
|---|---|---|
| Nama | Every Nation Kelapa Gading (Every Nation Church Kelapa Gading) | Linktree, YouTube |
| Lead pastor | Ps. Raswan Gautama (bersama Ibu Sharon Gautama) | Judul video YouTube |
| Berdiri | ± Agustus 2019 — "7 Years, One Faithful God" (30 Agustus 2026) | YouTube |
| Gerakan | Every Nation Churches & Ministries (global) | YouTube channel description |
| WhatsApp | +62 851-7543-6935 → `https://wa.me/6285175436935` | Linktree |
| Instagram | https://www.instagram.com/everynationkelapagading/ | Linktree |
| Facebook | https://www.facebook.com/everynationkelapagading | Linktree |
| YouTube | https://www.youtube.com/@everynationkelapagading9251 (channel ID `UCWjiAAikHaMFpJecqw8Idwg`) | Linktree |

## Lokasi

- **Alamat ibadah (Google Maps):** Jl. Raya Kelapa Nias No.6, Mahaka Square Lt. 2 Unit A30-32, Kelapa Gading Barat, Jakarta Utara 14240
- **Nama ruang:** Stream Hall (Unit A30-32)
- **Kids Church:** Lt. 2 Unit B6, Mahaka Square
- **Office (bio Linktree):** Mahaka Square Lt. 2 Room B5
- **Koordinat:** -6.1501502, 106.9032929 · Place ID `ChIJk0Xs8vT1aS4RVDSk3TlMSjA`
- **Short link:** https://maps.app.goo.gl/jR4YvSiyA6MhkBfT7

> ⚠️ Nomor unit berbeda di tiap sumber (A30-32 / B5 / B6). Perlu dikonfirmasi pengurus.

## Jadwal (dari poster Canva & Linktree)

| Kegiatan | Waktu | Tempat |
|---|---|---|
| Sunday Service | Minggu 10.00 WIB | Stream Hall, Mahaka Square |
| Prayer Meeting sebelum ibadah | Minggu 09.15 WIB | Stream Hall |
| Kids Church | Minggu 10.30 WIB | Unit B6 |
| Weekly Prayer Meeting (Zoom) | Rabu 20.00 WIB — Meeting ID 854 3276 0648, passcode `prayer` | Online |
| Onsite Prayer Meeting | Jumat ke-4 setiap bulan, 18.00–20.00 WIB | Stream Hall |

Link Zoom: https://us02web.zoom.us/j/85432760648?pwd=ODhYcTZmeE9zTGE0M1pEUWIvaXZodz09

## Misi & nilai (Every Nation)

- **Tagline:** Honor God. Make Disciples. — *Menghormati Tuhan dan menjadikan murid.*
- **Misi (ID):** Kami ada untuk menghormati Tuhan dengan mendirikan gereja dan pelayanan kampus yang berpusat pada Kristus, diberdayakan oleh Roh, dan bertanggung jawab secara sosial di setiap bangsa.
- **Mission (EN):** We exist to honor God by establishing Christ-centered, Spirit-empowered, socially responsible churches and campus ministries in every nation.
- **Core values:** Lordship (Kol 2:6) · Evangelism (Yoh 3:16, Luk 19:10) · Discipleship (Mat 28:19-20) · Leadership (2 Tim 2:2) · Family (Mzm 127:1-3)
  — sumber: https://www.everynation.org/mission/

## Google Forms → `google-forms.json`

1. **Life Group:** Nama, Jenis Kelamin, No. WhatsApp, Domisili (Jakarta/Luar Jakarta), Usia (5 rentang), pilihan Life Group (Family / Young Professional / Youth)
2. **Prayer Request:** Nama, Jenis Kelamin, No. WhatsApp, Permohonan Doa. Ayat: Yakobus 5:16.

Entry ID tiap pertanyaan tersimpan di JSON, sehingga form di situs baru bisa mengirim langsung ke Google Sheet yang sama.

## File

```
linktree/
  avatar-enkg.png            600×600   logo putih di atas hitam (logo utama)
  sunday-service.png         1080×1080 poster Mother's Day 10 Mei 2026 (sudah lewat, contoh event)
  kids-ministry.png          1080×510  banner Kids Church
  prayer-wednesday-zoom.png  1080×1080 poster Weekly Prayer (Zoom)
  prayer-4th-friday.png      1080×1080 poster Onsite Prayer Jumat ke-4
  prayer-sunday-0915.png     1080×1080 poster Prayer Minggu 09.15
  life-group.png             1080×656  banner Join Life Group (ada foto jemaat asli)
  prayer-request.png         1080×606  banner Prayer Request
  location-staticmap.png     1280×600  peta statis lokasi
  youtube-channel-avatar.jpg 900×900   avatar channel YouTube
  linktree-raw.json          data mentah Linktree (__NEXT_DATA__)
icons/                       ikon Tabler outline: WhatsApp (message-circle), Instagram, Facebook, YouTube
youtube/
  channel-banner.jpg         2048×339  banner "Mission"
  videos.json                31 video: tanggal, durasi, views, judul, deskripsi
  thumbnails/<id>.jpg        thumbnail tiap video (maxres bila tersedia)
  frames/<id>-<n>.jpg        3 frame asli per video (maxres1–3, 1280×720), sumber foto situs
                             lewat scripts/make-photos.mjs. Frame intro "Tribes · Every Nation Music"
                             (jemaat bernyanyi, kolase 4 foto) BUKAN jemaat ENKG, jangan dipakai.
google-forms.json            struktur kedua Google Form + entry ID
```

## Kolase hero

`src/components/sections/hero-community.tsx` memakai enam area foto dari
`public/images/photos/community-collage.jpg`, aset yang sebelumnya belum dipakai di halaman.
Sumbernya adalah frame ketiga video [7 Years of Caleidoscope](https://www.youtube.com/watch?v=RpeQN5sbQJ4)
dari channel YouTube ENKG yang ditautkan di [Linktree](https://linktr.ee/enkg).

Potongan ditampilkan lewat viewport SVG (berkas foto asli tetap utuh): persekutuan,
anak-anak, kebersamaan di meja, Life Group, dan foto kelompok jemaat. Area teks video
tidak ikut ditampilkan. Enam viewport berbagi satu URL gambar sekitar 216 KiB,
dengan opacity rendah, tepi memudar, dan parallax ringan yang mengikuti preferensi
pengurangan gerakan pengguna. Tidak memakai footage musik Every Nation global.

## Tidak bisa diambil

- **Instagram:** konten dilindungi login, tidak bisa di-scrape tanpa akun. Foto kegiatan perlu diekspor manual oleh admin IG.
- **Facebook:** permintaan tanpa login ditolak (HTTP 400).
- **Youth Ministry (Google Drive):** file `1QLz4KSVa1trYx9tUJypaH62us-Mw0iOx` sudah **404** (dihapus/privat) — link di Linktree mati.
- **Logo vektor (SVG):** hanya ada PNG 600×600. Minta file asli ke tim desain.
