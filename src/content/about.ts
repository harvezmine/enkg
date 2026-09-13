/**
 * Siapa Kita: cerita, visi, misi, nilai, dan pernyataan iman.
 * Sumber: deskripsi channel YouTube ENKG dan everynation.org (/mission, /what-we-believe).
 * Terjemahan nilai & pernyataan iman perlu ditinjau pastor sebelum rilis.
 */

export const story = {
  title: "Keluarga yang bertumbuh bersama sejak 2019.",
  body: [
    "Every Nation Kelapa Gading adalah gereja lokal yang beribadah di Mahaka Square, Kelapa Gading, Jakarta Utara. Kami bagian dari Every Nation, keluarga gereja dan pelayanan kampus di lebih dari 80 bangsa.",
    "Tujuh tahun berjalan, kami terus beribadah, berdoa, dan bertumbuh bersama lewat Life Group, dari keluarga dan profesional muda sampai anak-anak dan remaja.",
  ],
} as const;

export const stats = [
  { value: "2019", label: "Awal perjalanan ENKG" },
  { value: "7", label: "Tahun berjalan bersama" },
  { value: "80+", label: "Bangsa dalam keluarga Every Nation" },
  { value: "3", label: "Life Group: Family, Young Professional, Youth" },
] as const;

export const pastor = {
  name: "Ps. Raswan Gautama",
  partner: "Ibu Sharon Gautama",
  role: "Gembala Every Nation Kelapa Gading",
  photo: { src: "/images/photos/pastor-raswan.jpg", width: 470, height: 490 },
} as const;

/** Visi: tagline Every Nation & fokus pelayanannya (everynation.org/mission). */
export const vision = {
  tagline: "Honor God. Make Disciples.",
  taglineId: "Menghormati Tuhan dan menjadikan murid.",
  focus: [
    { title: "Gereja lokal", body: "Membangun gereja yang menjangkau generasi berikutnya." },
    { title: "Pelayanan kampus", body: "Menjangkau pelajar dan mahasiswa, masa ketika iman seseorang terbentuk." },
    { title: "Bangsa-bangsa", body: "Bagian dari gerakan di lebih dari 80 bangsa." },
  ],
} as const;

export const mission = {
  id: "Kami ada untuk menghormati Tuhan dengan mendirikan gereja dan pelayanan kampus yang berpusat pada Kristus, diberdayakan oleh Roh, dan bertanggung jawab secara sosial di setiap bangsa.",
  en: "We exist to honor God by establishing Christ-centered, Spirit-empowered, socially responsible churches and campus ministries in every nation.",
} as const;

export const values = [
  {
    name: "Lordship",
    title: "Ketuhanan Kristus",
    body: "Penyerahan sepenuh hati kepada kehendak Tuhan dan firman-Nya adalah titik awal iman dan dasar seluruh pertumbuhan rohani.",
    verse: "Kolose 2:6",
  },
  {
    name: "Evangelism",
    title: "Penginjilan",
    body: "Kami bersemangat memberitakan Injil dan melayani dengan cara yang menjangkau mereka yang belum mengenal Kristus.",
    verse: "Yohanes 3:16 · Lukas 19:10",
  },
  {
    name: "Discipleship",
    title: "Pemuridan",
    body: "Meletakkan dasar firman, memperlengkapi orang percaya untuk melayani, dan memberdayakan murid untuk memuridkan.",
    verse: "Matius 28:19-20",
  },
  {
    name: "Leadership",
    title: "Kepemimpinan",
    body: "Membuka kesempatan dan wadah untuk membangun generasi pemimpin berikutnya.",
    verse: "2 Timotius 2:2",
  },
  {
    name: "Family",
    title: "Keluarga",
    body: "Kami tidak mengorbankan pernikahan dan anak-anak demi pelayanan, dan hidup sebagai keluarga rohani yang bersatu.",
    verse: "Mazmur 127:1-3",
  },
] as const;

/** Ringkasan 12 pokok Statement of Faith Every Nation. */
export const beliefs = [
  { title: "Allah Tritunggal", body: "Satu Allah, Pencipta dan Pemelihara segala sesuatu, yang kekal dalam tiga pribadi, yaitu Bapa, Anak, dan Roh Kudus, dalam satu hakikat dengan peran yang berbeda." },
  { title: "Alkitab", body: "Keenam puluh enam kitab Perjanjian Lama dan Baru adalah satu-satunya firman Allah tertulis yang diilhamkan, berotoritas, dan tanpa salah." },
  { title: "Penciptaan & kejatuhan", body: "Allah menciptakan segala sesuatu baik dan manusia menurut gambar-Nya. Dosa Adam memisahkan manusia dari Allah dan membawa maut." },
  { title: "Yesus Kristus", body: "Anak Allah yang kekal menjadi manusia untuk menebus kita: hidup tanpa dosa, mati sebagai korban, bangkit secara tubuh, dan akan datang kembali." },
  { title: "Injil", body: "Melalui hidup, kematian, dan kebangkitan Kristus, Allah memperdamaikan manusia dengan diri-Nya bagi setiap orang yang bertobat dan percaya." },
  { title: "Keselamatan", body: "Oleh anugerah melalui iman kepada karya Kristus, Allah membenarkan kita dan mengangkat kita menjadi anak-anak-Nya." },
  { title: "Roh Kudus", body: "Roh Kudus menginsafkan akan dosa, melahirbarukan, dan memperlengkapi orang percaya untuk bersaksi dan melayani melalui karunia dan buah Roh." },
  { title: "Misi", body: "Allah menebus umat bagi diri-Nya dari setiap suku, bangsa, dan bahasa, dan mengutus Gereja memberitakan Injil serta menjadikan murid." },
  { title: "Gereja", body: "Gereja adalah tubuh Kristus dengan Yesus sebagai kepala, berkumpul untuk beribadah, berdoa, menerima sakramen, dan bersekutu." },
  { title: "Sakramen", body: "Baptisan air dan Perjamuan Kudus adalah tanda anugerah perjanjian Allah: masuk ke dalam Gereja dan mengingat pengorbanan Kristus." },
  { title: "Pengudusan", body: "Sejak lahir baru, Allah membentuk kita serupa Kristus melalui firman dan Roh-Nya, sehingga kita bertumbuh dalam kekudusan." },
  { title: "Kedatangan Kristus", body: "Kristus akan datang kembali secara tubuh dengan kuasa dan kemuliaan untuk membangkitkan orang mati dan menghakimi dunia." },
] as const;

export const creeds = "Kami juga memegang Pengakuan Iman Rasuli, Pengakuan Iman Nicea, dan Pengakuan Iman Kalsedon.";
export const beliefsSource = "https://www.everynation.org/what-we-believe/";
