export type NewsItem = {
  id: string;
  type: "event" | "kabar" | "artikel";
  title: string;
  /** yyyy-mm-dd */
  date: string;
  summary: string;
  image?: { src: string; alt: string; width: number; height: number };
  href?: string;
};

/**
 * Kabar, event, dan artikel. Tambahkan entri baru di paling atas; urutan tampil
 * tetap diurutkan berdasarkan tanggal. Tipe "artikel" sudah didukung tampilan
 * tetapi belum ada isinya — jangan diisi contoh fiktif.
 */
export const news: NewsItem[] = [
  {
    id: "7-years",
    type: "kabar",
    title: "7 Years, One Faithful God",
    date: "2026-08-30",
    summary:
      "Tujuh tahun Every Nation Kelapa Gading berjalan bersama sejak 2019. Tonton kilas balik perjalanan kami dalam “7 Years of Caleidoscope”.",
    image: {
      src: "/images/sermons/RpeQN5sbQJ4.jpg",
      alt: "Kolase foto jemaat dalam perayaan ulang tahun ke-7 Every Nation Kelapa Gading",
      width: 1280,
      height: 720,
    },
    href: "https://www.youtube.com/watch?v=RpeQN5sbQJ4",
  },
  {
    id: "mothers-day-2026",
    type: "event",
    title: "Mother's Day Celebration",
    date: "2026-05-10",
    summary: "Perayaan Hari Ibu dalam Ibadah Minggu pukul 10.00 WIB di Mahaka Square.",
    image: {
      src: "/images/events/mothers-day-2026.png",
      alt: "Poster Mother's Day Celebration 2026, 10 Mei pukul 10.00 di Mahaka Square",
      width: 1080,
      height: 1080,
    },
  },
];

export const NEWS_LABEL: Record<NewsItem["type"], string> = {
  event: "Event",
  kabar: "Kabar",
  artikel: "Artikel",
};
