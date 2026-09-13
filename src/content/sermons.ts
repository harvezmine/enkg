import { parseSermonTitle, sermonDate } from "@/lib/sermons";

import videos from "./youtube-videos.json";

export type Sermon = {
  id: string;
  title: string;
  speaker: string;
  /** yyyy-mm-dd, tanggal ibadah (bukan tanggal unggah) */
  date: string;
  url: string;
  thumbnail: string;
};

/**
 * Koreksi salah ketik pada judul YouTube. Hanya judul yang diubah — nama
 * pembicara dibiarkan apa adanya. Hapus entri bila pengurus tidak setuju.
 */
const TITLE_FIXES: Record<string, string> = {
  ttY_siBhwBA: "Good Friday",
  tGA8SZSgga0: "The Harvest of Redemption",
  VHUN4SEX1eY: "Ketika Tuhan Berkata Sekarang!",
  QDwlMqURNow: "What Happens When We Fail?",
  "89koyzEiS98": "Dimulai dari Hati",
};

/**
 * Snapshot channel YouTube (resources/youtube/videos.json). Untuk memperbarui:
 * salin ulang file itu setelah menjalankan pengumpulan data, lalu tambahkan
 * thumbnail barunya ke public/images/sermons/.
 */
export const sermons: Sermon[] = videos
  .flatMap((video) => {
    const parsed = parseSermonTitle(video.title);
    if (parsed.kind !== "sermon") return [];
    return [
      {
        id: video.id,
        title: TITLE_FIXES[video.id] ?? parsed.title,
        speaker: parsed.speaker,
        date: sermonDate(parsed.day, parsed.month, video.date),
        url: video.url,
        thumbnail: `/images/sermons/${video.id}.jpg`,
      },
    ];
  })
  .sort((a, b) => b.date.localeCompare(a.date));
