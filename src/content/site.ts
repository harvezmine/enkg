/**
 * Identitas & data statis gereja. Semua nilai di sini berasal dari Linktree,
 * poster Canva, channel YouTube, dan everynation.org (lihat resources/README.md).
 */
import { whatsappLink } from "@/lib/whatsapp";

export const site = {
  name: "Every Nation Kelapa Gading",
  shortName: "ENKG",
  foundedYear: 2019,
  tagline: "Honor God. Make Disciples.",
  taglineId: "Menghormati Tuhan. Menjadikan murid.",
  /** Judul hero. Dirender tiga baris di sections/hero.tsx, baris terakhir serif italic. */
  headline: "Satu gereja, satu keluarga dari setiap bangsa.",
  description:
    "Gereja Every Nation di Mahaka Square, Kelapa Gading, Jakarta Utara. Ibadah Minggu pukul 10.00 WIB, Kids Church, Life Group, dan persekutuan doa.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "en.kelapagading@gmail.com",
  whatsapp: { number: "6285175436935", display: "+62 851-7543-6935" },
  /** Sinode yang menaungi ENKG. "MSI" pada nama rekening = Morning Star Indonesia. */
  synod: "Gereja Morning Star Indonesia",
  address: {
    venue: "Stream Hall",
    building: "Mahaka Square Lt. 2, Unit A30-32",
    street: "Jl. Raya Kelapa Nias No. 6, Kelapa Gading Barat",
    city: "Jakarta Utara 14240",
    kidsRoom: "Lt. 2 Unit B6",
    /** Ruang kantor, persis di samping Stream Hall. Dipakai juga untuk Heritage. */
    office: "Lt. 2 Room B5",
    officeNote: "samping Stream Hall",
  },
  geo: { lat: -6.1501502, lng: 106.9032929 },
  maps: {
    link: "https://maps.app.goo.gl/jR4YvSiyA6MhkBfT7",
    // Format "Share → Embed a map" tanpa API key. Feature ID 0x2e69…:0x304a… diturunkan
    // dari Place ID ChIJk0Xs8vT1aS4RVDSk3TlMSjA, jadi pin menunjuk tepat ke tempatnya.
    embed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d991.7!2d106.9032929!3d-6.1501502!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5f4f2ec4593%3A0x304a4c39dda43454!2sEvery%20Nation%20Kelapa%20Gading!5e0!3m2!1sid!2sid!4v1757740000000!5m2!1sid!2sid",
  },
  socials: {
    instagram: "https://www.instagram.com/everynationkelapagading/",
    facebook: "https://www.facebook.com/everynationkelapagading",
    youtube: "https://www.youtube.com/@everynationkelapagading9251",
  },
  youtube: {
    // Playlist "uploads" channel — selalu memutar video terbaru tanpa API key.
    latestEmbed: "https://www.youtube-nocookie.com/embed/videoseries?list=UUWjiAAikHaMFpJecqw8Idwg",
  },
  zoom: {
    url: "https://us02web.zoom.us/j/85432760648?pwd=ODhYcTZmeE9zTGE0M1pEUWIvaXZodz09",
    meetingId: "854 3276 0648",
    passcode: "prayer",
  },
  /**
   * Rekening persembahan. Nomor disimpan tanpa spasi; sections/give.tsx yang
   * merapikannya jadi 7660 400 189. Selama `accounts` kosong, section Give
   * menampilkan ajakan menghubungi WhatsApp.
   */
  give: {
    accountName: "Gereja MSI Kelapa Gading",
    bank: "BCA",
    accounts: [
      { id: "perpuluhan", label: "Perpuluhan & persembahan", number: "7660400189" },
      { id: "gedung", label: "Gedung", number: "7660481189" },
    ],
    qris: { src: "/qris.png", width: 870, height: 1306 },
  },
} as const;

export const navigation = [
  { href: "#siapa-kita", label: "Siapa Kita" },
  { href: "#life-group", label: "Life Group" },
  { href: "#pelayanan", label: "Pelayanan" },
  { href: "#news", label: "News" },
  { href: "#procon", label: "ProCon" },
  { href: "#kontak", label: "Contact Us" },
  { href: "#give", label: "Give" },
] as const;

export const whatsappMessages = {
  contact: "Halo Every Nation Kelapa Gading, saya ingin bertanya.",
  kids: "Halo Every Nation Kelapa Gading, saya ingin bertanya tentang Kids Church.",
  heritage: "Halo Every Nation Kelapa Gading, saya ingin bertanya tentang Heritage.",
  procon: "Halo Every Nation Kelapa Gading, saya tertarik dengan kelas ProCon. Boleh minta info jadwalnya?",
  give: "Halo Every Nation Kelapa Gading, saya ingin memberi persembahan. Boleh minta info rekening gereja?",
  general: "Halo Every Nation Kelapa Gading, ",
} as const;

export const whatsappUrl = (message?: string) => whatsappLink(site.whatsapp.number, message);
