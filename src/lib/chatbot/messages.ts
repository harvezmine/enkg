import { site } from "@/content/site";

import { WHATSAPP_URL, type ChatKnowledge } from "./knowledge";

/* Validasi percakapan, deteksi krisis, dan jawaban cadangan tanpa AI. Murni, dites. */

export const MAX_MESSAGES = 12;
export const MAX_CHARS = 600;

export type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Isi body dari browser → percakapan yang aman dikirim ke model. Hanya peran
 * user/assistant (prompt sistem selalu dari server), maksimal 12 pesan
 * terakhir, tiap pesan maksimal 600 karakter, pesan terakhir harus dari pengunjung.
 */
export function parseConversation(body: unknown): { ok: true; messages: ChatMessage[] } | { ok: false; error: string } {
  const list = body && typeof body === "object" ? (body as { messages?: unknown }).messages : null;
  if (!Array.isArray(list) || !list.length) return { ok: false, error: "Pesan kosong." };

  const messages: ChatMessage[] = [];
  for (const item of list.slice(-MAX_MESSAGES)) {
    if (!item || typeof item !== "object") return { ok: false, error: "Format pesan tidak dikenal." };
    const { role, content } = item as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return { ok: false, error: "Format pesan tidak dikenal." };
    if (typeof content !== "string") return { ok: false, error: "Format pesan tidak dikenal." };
    const text = content.trim();
    if (!text) continue;
    if (text.length > MAX_CHARS) return { ok: false, error: `Pesan terlalu panjang (maksimal ${MAX_CHARS} karakter).` };
    messages.push({ role, content: text });
  }
  if (!messages.length || messages.at(-1)!.role !== "user") return { ok: false, error: "Pesan kosong." };
  return { ok: true, messages };
}

const fold = (text: string) =>
  text
    .toLocaleLowerCase("id")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const CRISIS =
  /\b(bunuh diri|mau mati|ingin mati|pengen mati|pingin mati|akhiri hidup|mengakhiri hidup|akhiri semuanya|menyakiti diri|melukai diri|self ?harm|suicid\w*|kill myself|end my life|gak mau hidup|nggak mau hidup|tidak mau hidup lagi|capek hidup)\b/;

export function isCrisis(text: string) {
  return CRISIS.test(fold(text));
}

/** Jawaban tetap untuk tanda krisis, tidak lewat AI supaya selalu sama dan benar. */
export const CRISIS_REPLY = [
  "Terima kasih sudah cerita. Kedengarannya berat sekali, dan kamu tidak harus menanggungnya sendirian.",
  "",
  "Kalau kamu sedang terpikir menyakiti diri, tolong hubungi orang sekarang juga:",
  "- **119 ext 8** (SEJIWA, layanan konseling Kemenkes)",
  "- **healing119.id** untuk bantuan krisis psikologis",
  "- **119** kalau nyawa sedang terancam",
  "",
  `Tim kami juga mau menemani dan mendoakan kamu. [hubungi kami lewat WhatsApp](${WHATSAPP_URL})`,
].join("\n");

/** Pilihan cepat di jendela chat. `prompt` yang dikirim sebagai pesan pengunjung. */
export const QUICK_REPLIES = [
  { id: "jadwal", label: "Jadwal ibadah", prompt: "Jadwal ibadah minggu ini kapan aja?" },
  { id: "lifegroup", label: "Gabung Life Group", prompt: "Aku mau gabung Life Group, caranya gimana?" },
  { id: "doa", label: "Minta didoakan", prompt: "Aku mau minta didoakan." },
  { id: "lokasi", label: "Lokasi", prompt: "Gerejanya di mana?" },
  { id: "anak", label: "Ibadah anak", prompt: "Ada ibadah untuk anak? Jam berapa?" },
  { id: "pertama", label: "Pertama kali datang", prompt: "Aku mau datang pertama kali hari Minggu. Apa yang perlu aku tahu?" },
] as const;

const has = (text: string, words: RegExp) => words.test(fold(text));

/**
 * Jawaban tanpa AI (kunci API kosong atau layanan AI sedang gagal): cocokkan
 * kata kunci ke informasi publik yang sama. Selalu ada jalan ke WhatsApp.
 */
export function fallbackReply(question: string, k: ChatKnowledge): string {
  if (isCrisis(question)) return CRISIS_REPLY;
  const a = site.address;

  if (has(question, /\b(lokasi|alamat|dimana|di mana|parkir|maps?|peta|arah|letak)\b/)) {
    return [
      `Kami ibadah di **${a.venue}**, ${a.building}, ${a.street}, ${a.city}.`,
      `[Buka peta](${site.maps.link})`,
    ].join("\n");
  }

  if (has(question, /\b(doa|didoakan|berdoa|prayer|pokok doa)\b/)) {
    const prayer = k.schedule.filter((item) => /doa|prayer/i.test(item.title));
    return [
      "Tim doa kami siap mendoakan kamu. Tulis permohonanmu di [form permohonan doa](#permohonan-doa), atau langsung [chat WhatsApp tim](" + WHATSAPP_URL + ").",
      ...(prayer.length
        ? ["", "Doa bersama:", ...prayer.map((item) => `- ${item.title}: ${item.when}, ${item.start} WIB${item.place ? ` (${item.place})` : ""}`)]
        : []),
    ].join("\n");
  }

  if (has(question, /\b(life ?group|lg|komsel|kelompok kecil|kelompok sel|persekutuan)\b/)) {
    return [
      "Life Group itu kelompok kecil yang bertemu rutin di luar ibadah: Family, Young Professional, dan Youth.",
      ...(k.lifeGroups.length
        ? ["", ...k.lifeGroups.slice(0, 6).map((g) => `- ${g.name}: ${g.routine}${g.area ? `, ${g.area}` : ""}`)]
        : []),
      "",
      "Daftar lewat [form gabung Life Group](#gabung-life-group), nanti tim yang menghubungkan kamu.",
    ].join("\n");
  }

  if (has(question, /\b(kids|anak|sekolah minggu|heritage|remaja|teens?)\b/)) {
    const kids = k.schedule.filter((item) => /kids|heritage/i.test(item.title));
    return [
      ...kids.map((item) => `- **${item.title}**: ${item.when}, ${item.start} WIB${item.place ? ` di ${item.place}` : ""}`),
      "Heritage untuk usia 12 sampai 17 tahun. [Lihat Pelayanan](#pelayanan)",
    ].join("\n");
  }

  if (has(question, /\b(persembahan|perpuluhan|give|giving|rekening|transfer|donasi|qris|bank)\b/)) {
    const accounts = site.give.accounts as readonly { label: string; number: string }[];
    return accounts.length
      ? [
          `Persembahan bisa ditransfer ke ${site.give.bank} a.n. **${site.give.accountName}**:`,
          ...accounts.map((account) => `- ${account.label}: ${account.number}`),
          "Atau scan QRIS di [bagian Give](#give).",
        ].join("\n")
      : `Info rekening bisa ditanyakan langsung ke tim. [hubungi kami lewat WhatsApp](${WHATSAPP_URL})`;
  }

  if (has(question, /\b(procon|kelas|seminar|workshop|pelatihan)\b/)) {
    return [
      "ProCon itu kelas dan diskusi pengembangan diri untuk pelajar, mahasiswa, dan profesional.",
      ...k.procon.slice(0, 4).map((event) => `- ${event.title}: ${event.when}`),
      "[Lihat ProCon](#procon)",
    ].join("\n");
  }

  if (has(question, /\b(zoom|online|daring)\b/)) {
    const online = k.schedule.filter((item) => item.online);
    return online.length
      ? online.map((item) => `- **${item.title}**: ${item.when}, ${item.start} WIB${item.link ? `. [Buka Zoom](${item.link})` : ""}${item.note ? ` (${item.note})` : ""}`).join("\n")
      : `Untuk ibadah online, tanya tim dulu ya. [hubungi kami lewat WhatsApp](${WHATSAPP_URL})`;
  }

  if (has(question, /\b(jadwal|ibadah|minggu|jam|kebaktian|service|kapan|acara|event)\b/)) {
    return [
      "Jadwal rutin kami:",
      ...k.schedule.slice(0, 8).map((item) => `- **${item.title}**: ${item.when}, ${item.start} WIB${item.place ? ` (${item.place})` : ""}`),
      "",
      "Jadwal lengkap dan acara lain ada di [kalender](#kalender).",
    ].join("\n");
  }

  return `Untuk pertanyaan ini, tim kami lebih tepat menjawabnya. [hubungi kami lewat WhatsApp](${WHATSAPP_URL}) ya.`;
}
