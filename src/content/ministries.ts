import { site, whatsappMessages, whatsappUrl } from "./site";

export type Ministry = {
  id: string;
  name: string;
  meta: string;
  summary: string;
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
    cta: { label: "Petunjuk arah", href: site.maps.link },
  },
  {
    id: "kids-church",
    name: "Kids Church",
    meta: "Minggu · 10.30 WIB",
    summary: "Ibadah anak setiap Minggu di Lt. 2 Unit B6, Mahaka Square.",
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
    meta: "Family · Young Professional · Youth",
    summary:
      "Kenali firman, berbagi cerita, dan saling menguatkan dalam kelompok kecil yang sesuai dengan tahap hidupmu.",
    image: {
      src: "/images/ministries/life-group.png",
      alt: "Jemaat Life Group makan bersama, tempat untuk bertumbuh, terhubung, dan berjalan bersama dalam iman",
      width: 1080,
      height: 656,
    },
    cta: { label: "Gabung Life Group", href: "#gabung-life-group" },
  },
  {
    id: "prayer",
    name: "Prayer Meeting",
    meta: "Rabu 20.00 via Zoom · Jumat ke-4 onsite",
    summary:
      "Mari berdoa bersama secara online dan di Stream Hall. Tim pastoral kami juga siap mendoakan permohonanmu.",
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
    cta: { label: "Gabung Youth", href: "#gabung-youth" },
  },
];
