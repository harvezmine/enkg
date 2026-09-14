import { site, whatsappMessages, whatsappUrl } from "./site";

export type Ministry = {
  id: string;
  name: string;
  meta: string;
  summary: string;
  /**
   * Panel tipografi di kepala kartu: sepotong informasi nyata yang ditampilkan
   * besar. `lines` untuk daftar, `figure` + `unit` untuk jam, `verse` untuk ayat.
   */
  panel:
    | { kind: "time"; figure: string; unit: string; note?: string }
    | { kind: "list"; lines: readonly string[] }
    | { kind: "verse"; text: string; source: string };
  /** Foto asli dari tim media nanti masuk di sini, menggantikan panel. */
  image?: { src: string; alt: string; width: number; height: number };
  cta: { label: string; href: string };
};

/**
 * Anchor seperti #gabung-life-group ditangkap oleh form Terhubung untuk
 * membuka tab yang sesuai (lihat components/connect-form.tsx).
 */
export const ministries: Ministry[] = [
  {
    id: "sunday-service",
    name: "Sunday Service",
    meta: "Minggu · 10.00 WIB",
    summary: "Ibadah raya setiap Minggu di Stream Hall, Mahaka Square. Sebelumnya kami berdoa bersama pukul 09.15 WIB.",
    panel: { kind: "time", figure: "10.00", unit: "WIB", note: "Doa bersama 09.15" },
    cta: { label: "Petunjuk arah", href: site.maps.link },
  },
  {
    id: "kids-church",
    name: "Kids Church",
    meta: "Minggu · 10.30 WIB",
    summary: "Ibadah anak setiap Minggu di Lt. 2 Unit B6, Mahaka Square.",
    panel: { kind: "time", figure: "10.30", unit: "WIB", note: "Lt. 2 Unit B6" },
    image: {
      src: "/images/ministries/kids-church.png",
      alt: "Kids Church setiap Minggu pukul 10.30, Lt. 2 Unit B6 Mahaka Square",
      width: 1080,
      height: 510,
    },
    cta: {
      label: "Tanya lewat WhatsApp",
      href: whatsappUrl(whatsappMessages.kids),
    },
  },
  {
    id: "life-group",
    name: "Life Group",
    meta: "Kelompok kecil di luar ibadah",
    summary:
      "Kenali firman, berbagi cerita, dan saling menguatkan dalam kelompok kecil yang sesuai dengan tahap hidupmu.",
    panel: { kind: "list", lines: ["Family", "Young Professional", "Youth"] },
    image: {
      src: "/images/ministries/life-group.png",
      alt: "Jemaat Life Group makan bersama, tempat untuk bertumbuh, terhubung, dan berjalan bersama dalam iman",
      width: 1080,
      height: 656,
    },
    cta: { label: "Lihat Life Group", href: "#life-group" },
  },
  {
    id: "prayer",
    name: "Prayer Meeting",
    meta: "Rabu 20.00 via Zoom · Jumat ke-4 onsite",
    summary:
      "Mari berdoa bersama secara online dan di Stream Hall. Tim pastoral kami juga siap mendoakan permohonanmu.",
    // Ayat yang dipakai gereja sendiri di form Permohonan Doa.
    panel: {
      kind: "verse",
      text: "Doa orang yang benar, bila dengan yakin didoakan, sangat besar kuasanya.",
      source: "Yakobus 5:16",
    },
    image: {
      src: "/images/ministries/prayer-request.png",
      alt: "Kirim jawaban doa dan permohonan doa. Tim pastoral kami akan setia mendoakan",
      width: 1080,
      height: 606,
    },
    cta: { label: "Kirim permohonan doa", href: "#permohonan-doa" },
  },
  {
    id: "youth",
    name: "Youth",
    meta: "Life Group Youth",
    summary: "Bertumbuh bersama sesama anak muda: belajar firman, bersahabat, dan melayani lewat Life Group Youth.",
    panel: { kind: "list", lines: ["Pelajar", "Mahasiswa"] },
    cta: { label: "Gabung Youth", href: "#gabung-youth" },
  },
];
