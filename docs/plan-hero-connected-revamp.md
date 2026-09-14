# ENKG — Audit & Plan Revamp: "Berbeda-beda, satu di dalam Kristus"

Ditulis 14 September 2026. Fokus: hero section, lalu audit semua section, lalu plan redesign
by design dan by wording. Sumber pembanding: 6 situs Every Nation lain (lihat Bagian 2).

---

## Bagian 0 — Ringkasan: 5 hal yang paling penting

1. **Masalah foto hero bukan masalah layout, tapi masalah sumber foto.** Enam foto di hero
   adalah potongan dari satu kolase di dalam frame YouTube 1280x720. Tile terkecil hanya
   253x157 piksel asli tapi ditampilkan ~410px lebar di layar Retina. Layout apa pun akan
   tetap terlihat buram dengan sumber ini. Desain sekarang menyembunyikannya dengan
   `opacity: 0.5` dan filter sepia, dan itu justru membuat wajah orang tidak terlihat.
   **Item nomor satu: minta foto asli ke tim media gereja** (brief lengkap di Bagian 5).

2. **Layout foto sekarang justru berkata "terpisah", bukan "connected".** Setiap foto punya
   rotasi acak (-5, +3, -3 derajat), jarak 16px, kartu melayang sendiri-sendiri, dan dua
   lapis mask yang memudarkan. Tidak ada satu pun elemen yang menyambung antar foto.
   Perbaikan intinya: **foto harus saling menempel jadi satu bentuk**, rotasi dihapus total.

3. **"Honor God. Make Disciples." hampir tidak kelihatan.** Tidak ada di hero sama sekali.
   Di section Siapa Kita, letaknya di bawah pada ukuran `text-3xl`, lebih kecil daripada
   judul "Sebuah gereja. Sebuah keluarga." di atasnya. Prioritas nomor satu kamu justru
   dapat treatment paling kecil.

4. **Tidak ada jalur untuk tamu baru.** Enam situs Every Nation yang saya cek semuanya punya
   "Plan your visit" sebagai CTA utama. ENKG punya "Jadwal ibadah" dan "Tonton khotbah",
   dua-duanya untuk jemaat yang sudah tahu. Tidak ada section "baru pertama kali",
   dan di form Contact Us tidak ada tab untuk orang yang cuma mau datang hari Minggu.

5. **Life Group cuma satu dari lima kartu.** Padahal ini jantung gereja menurut kamu
   (gereja yang bertemu tiap hari, connect di daily life, tidak sendirian). Visualnya
   sekarang: ikon outline dua orang. Life Group perlu section sendiri.

Di luar itu: ada 6 potong konten yang sudah ditulis tapi tidak pernah dirender
(`stats`, `mission.en`, `vision.focus[].body`, `ministry.image`, `site.headline`,
`preaching-worship.jpg`). Tiga di antaranya justru pas untuk vibe yang kamu mau,
terutama stat **"80+ bangsa"**.

---

## Bagian 1 — Analisa hero section sekarang

File: `src/components/sections/hero.tsx`, `src/components/sections/hero-community.tsx`,
`src/app/globals.css:392-487`.

### 1.1 Layout foto

| # | Temuan | Lokasi |
|---|---|---|
| 1 | Rotasi acak per foto (-5deg, +3deg, -3deg) membuat blok terbaca "tumpukan snapshot", bukan satu kesatuan | `globals.css:428,437-443` |
| 2 | Gap 16px plus `box-shadow` per foto: tiap foto jadi objek terpisah yang melayang sendiri | `globals.css:419,427` |
| 3 | Tidak ada elemen penyambung. Tidak ada garis, tidak ada overlap, tidak ada sisi yang bertemu | — |
| 4 | Dua lapis `mask-image` (horizontal di `.hero-community-motion`, vertikal di grid) memudarkan tepi ke empat arah, jadi bentuk blok tidak pernah selesai | `globals.css:410,421` |
| 5 | `margin-right: -24%` memotong foto paling kanan tepat di tepi viewport. Di screenshot 1440px, foto kanan terpotong tegak lurus | `globals.css:405` |
| 6 | `opacity: 0.5` + `filter: saturate(0.6) sepia(0.16)` di atas latar navy: wajah orang tidak terbaca. Ini menghapus satu-satunya alasan menaruh foto orang di hero | `globals.css:422,433` |
| 7 | Enam tile kecil dari satu sumber 1280x720. Makin banyak tile, makin sedikit piksel per tile. Frame terkecil `253x157` | `hero-community.tsx:6-13` |
| 8 | Seluruh blok `aria-hidden="true"`, dan caption "Saling mengenal. Saling menguatkan." ada **di dalam** blok itu. Jadi kalimat terbaik di hero tidak terbaca screen reader dan tidak terindeks | `hero-community.tsx:17,29` |
| 9 | `Parallax speed={-3}` menambah gerakan tanpa menambah makna. Gerakan yang menggeser-geser justru melawan pesan "satu, solid" | `hero-community.tsx:18` |

### 1.2 Layout keseluruhan hero

10. Grid pakai `items-center` (`hero.tsx:17`) tapi blok foto punya `padding: 20px 0 40px`
    dan mask sendiri, jadi secara visual mengambang lebih tinggi dari blok teks. Tidak
    ada garis horizontal yang sama antara judul dan foto.
11. Ada pita kosong besar antara tombol CTA dan strip info di bawah (terlihat jelas di
    screenshot desktop, sekitar 130px kosong). Hero terasa belum selesai dikomposisi.
12. `hero-heading` `clamp(3.6rem ... 7.5rem)` sangat besar dan menghabiskan fold. Tidak
    ada ruang tersisa untuk pernyataan misi.
13. Di mobile, foto turun ke bawah CTA dengan tinggi 240px, `opacity: 0.48`. Hasilnya
    blok gelap keruh yang wajahnya tidak terbaca sama sekali.

### 1.3 Wording hero

14. **"Bertumbuh bersama dalam iman."** Ini kalimat untuk orang yang sudah di dalam.
    Tamu baru belum "bertumbuh bersama" dengan siapa pun.
15. Tidak ada "Honor God. Make Disciples." Tidak ada.
16. Tidak ada penanda bahwa ini Every Nation. Orang yang sudah tahu Every Nation dari
    Jakarta, Manila, atau luar negeri tidak dapat konfirmasi apa pun bahwa ini gereja
    yang sama. Padahal ini salah satu dari dua target audiens kamu.
17. CTA "Jadwal ibadah" dan "Tonton khotbah" dua-duanya utilitas jemaat. Tidak ada
    pintu masuk untuk tamu.
18. Tidak ada satu pun kata soal diterima, disambut, atau tidak sendirian.

---

## Bagian 2 — Riset: situs Every Nation lain

Saya baca 6 situs. Yang paling relevan untuk vibe yang kamu mau:

**Every Nation Perth** (enperth.org) — ini yang paling dekat dengan maksud kamu:
> "Every Nation Church Perth is a group of people, from many different nations,
> backgrounds and ages. **Whoever you are, whatever your story you are welcome to join us.**"
> "Be connected, be inspired and grow in your faith as we seek to honour God together as a family."

Hero-nya: "We would love for you to join us!" dengan CTA tunggal "Click here to plan your visit."

**Every Nation New Jersey** (everynationnj.org) — hero-nya langsung teologis:
> Hero: "God's heart is for you and for all people, from every nation to be part of His family."
> "**Whatever stage in life we are in, we don't need to go through life alone.** At Every
> Nation, we cultivate care and fellowship, so we can strengthen each other, learn together."
> "Whether you're seeking a church for the first time, exploring faith with questions,
> returning to your beliefs, or established in your walk, the community welcomes you."

Kalimat "we don't need to go through life alone" itu persis poin Life Group yang kamu sebut.
Dan empat kategori tamu di kalimat terakhir itu cara elegan bilang "siapa pun boleh".

**Every Nation Seattle** (everynationseattle.org) — hero paling hangat:
> Hero: "Pull up a Chair." / "This is Church." CTA: "Plan your visit"
> "New to ENCS? Start Here. **Visiting a church for the first time can feel like a big step.**"
> "You'll find a community that feels like family. We gather around tables, share stories,
> and grow together in faith that's lived out in everyday life."

**Every Nation Lexington** — hero-nya justru menyapa tamu, bukan jemaat:
> Hero: "New to Every Nation Lexington?"
> "We are a **multi-ethnic, multi-generational** church that exists to honor God by
> connecting people to God and one another to reach the world."

**Every Nation Las Vegas** — pakai triad khas Every Nation:
> "You can **belong, believe, and become** the person that God made you to be with us."
> "Life Groups are the perfect place to belong, believe, and become."

**everynation.org (global)** — hero: "One foot on the campus, / One foot in the community."
Lalu blok angka: Nations / Churches / University Campuses. Per 2026 Every Nation ada di 86 bangsa.

### Pola yang konsisten di semua situs itu, dan belum ada di ENKG

| Pola | Ada di ENKG? |
|---|---|
| "Plan your visit" sebagai CTA utama hero | Tidak |
| Section khusus "new here / start here" | Tidak |
| Hero menyapa tamu, bukan jemaat | Tidak |
| Kalimat eksplisit "siapa pun kamu, kamu diterima" | Tidak |
| Life Group dibahas sebagai tempat tidak sendirian, bukan cuma kelompok belajar | Setengah |
| Misi "honor God" muncul di paruh atas halaman | Tidak |
| Blok angka (bangsa / gereja / tahun) sebagai bukti keluarga global | Sudah ditulis, tidak dirender |
| Disebut "multi-ethnic / many nations, backgrounds and ages" | Tidak |

Catatan: dua situs (everynationjakarta.com dan everynation.com) tidak bisa dibaca isinya.
Jakarta hero-nya banner gambar tanpa teks, dan everynation.com menolak koneksi.

---

## Bagian 3 — Vibe & wording: tiga tamu, satu pesan

### 3.1 Siapa yang datang ke situs ini

**Tamu A — orang luar yang sedang cari gereja.**
Pertanyaan di kepalanya, berurutan: Gereja macam apa ini? Bakal dihakimi tidak?
Kapan dan di mana? Saya datang sendiri, nanti bengong sendiri tidak? Anak saya bagaimana?
Mereka percaya apa?
→ Yang dia butuh: izin untuk datang apa adanya, dan kepastian ada yang menemani.

**Tamu B — sudah tahu Every Nation, baru tahu ada ENKG.**
Pertanyaannya: Ini Every Nation yang sama? Nilainya sama? Siapa gembalanya? Life Group-nya
apa saja? Saya bisa langsung plug in?
→ Yang dia butuh: konfirmasi identitas Every Nation di atas fold, dan pintu Life Group cepat.

**Tamu C — jemaat.**
Butuh: jadwal, link Zoom, khotbah, rekening.
→ Ini yang sudah dilayani situs sekarang. Jangan dihilangkan, tapi turunkan prioritasnya
dari hero ke strip info dan section jadwal.

### 3.2 Tulang punggung pesan

Urutan prioritas kamu, diterjemahkan jadi struktur:

1. **Honor God. Make Disciples.** → jadi pernyataan permanen, muncul dua kali:
   satu pita di bawah hero, satu blok besar di Siapa Kita.
2. **Diterima dan tidak sendirian** → jadi headline hero dan section "Baru di Sini" +
   Life Group naik jadi section sendiri.
3. **Connected, satu di dalam Kristus, Tuhan kepalanya** → jadi metafora desain (mosaik
   yang menempel jadi satu tubuh) dan jadi headline Siapa Kita.

Yang enak: teologi untuk poin 3 **sudah ada di konten kamu**, cuma terkubur.
`src/content/about.ts:122-124`, pokok iman nomor 9:

> "Gereja adalah tubuh Kristus dengan Yesus sebagai kepala, berkumpul untuk beribadah,
> berdoa, menerima sakramen, dan bersekutu."

Itu kalimat inti vibe yang kamu mau, dan sekarang dia ada di dalam accordion yang
tertutup di section keempat. Kalimat ini harus naik.

Ayat pendukung kalau mau dipakai: 1 Korintus 12:12-27 (banyak anggota, satu tubuh),
Efesus 4:15-16 (Kristus kepala, tubuh yang dirangkai jadi satu), Galatia 3:28
("kamu semua adalah satu di dalam Kristus Yesus").

### 3.3 Aturan suara (lanjutan dari aturan yang sudah kamu set)

- Bahasa Indonesia santai, "kamu", kalimat pendek.
- Tanpa em dash di copy yang tampil.
- Tanpa eyebrow atau tag di atas judul hero.
- Hindari pola "bukan X, tapi Y" dan tricolon slogan.
- Tambahan untuk revamp ini: **sapa tamu, jangan sapa jemaat**. Setiap headline diuji
  dengan pertanyaan "kalimat ini masih masuk akal buat orang yang belum pernah datang?"
- Inggris dipakai hemat dan hanya di tempat yang memang Inggris: "Honor God. Make Disciples.",
  "Life Group", "Kids Church", "Sunday Service". Sisanya Indonesia.

### 3.4 Copy deck hero

**Pilihan headline** (semua dua baris, baris kedua pakai serif italic sun-300 seperti
sistem tipografi yang sudah ada):

| | Headline | Kenapa |
|---|---|---|
| **A (rekomendasi)** | Berbeda-beda.<br>*Satu di dalam Kristus.* | Langsung mengunci vibe "no memandang bulu, tetap satu". Selaras dengan nama Every Nation dan globe di logo. Dasar ayatnya kuat (Gal 3:28). |
| B | Banyak cerita.<br>*Satu keluarga.* | Lebih hangat, lebih mudah dicerna, tapi "keluarga" sudah dipakai di Siapa Kita dan News. |
| C | Datang apa adanya.<br>*Bertumbuh bersama.* | Paling ramah tamu, paling lemah di sisi "satu tubuh". |
| D | Kita berbeda.<br>*Kepala kita satu.* | Paling tajam secara teologis, tapi butuh konteks. Berisiko ambigu di luar konteks. |

**Sub-headline:**
> Setiap orang datang dengan ceritanya sendiri. Di sini tidak ada yang berjalan sendirian.

Dua kalimat pendek, dan kalimat kedua langsung menanam alasan Life Group ada.

**CTA:**
- Primer: **Rencanakan kunjungan** → `#baru-di-sini`
- Sekunder: **Cari Life Group** → `#life-group`
- ("Jadwal ibadah" dan "Tonton khotbah" turun ke strip info dan section masing-masing.)

**Pita misi** (di bawah CTA, di atas strip info, full width):
> **Honor God. Make Disciples.**
> Menghormati Tuhan dan menjadikan murid. Bersama keluarga Every Nation di lebih dari 80 bangsa.

Satu pita ini kerja tiga arah sekaligus: menyatakan visi (prioritas 1), memberi konfirmasi
ke Tamu B bahwa ini Every Nation yang asli, dan memperkuat "banyak bangsa, satu keluarga".

**Caption mosaik** (jadi `figcaption` yang terbaca, bukan di dalam `aria-hidden`):
> Jemaat Every Nation Kelapa Gading, dari berbagai usia, pekerjaan, dan latar belakang.

**Strip info** (pertahankan, tambah satu):
> Ibadah Minggu berikutnya · Stream Hall, Mahaka Square Lt. 2 · **Baru pertama kali?**

---

## Bagian 4 — Layout foto hero: 4 opsi

Prinsip yang harus dipegang opsi mana pun: **foto yang saling bersentuhan terbaca sebagai
satu benda; foto yang berjarak dan berotasi terbaca sebagai tumpukan lepas.** Itu seluruh
inti masalahnya.

### Opsi A — Mosaik "Satu Tubuh" (rekomendasi)

Satu grid rapat, tile saling menempel, membentuk satu bentuk utuh.

```
┌──────────┬─────┬─────┐     tile menempel, seam 2px
│          │     │     │     tanpa rotasi sama sekali
│  ANCHOR  ├─────┴─────┤     ukuran tile beda-beda
│  (besar) │           │     radius hanya di bentuk luar
├──────┬───┴───────────┤     satu garis sun-300 tipis
│      │               │     menyambung dari headline
└──────┴───────────────┘     masuk ke mosaik
```

Spesifikasi:
- `gap: 2px` menggantikan `16px`. Seam tipis, bukan jarak.
- **Rotasi dihapus total.** Hapus `transform: rotate()` di ketiga rule.
- `border-radius` hanya pada container luar (`overflow: hidden`), tile-nya kotak.
  Hasilnya satu bentuk, bukan enam kartu.
- `box-shadow` per tile dihapus, diganti satu shadow di container.
- **4 tile, bukan 6.** Dengan sumber 1280x720 yang sama, 4 tile berarti tiap tile dapat
  50 persen lebih banyak piksel asli. Ini perbaikan ketajaman yang nyata, bukan kosmetik.
- Ukuran tile sengaja tidak sama (satu anchor besar + 3 kecil) lewat `grid-template-areas`,
  supaya tidak jadi grid 2x2 yang datar. Ukuran beda, satu bentuk: itu makna "satu tubuh".
- `opacity: 1`. Untuk tetap menyatu dengan latar navy, ganti trik opacity dengan duotone
  yang disengaja: latar tile navy-950 + gambar `mix-blend-mode: luminosity` + overlay
  navy 12 persen. Hasilnya konsisten, terlihat art-directed, dan wajah tetap terbaca.
  Sekarang wajah tidak terbaca, dan itu menghapus alasan foto ada di situ.
- `mask-image` dua lapis dihapus. Kalau masih mau bleed ke kanan, pakai satu vignette
  halus di tepi kanan saja, dan pastikan tidak memotong tile tegak lurus di tepi viewport.
- Parallax diganti. Opsi: tidak ada gerakan, atau satu `scale` sangat lambat pada seluruh
  blok. Gerakan yang menggeser tile satu-satu melawan pesan "solid, satu".
- Elemen penyambung: satu garis 1px sun-300/40 yang mulai dari akhir baris kedua headline
  dan masuk ke sisi kiri mosaik. Kata-kata dan orang-orangnya tersambung secara literal.
- Aksesibilitas: `aria-hidden` dilepas, dipasang `<figure>` + `<figcaption>`.

Mobile: mosaik jadi 3 tile mendatar yang menempel, tinggi ~200px, di bawah CTA,
`opacity: 1` dengan duotone yang sama. Bukan 6 tile keruh seperti sekarang.

### Opsi B — Rantai bertumpuk

Tile saling menimpa 15 sampai 20 persen dalam rantai diagonal. Tumpang tindih = relasi.
Enak di mobile sebagai rantai horizontal. Risiko: bagian yang tertimpa sering justru wajah,
jadi butuh kontrol crop yang teliti. Lebih rapuh dari A.

### Opsi C — Busur mengelilingi pernyataan misi

Foto disusun pada busur, "Honor God. Make Disciples." di tengah, tiap foto dihubungkan
garis tipis. Konsep paling kuat dan paling nyambung ke globe di logo. Paling mahal
dikerjakan dan paling sulit dibikin rapi di semua breakpoint. Kandidat untuk nanti,
setelah ada foto asli.

### Opsi D — Satu foto lebar full-bleed

Satu foto jemaat selebar hero, headline di atasnya. Ini yang dipakai mayoritas situs
Every Nation, dan ini pernyataan "kami satu ruangan penuh orang" yang paling kuat.
**Terhalang kualitas foto hari ini.** Rekomendasi: bangun Opsi A sekarang dengan struktur
yang bisa ditukar ke D nanti tanpa merombak hero (satu prop `variant` di komponen hero).

---

## Bagian 5 — Brief foto untuk tim media gereja

Ini item dengan leverage paling besar di seluruh dokumen. Tanpa ini, hero akan selalu
terlihat setengah jadi.

Sudah tercukupi dari Instagram: jemaat saat ibadah, jemaat bersama gembala, dan
momen persekutuan di meja. Yang masih kosong:

| # | Foto | Untuk | Orientasi |
|---|---|---|---|
| 1 | Kids Church, anak-anak sedang beraktivitas | Kartu Kids Church | Landscape, min 1200px |
| 2 | Life Group sedang bertemu di rumah, 6 sampai 10 orang | Section Life Group | Landscape, min 1600px |
| 3 | Doa bersama, tangan terangkat atau dua orang berdoa | Kartu Prayer Meeting | Landscape, min 1200px |
| 4 | Youth ngumpul | Kartu Youth | Landscape, min 1200px |
| 5 | Ps. Raswan dan Ibu Sharon, potret berdua, cahaya natural | Avatar gembala di Siapa Kita | Portrait, min 800x800 |
| 6 | Satu foto untuk preview WhatsApp dan tautan | `opengraph-image.png` | Landscape 1200x630 |

Aturan teknis: kirim file **asli dari HP**, jangan lewat WhatsApp, jangan screenshot,
jangan pakai filter. HP keluaran 3 tahun terakhir sudah lebih dari cukup.
Satu foto bagus dari kamera HP jauh mengalahkan potongan frame YouTube.

Sementara foto belum ada, Opsi A tetap dijalankan dengan sumber yang ada sekarang,
karena 4 tile besar dengan duotone yang disengaja akan jauh lebih baik daripada
6 tile kecil setengah transparan.

---

## Bagian 6 — Audit per section

### Hero
Sudah di Bagian 1. 18 temuan.

### Siapa Kita (`about.tsx`)

| # | Temuan |
|---|---|
| 19 | "Honor God. Make Disciples." ada di bawah, `text-3xl`, lebih kecil dari judul section di atasnya. Prioritas nomor satu kamu dapat treatment paling kecil. `about.tsx:68-72` |
| 20 | `gathering.jpg` menampilkan slide proyektor "BERKUMPUL BERSEKUTU" di belakang gembala. Teks slide bersaing dengan desain, dan hasilnya terlihat seperti screengrab siaran |
| 21 | Avatar gembala adalah crop orang yang sama dari foto yang sama persis di atasnya. Redundan |
| 22 | `stats` (2019 / 7 tahun / **80+ bangsa** / 3 Life Group) ditulis di `content/about.ts:15-20` dan **tidak pernah dirender**. Stat "80+ bangsa" adalah bukti paling kuat untuk vibe connected yang kamu mau |
| 23 | `mission.en` ditulis di `about.ts:51` dan tidak pernah dirender. Untuk Tamu B dan jemaat yang kenal Every Nation dari luar negeri, versi Inggris itu justru penanda identitas |
| 24 | `vision.focus[].body` (3 kalimat) tidak pernah dirender, cuma `title`-nya. Jadi "Gereja lokal / Pelayanan kampus / Bangsa-bangsa" tampil sebagai 3 pill outline kecil tanpa penjelasan. Ide keluarga global dapat treatment visual paling lemah |
| 25 | Tidak ada satu kalimat pun soal "kami tidak memandang bulu" atau "semua diterima" di seluruh halaman |

### Iman & Nilai (`beliefs.tsx`)

| # | Temuan |
|---|---|
| 26 | Posisinya nomor 3 di halaman. Statement of faith 12 pokok muncul sebelum tamu tahu jam ibadah atau apa itu Life Group. Berat untuk tamu baru, dan prioritas 2 kamu (merasa welcome) jadi datang setelah doktrin |
| 27 | Pokok iman nomor 9, "Gereja adalah tubuh Kristus dengan Yesus sebagai kepala", yaitu inti vibe yang kamu minta, terkubur di dalam accordion tertutup |
| 28 | 5 kartu nilai tertutup semua secara default. Tamu melihat 5 label satu kata dalam bahasa Inggris tanpa konteks, di section setinggi satu layar penuh |

### Pelayanan (`services.tsx`)

| # | Temuan |
|---|---|
| 29 | Kartu pelayanan pakai ilustrasi placeholder abstrak: bentuk lengkung untuk Kids Church, ikon outline `Icon.users` untuk Life Group, dan tipografi "Mari berdoa." untuk Prayer. Semuanya terbaca sebagai "fotonya belum ada" |
| 30 | `ministries.ts` sudah mendeklarasikan `image` asli untuk kids-church, life-group, dan prayer-request (banner Canva yang sudah ada di `public/images/ministries/`), dan `MinistryCard` **tidak pernah merendernya**. Aset mati + konten mati |
| 31 | Life Group cuma satu dari lima kartu sejajar, dan visualnya ikon outline. Padahal ini hal yang paling kamu tekankan |
| 32 | Kartu Youth pakai sun-500 full-bleed plus kata hantu "Youth" raksasa. Secara visual ini kartu paling berisik di halaman, jadi Youth terbaca lebih penting daripada Sunday Service dan Life Group |
| 33 | Kolom pertama tabel jadwal ("Setiap Minggu", 3 item) sempit dibanding kolom 2 dan 3 yang cuma 1 item, di 1440px |
| 34 | Intro "Ibadah, doa, dan kelompok kecil setiap minggu." adalah daftar kering |

### News (`news.tsx`)
Section paling sehat. Thumbnail khotbah asli, poster asli, hierarki jelas.

| # | Temuan |
|---|---|
| 35 | Ironi: gambar terbaik di seluruh situs ada di sini, sementara hero pakai yang terburuk |

### ProCon (`procon.tsx`)

| # | Temuan |
|---|---|
| 36 | Latar grid hampir hitam memutus identitas cream dan navy gereja. Di tengah halaman, section ini terbaca seperti brand lain |
| 37 | Ketiga kartu berlabel "Segera hadir". Tiga janji kosong berderet menurunkan kredibilitas di halaman utama |
| 38 | Posisinya antara News dan Contact Us, jadi tamu baru menabrak kelas AI, keuangan, dan leadership tepat sebelum momen "ayo datang". Salah tempat di perjalanan tamu |

### Contact Us (`connect.tsx`)
Paling matang secara teknis: form bertab, kirim ke Google Form yang sama, peta, WhatsApp.

| # | Temuan |
|---|---|
| 39 | **Tidak ada jalur kunjungan pertama.** Tab-nya Life Group / Permohonan Doa / Kirim Pesan. Orang yang cuma mau datang hari Minggu tidak punya form, dan "Plan your visit" yang jadi pola universal Every Nation tidak ada |
| 40 | "Hubungi kami." transaksional untuk section yang seharusnya jadi puncak emosional sambutan |
| 41 | Form Life Group menanyakan jenis kelamin, usia, dan domisili sebelum memberi kepastian apa pun soal apa yang terjadi setelah kirim |

### Give (`give.tsx`)

| # | Temuan |
|---|---|
| 42 | `site.give.bank` dan `accountNumber` masih kosong, jadi yang tampil fallback "tanya lewat WhatsApp". Sudah diketahui, menunggu data resmi |
| 43 | Give jadi section terakhir. Untuk tamu baru, halaman ditutup dengan urusan uang. Penutup yang lebih baik adalah undangan |

### Lintas section

| # | Temuan |
|---|---|
| 44 | Urutan halaman sekarang: Hero, Siapa Kita, Iman, Pelayanan, News, ProCon, Contact, Give. Urutan pertanyaan tamu: boleh datang tidak? kapan dan di mana? nanti sendirian tidak? kalian percaya apa? siapa yang pimpin? Doktrin di posisi 3 dan ProCon di posisi 6 sama-sama memotong alur |
| 45 | `site.headline` ("Bertumbuh bersama dalam iman.") dan `preaching-worship.jpg` tidak dipakai di mana pun |
| 46 | Seluruh situs monolingual kecuali tagline. Untuk audiens yang termasuk orang yang kenal Every Nation dari luar dan ekspat Jakarta, minimal misi sebaiknya tampil ID dan EN berdampingan. Teksnya sudah ada |

---

## Bagian 7 — Plan revamp

### 7.1 Urutan halaman yang diusulkan

| Sekarang | Usulan | Alasan |
|---|---|---|
| 1 Hero | 1 Hero (revamp) | Sapa tamu, bukan jemaat |
| — | 2 **Baru di Sini** (baru) | Jawab lima pertanyaan pertama tamu sebelum ditanya |
| 2 Siapa Kita | 3 Siapa Kita (revamp) | Honor God Make Disciples naik ke skala besar |
| — | 4 **Life Group** (baru) | Jantung gereja dapat section sendiri |
| 4 Pelayanan | 5 Pelayanan & Jadwal | Detail menyusul setelah "kenapa" |
| 3 Iman | 6 Iman & Nilai | Doktrin setelah tamu merasa diterima |
| 5 News | 7 News & Khotbah | Bukti kehidupan gereja |
| 7 Contact | 8 Contact Us | Puncak: ajakan bertemu |
| 8 Give | 9 Give | |
| 6 ProCon | 10 ProCon | Diturunkan, lihat 7.3 |

Navigasi: `Siapa Kita · Life Group · Pelayanan · News · ProCon · Contact Us · Give`,
tombol header berubah dari "Ibadah Minggu" jadi **"Rencanakan kunjungan"**.
Tujuh item mungkin terlalu lebar di 1440px; kalau begitu ProCon keluar dari nav desktop
dan tetap ada di menu mobile serta tetap ada sebagai section.

### 7.2 Copy deck per section

**BARU DI SINI** (`#baru-di-sini`, section baru)
> Judul: **Baru pertama kali? Santai saja.**
> Intro: Kamu tidak perlu tahu apa-apa dulu untuk datang. Cukup datang.
>
> - **Kapan dan di mana** — Minggu 10.00 WIB di Stream Hall, Mahaka Square Lt. 2. Doa bersama mulai 09.15.
> - **Yang terjadi di ibadah** — Pujian, firman, dan doa. *(durasi perlu dikonfirmasi)*
> - **Pakai apa saja** — Datang dengan pakaian yang membuatmu nyaman. Tidak ada aturan.
> - **Anak ikut?** — Kids Church mulai 10.30 di Unit B6. Anakmu ada yang jaga dan ada temannya.
> - **Kamu akan disambut** — Bilang saja ini kunjungan pertamamu, nanti ada yang menemani masuk. *(perlu dikonfirmasi ada tim welcome)*
>
> CTA: **Kabari kami kamu datang**

**SIAPA KITA** (revamp)
> Judul: **Satu tubuh.** / *Yesus kepalanya.*
> p1: Every Nation Kelapa Gading berdiri sejak 2019 di Mahaka Square, Jakarta Utara. Kami satu gereja dari banyak latar: keluarga muda, pekerja, mahasiswa, anak-anak.
> p2: Kami tidak memandang dari mana kamu datang. Di hadapan Tuhan kita semua sama, dan pintu kami terbuka untuk siapa saja yang mau masuk.
>
> Blok misi, skala besar: **Honor God. Make Disciples.** + misi ID dan EN berdampingan
> Blok angka (render `stats`): 2019 · 7 tahun · **80+ bangsa** · 3 Life Group
> Gembala: Ps. Raswan Gautama & Ibu Sharon Gautama

**LIFE GROUP** (`#life-group`, section baru)
> Judul: **Gereja tidak berhenti hari Minggu.**
> Intro: Life Group adalah kelompok kecil yang bertemu rutin di luar ibadah. Di sinilah kami saling kenal nama dan saling tahu kabar.
> Body: Hidup sehari-hari lebih ringan kalau ada yang jalan bareng. Waktu kamu senang, ada yang ikut senang. Waktu kamu berat, ada yang tahu dan mendoakan.
>
> - **Family** — untuk pasangan dan keluarga
> - **Young Professional** — untuk yang sudah bekerja
> - **Youth** — untuk pelajar dan mahasiswa
>
> Penenang: Kamu tidak perlu jadi anggota dulu. Datang saja sekali, lihat sendiri.
> CTA: **Gabung Life Group**

**IMAN & NILAI** (tambah kalimat pembuka)
> Kalimat pembuka baru, diambil dari pokok iman nomor 9:
> "Gereja adalah tubuh Kristus, dan Yesus kepalanya. Kami berbeda dalam banyak hal, dan kami satu di dalam Dia."
> Lalu 5 nilai (buka satu kartu secara default supaya tamu tahu ini bisa diklik), lalu statement of faith.

**PELAYANAN**
> Judul tetap: **Ada tempat untukmu di sini.**
> Intro baru: Ibadah Minggu, Kids Church, doa bersama, dan Life Group. Semua terbuka untuk tamu.

**CONTACT US**
> Judul: **Mari berkenalan.**
> Intro: Mau datang, mau didoakan, atau mau tanya-tanya dulu? Semuanya boleh.
> Tab pertama baru: **Rencanakan kunjungan** — "Kabari kami kamu datang, nanti ada yang menyambut." Field: Nama, WhatsApp, rencana datang Minggu tanggal berapa, bawa anak atau tidak.

**FOOTER** (tambah)
> **Honor God. Make Disciples.**
> Bagian dari Every Nation, gerakan gereja dan pelayanan kampus di lebih dari 80 bangsa.

### 7.3 Fase kerja

**Fase 1 — SELESAI. Hero.** Inti permintaan. Mosaik Opsi A, copy baru, pita misi, CTA baru,
figcaption menggantikan `aria-hidden`, tutup pita kosong di bawah CTA.
Sentuh: `hero.tsx`, `hero-community.tsx` (jadi `hero-mosaic.tsx`), `globals.css:392-487`,
`site.ts` (headline baru).

**Fase 2 — SELESAI. Life Group naik jadi section sendiri.** Section baru, kartu Life Group di
Pelayanan jadi penunjuk ke section itu. Kartu di Pelayanan tetap ada.

**Fase 3 — SELESAI. Siapa Kita.** Judul "Satu tubuh. Yesus kepalanya.", promosikan blok misi ke
skala besar, render `stats` dan `mission.en` dan `vision.focus[].body`, tambah kalimat
"tidak memandang bulu", ganti foto gembala jadi potret terpisah kalau foto baru sudah ada.

### Catatan hasil Fase 2 & 3 (14 September 2026)

Urutan halaman sekarang: `beranda > siapa-kita > life-group > pelayanan > iman > news >
procon > kontak > give`. Satu baris dari Fase 6 ditarik maju, yaitu Iman turun ke bawah
Pelayanan, supaya pergantian terang dan gelap tetap rapi setelah Life Group (navy)
disisipkan di antara Siapa Kita (krem) dan Pelayanan (krem).

Navigasi jadi 7 item dan masih muat di 1440px:
Siapa Kita · Life Group · Pelayanan · News · ProCon · Contact Us · Give.

Life Group memakai tiga kartu yang sisinya bersentuhan (`gap-px`), meneruskan bahasa
"satu tubuh" dari mosaik hero. Tiap kartu deep-link ke formulir Terhubung dengan
pilihan kelompoknya terisi otomatis lewat anchor baru `#gabung-family` dan
`#gabung-young-professional`, memakai mekanisme `HASHES` yang sudah ada. Ketiganya
sudah diuji jalan. Kartu Life Group di Pelayanan tidak dihapus, CTA-nya berubah jadi
"Lihat Life Group" menuju `#life-group`.

Di Siapa Kita, "Honor God. Make Disciples." naik ke `text-display`, jadi elemen terbesar
di section itu, di atas judul section sendiri. Empat konten yang sebelumnya ditulis tapi
tidak pernah dirender kini tampil: `stats` (termasuk 80+ bangsa), `mission.en`,
`vision.focus[].body`, dan `story.title`. Paragraf "kami tidak memandang dari mana kamu
datang" ditambahkan tanpa membuang isi paragraf lama (2019, Mahaka Square, keluarga
Every Nation, ibadah, doa, Life Group, keseharian semuanya tetap ada).

**Fase 4 — SELESAI. Pelayanan.** Render `ministry.image` yang sudah ada supaya placeholder abstrak
hilang, turunkan volume kartu Youth, rapikan lebar kolom jadwal, dan titipkan pita kecil
untuk tamu baru (jam, pakaian, anak-anak). Isi dan kartu yang ada tidak dikurangi.

**Fase 5 — SELESAI. Iman & Nilai.** Angkat kalimat "Gereja adalah tubuh Kristus, Yesus kepalanya"
jadi pembuka section, dan buka satu kartu nilai secara default. Statement of faith 12
pokok tetap utuh.

**Fase 6 — SELESAI. Urutan halaman, Contact Us, footer.** Susun ulang `page.tsx` supaya Iman turun
setelah Life Group dan Pelayanan, judul Contact Us dibuat lebih hangat, dan footer
menambah baris visi misi. ProCon tidak disentuh dan tetap di urutannya.

### Koreksi rencana Fase 4 (14 September 2026)

Rencana awal Fase 4 menyebut "render `ministry.image` yang sudah ada supaya placeholder
abstrak hilang". Setelah file-nya dibuka, rencana itu salah: ketiga banner Canva
(`kids-church.png`, `life-group.png`, `prayer-request.png`) punya judulnya sendiri
tercetak di gambar ("Kids Church", "JOIN LIFE GROUP", "SEND YOUR ANSWERED PRAYERS"),
jadi kalau dirender apa adanya judulnya dobel dengan judul kartu, dan tiga gaya
visualnya saling bentrok di satu baris. Keempat region foto bersih di kolase jemaat
juga sudah terpakai semua di mosaik hero.

Yang dikerjakan sebagai gantinya: kepala tiap kartu jadi satu sistem panel tipografi
yang menampilkan **informasi nyata** dalam ukuran besar, bukan ilustrasi pengganti foto.
Jam untuk Ibadah Minggu dan Kids Church, nama ketiga kelompok untuk Life Group, ayat
Yakobus 5:16 yang dipakai gereja sendiri di form doa untuk Prayer Meeting, dan
"Pelajar / Mahasiswa" untuk Youth. Field `ministry.image` tetap ada di tipe datanya,
jadi begitu foto asli masuk (Fase 7), panel ditukar tanpa mengubah rangka kartu.

Selain itu: Ibadah Minggu naik jadi kartu selebar baris, kartu Youth diturunkan dari
kuning penuh plus kata hantu raksasa menjadi setara kartu lain, kolom jadwal Minggu
dilebarkan (1.45fr ke 1.75fr), dan ditambah pita empat pertanyaan pertama tamu
(kapan, di mana, pakai apa, bawa anak) yang hanya memuat fakta yang sudah pasti.
Durasi ibadah dan keberadaan tim welcome sengaja tidak ditulis karena belum dikonfirmasi.

### Dua pass refine (14 September 2026)

**Pass 1, kedalaman.** Ditambah dua token bayangan, `--shadow-lit` dan
`--shadow-lit-soft`, yang memberi sorot tipis di tepi atas permukaan sehingga kartu
terbaca punya bidang, bukan warna yang ditempel datar. Arah cahayanya konsisten
dengan komentar token yang sudah ada ("satu sumber cahaya dari atas"). Ditambah juga
kelas `.edge-top` dan `.edge-top-soft` untuk batas antar section, jadi perpindahan
terang ke gelap terbaca sebagai dua bidang bertumpuk, bukan potongan datar. Panel
kartu pelayanan diberi gradasi, tingginya dirapatkan dari h-40 ke h-32 supaya tidak
ada ruang kosong di atas isinya, dan baris kartu Life Group mendapat cahaya latar.

**Pass 2, animasi scroll.** Mosaik hero kembali memakai parallax, tapi sebagai **satu
blok utuh** termasuk captionnya, karena blok yang bergeser utuh justru memperkuat
bacaan "satu benda"; yang dihindari sebelumnya adalah tile bergeser sendiri-sendiri.
Judul section kini muncul bertahap (label, judul, intro) dengan jeda 50ms, masih
terasa satu gerakan. Ditambah batang kemajuan baca setipis 2px di tepi atas layar,
karena halamannya 13.500px di desktop dan 20.600px di ponsel.

Semua sudah diuji: `motion-ready` aktif, AOS berjalan (opacity 0 ke 1), parallax
mosaik bergerak, batang kemajuan mencapai penuh di dasar halaman, dan pada
`prefers-reduced-motion` konten tetap terlihat serta parallax mati total.
Tidak ada overflow horizontal di 320, 390, 768, 834, 1024, 1280, 1440, dan 1920px.

### Fase 7 sebagian SELESAI: foto asli dari Instagram gereja (14 September 2026)

Instagram ENKG ternyata bisa diambil tanpa login, dengan catatan. Grid profil ikut
ter-render di belakang login wall (hanya 12 post terbaru, dan semuanya poster khotbah),
tapi **route embed post** `/p/<shortcode>/embed/captioned/` merender foto pada ukuran
CDN penuh, 1080 sampai 1440px, jauh di atas thumbnail grid publik yang cuma 512px.

Lima post yang diberikan pengurus menghasilkan foto jemaat asli, tersimpan di
`resources/instagram/` beserta asal dan captionnya. Dipotong oleh
`scripts/make-photos.mjs` (blok `igCrops`) ke rasio yang sudah disamakan dengan rasio
slotnya, jadi `object-cover` hampir tidak memotong apa pun:

| Hasil | Rasio | Dipakai di |
|---|---|---|
| `jemaat-lengkap.jpg` 1440x679 | 2.12 | Mosaik hero, slot terbesar |
| `jemaat-gembala.jpg` 1080x635 | 1.70 | Mosaik hero |
| `jemaat-panggung.jpg` 1440x615 | 2.34 | Mosaik hero |
| `jemaat-meja.jpg` 1080x571 | 1.89 | Mosaik hero |
| `jemaat-paskah.jpg` 1440x831 | 1.73 | Siapa Kita, menggantikan `gathering.jpg` |

Mosaik hero tidak lagi memakai satu kolase yang dipotong-potong lewat SVG viewBox.
Sekarang empat file terpisah lewat `next/image`, dan tiap tile dikirim pada 640px
(kebutuhan di Retina 614px dan 494px, jadi cukup). Duotone navy ditipiskan dari 0.42
ke 0.26 karena fotonya sudah bersih, sehingga warna kulit tetap hangat.

Ini juga membuka **hero Opsi D** yang tadinya terhalang: `jemaat-lengkap` memuat sekitar
70 orang segala usia dalam satu frame, cukup untuk dipakai sebagai satu foto lebar.
Belum dikerjakan, mosaik masih dipertahankan.

Tidak lagi dipakai tapi belum dihapus: `community-collage.jpg`, `gathering.jpg`,
`preaching-worship.jpg` (~296 KB).

### Redesign lanjutan (14 September 2026)

Permintaan: foto hero lebih menyatu dengan latar, globe sebagai latar ("satu dunia
tapi kita semua keluarga di dalam Tuhan"), hero terasa punya terlalu banyak band,
Honor God / Make Disciples terlalu datar dan terpisah-pisah, dan layout Pelayanan
membosankan padahal Ibadah Minggu, Kids Church, dan Youth itu yang utama.

**Hero.** Mosaik empat tile diganti `hero-visual.tsx`: globe wireframe sebagai latar,
satu foto jemaat besar di atasnya, dan dua lingkaran kecil di persimpangan garis globe.
Globe-nya dihitung sebagai bola sungguhan di `hero-globe.tsx` (rx garis lintang =
sqrt(R^2 - dy^2)), bukan ellipse yang ditebak. Foto lebur ke latar lewat `mask-image`
plus duotone navy.

⚠️ Jebakan yang sempat kena: `radial-gradient` untuk mask **harus berukuran <= 50%**
dari kotaknya. Percobaan pertama memakai `76% 88%`, dan karena ellipse-nya lebih besar
daripada kotak, gradasinya belum selesai memudar ketika sudah sampai tepi, jadi fotonya
tetap bertepi kotak walaupun mask-nya aktif. Ini ketahuan hanya setelah memperbesar
tepi fotonya dan menguji beberapa varian mask langsung di browser.

Pita "Honor God. Make Disciples." dikeluarkan dari hero, jadi hero tinggal dua lapis:
blok judul dengan visual, lalu satu pita info.

**Siapa Kita.** Disusun ulang jadi satu section padu, bukan empat band bergaris.
"Honor God. Make Disciples." naik jadi judul pembuka section pada `text-display`.
Misi dan angka digabung ke dalam satu kartu navy yang jadi jangkar gelap di tengah
section krem, karena "setiap bangsa" di misi dan "80+ bangsa" di angka itu pernyataan
yang sama dari dua sisi. Kartu gembala menumpuk di atas foto jemaat.

**Pelayanan.** Tiga pelayanan utama mendapat blok besar dengan perlakuan masing-masing,
bukan satu cangkang kartu yang diulang lima kali:
- Ibadah Minggu: pita navy selebar baris, jamnya sampai `8.5rem`, plus cahaya yang bernapas
- Kids Church: latar krem hangat dengan deretan lengkung yang naik berurutan saat disentuh
- Youth: latar navy-950 dengan busur sun besar yang membesar saat disentuh
- Doa dan Life Group: pasangan kartu yang lebih tenang
- Jadwal lengkap dipindah ke akhir section, karena itu tabel rujukan dan tadinya
  memotong antar blok pelayanan

### Koreksi arah hero (14 September 2026)

Percobaan pertama menaruh globe di kolom kanan bersama fotonya. Itu salah arah.
Arah yang benar dari pengurus: globe **di belakang tulisan hero** dan hanya
seperempatnya yang terlihat, sedangkan fotonya jadi **latar besar beropasitas rendah
di sisi kanan** yang menutupi banyak bagian hero. Judulnya juga sudah terlalu saya
kecilkan sepanjang sesi (7.5rem ke 5.5rem), sehingga hero terasa kosong.

Hasil akhir:
- Judul tiga baris: "Satu gereja, / satu keluarga / *dari setiap bangsa.*", skala
  dinaikkan lagi ke `clamp(3rem, 1.3rem + 5.6vw, 6.75rem)`
- Globe: pusatnya di luar tepi kiri atas, jadi yang terlihat kuadran kanan bawahnya,
  melengkung di belakang judul
- Foto: tiga foto jadi **kaskade seragam** dengan lebar sama, rasio sama (1.9), dan
  langkah turun serta ke kanan yang sama besar (+21% dan +34%). Percobaan sebelumnya
  memakai lebar dan rasio berbeda-beda di posisi acak, dan pengurus menilainya
  berantakan. Opasitas 0.18, ditahan 12% dari atas supaya tidak menabrak nav dan 18%
  dari bawah supaya tidak menyentuh pita info
- Hero tinggal dua lapis: blok judul, lalu satu pita info

### Eyebrow tanpa garis aksen

Garis pendek sebelum label sub-judul dinilai pengurus sebagai desain yang terlalu
generic. `Eyebrow` sekarang tanpa ornamen apa pun, hanya huruf kapital berjarak
lebar (`tracking-[0.2em]`), sehingga tiga suara tipografi tetap terpisah jelas:
label kapital kecil, judul display sans, dan aksen serif italic. Berlaku di semua
section sekaligus karena satu komponen bersama.

### Putaran terakhir (14 September 2026)

**Hero, kaskade seragam dinilai terlalu mekanis.** Langkah yang persis sama besar
memang membuatnya tertata, tapi jadi terasa berbaris. Sekarang ukurannya dibedakan
(74%, 57%, 49%) dan antar foto saling menimpa sedikit, jadi ketiganya terbaca sebagai
satu susunan yang disengaja: satu foto memimpin, dua lainnya menopang. Tetap mengisi
banyak bidang tanpa terkesan ditempel sembarangan. Ini titik tengah antara percobaan
pertama (posisi acak, dinilai berantakan) dan yang kedua (kaskade seragam, dinilai
terlalu rapih).

**Life Group dapat fotonya.** Intinya komunitas yang dijaga setiap hari, bukan cuma
hari Minggu, jadi fotonya sengaja momen di luar ibadah: jemaat berkumpul dan makan
bersama. Post asalnya di Instagram gereja memang menyebut "fellowship, and Life
Groups", jadi foto ini jujur dipakai di section itu. Crop baru
`lifegroup-meja.jpg` 1080x720.

⚠️ Gradasi di atas foto harus pekat di dasarnya (`from-navy-950 from-6%` sampai
`to-transparent to-62%`). Percobaan pertama memakai gradasi tipis dan captionnya
jatuh tepat di area terang (meja dan kue), jadi tulisannya tidak terbaca.

**Tiap kartu kelompok dapat ikon** supaya tidak kosong: rumah untuk Family, tas kerja
untuk Young Professional, dan topi wisuda untuk Youth. Tiga ikon Tabler baru
ditambahkan ke `icons.tsx`.

### Yang masih perlu difoto sendiri

**Fase 7 — Foto asli.** Jalan paralel, mulai sekarang. Kirim brief Bagian 5 ke tim media.
Setelah foto masuk: tukar hero ke Opsi D, isi kartu pelayanan dengan foto asli, ganti
`gathering.jpg`.

### 7.4 Yang sengaja tidak diubah

- Palet, tipografi, dan token shadow. Sudah konsisten dan diambil dari aset gereja sendiri.
- Section News. Sudah paling sehat.
- Mesin form Contact Us, peta, jadwal otomatis, `lite-youtube`. Semua sudah benar.
- Admin panel.

---

## Bagian 8 — Keputusan yang sudah diambil (14 September 2026)

1. **Headline**: general dan singkat, menggambarkan siapa ENKG →
   **"Satu keluarga dari setiap bangsa."** Sudah dipasang di Fase 1.
2. **Layout mosaik**: Opsi A ("Satu Tubuh"). Sudah dipasang di Fase 1.
3. **Form "Rencanakan kunjungan"**: **dibatalkan.** Tidak dibuat form baru dan tidak
   ada tab baru di Contact Us. Jalur masuk cukup lewat Contact Us yang sudah ada
   (Life Group, Permohonan Doa, Kirim Pesan) dan WhatsApp. Section "Baru di Sini"
   sebagai section berdiri sendiri juga dibatalkan; info penting untuk tamu baru
   dititipkan ke Pelayanan sebagai pita kecil (Fase 4).
4. **ProCon**: **dibiarkan apa adanya.** Tidak dipindah, tidak diubah gayanya.
   Temuan 36 sampai 38 di Bagian 6 ditutup sebagai keputusan sadar, bukan utang.
5. **Konten existing tidak boleh hilang.** Pelayanan, jadwal, visi, misi, dan
   statement of faith wajib tetap ada. Fase berikutnya hanya boleh mengubah desain
   dan menambah, tidak mengurangi isi.

CTA hero menyesuaikan keputusan 3: **"Datang hari Minggu"** menuju `#pelayanan`
(tempat jadwal lengkap), dan **"Gabung Life Group"** menuju `#gabung-life-group`
(tab yang sudah ada di Contact Us).

---

## Bagian 9 — Yang masih perlu kamu putuskan

1. **Angka bangsa**: situs pakai "80+". everynation.org menyebut 86 per 2026. Pakai
   "80+" yang aman, atau angka pasti setelah dikonfirmasi.
2. **Fakta yang perlu dikonfirmasi sebelum pita tamu baru di Fase 4 dirilis**:
   durasi ibadah, ada atau tidak tim welcome untuk tamu baru, dan nomor unit yang benar
   (A30-32 / B5 / B6).
3. **Persetujuan pastor** untuk judul Siapa Kita "Satu tubuh. Yesus kepalanya." (Fase 3).
4. **Foto**: siapa yang bisa dimintai foto asli, dan kapan realistisnya bisa masuk.
