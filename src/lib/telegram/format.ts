/*
 * Bagian murni bot Telegram: tipe, escape HTML, perintah, callback_data, dan
 * penyusun pesan. Tidak menyentuh database atau jaringan, jadi bisa dites.
 */

import type { Topic } from "./topics";

export { TOPICS, TOPIC_HINT, TOPIC_LABEL, isTopic, type Topic } from "./topics";

/** Penerima bot (satu orang internal). Nama lama dipertahankan supaya impor lain tetap jalan. */
export type { Recipient as TelegramChat } from "./recipients";

/* ── Teks ─────────────────────────────────────────────────────────────────── */

/** Escape untuk parse_mode HTML Telegram. Semua data jemaat wajib lewat sini. */
export function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Tautan aman: href dan teks sama-sama di-escape. */
export const link = (href: string, text: string) => `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAY_LONG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTHS_LONG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const parts = (ymd: string) => ymd.split("-").map(Number) as [number, number, number];
const weekday = (ymd: string) => {
  const [y, m, d] = parts(ymd);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/** "Sen 30 Nov" */
export function shortDay(ymd: string) {
  const [, m, d] = parts(ymd);
  return `${DAY_SHORT[weekday(ymd)]} ${d} ${MONTHS[m - 1]}`;
}

/** "Jumat, 27 November" */
export function longDay(ymd: string) {
  const [, m, d] = parts(ymd);
  return `${DAY_LONG[weekday(ymd)]}, ${d} ${MONTHS_LONG[m - 1]}`;
}

/** "Hari ini", "Besok", "Sen 30 Nov" */
export function whenLabel(ymd: string, daysUntil: number) {
  if (daysUntil === 0) return "hari ini";
  if (daysUntil === 1) return "besok";
  return shortDay(ymd);
}

/* ── Perintah ─────────────────────────────────────────────────────────────── */

/**
 * "/hubungkan@EnkgBot ABC123" → { command: "hubungkan", args: "ABC123" }.
 * Di grup, Telegram menambahkan "@namabot" di belakang perintah.
 */
export function parseCommand(text: string | undefined | null) {
  const match = /^\/([a-z_]+)(?:@[\w_]+)?(?:\s+([\s\S]*))?$/i.exec((text ?? "").trim());
  if (!match) return null;
  return { command: match[1]!.toLowerCase(), args: (match[2] ?? "").trim() };
}

/* ── callback_data (maks. 64 byte) ────────────────────────────────────────── */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** UUID (36 karakter) → base64url 22 karakter. */
export function packUuid(uuid: string) {
  if (!UUID.test(uuid)) throw new Error("UUID tidak valid");
  return Buffer.from(uuid.replace(/-/g, ""), "hex").toString("base64url");
}

export function unpackUuid(packed: string) {
  if (!/^[A-Za-z0-9_-]{22}$/.test(packed)) return null;
  const hex = Buffer.from(packed, "base64url").toString("hex");
  if (hex.length !== 32) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Orang yang di-assign: jemaat yang sudah ada (p) atau kiriman Contact Us (s). */
export type AssignTarget = { kind: "person" | "submission"; id: string };

/** "a:p<22>:<22>" = 47 karakter, jauh di bawah batas 64 byte. */
export function encodeAssign(target: AssignTarget, groupId: string) {
  return `a:${target.kind === "person" ? "p" : "s"}${packUuid(target.id)}:${packUuid(groupId)}`;
}

export function decodeAssign(data: string | undefined | null) {
  const match = /^a:([ps])([A-Za-z0-9_-]{22}):([A-Za-z0-9_-]{22})$/.exec(data ?? "");
  if (!match) return null;
  const id = unpackUuid(match[2]!);
  const groupId = unpackUuid(match[3]!);
  if (!id || !groupId) return null;
  return { target: { kind: match[1] === "p" ? "person" : "submission", id } as AssignTarget, groupId };
}

/* ── Isi pesan ────────────────────────────────────────────────────────────── */

export type BirthdayEntry = {
  name: string;
  date: string;
  daysUntil: number;
  turning: number;
  /** Tautan wa.me berisi ucapan, kalau ada nomor. */
  greetUrl?: string | null;
};

export type AnniversaryEntry = {
  /** "Budi & Ani" */
  couple: string;
  date: string;
  daysUntil: number;
  years: number;
};

export type ScheduleEntry = {
  /** "HH:MM" */
  start: string;
  title: string;
  place?: string | null;
  href?: string | null;
};

export type NewMemberEntry = {
  name: string;
  phone?: string | null;
  area?: string | null;
  wish?: string | null;
  note?: string | null;
  source: "situs" | "admin";
};

/** Batas daftar per bagian, supaya pesan tidak melewati 4096 karakter Telegram. */
const LIST_LIMIT = 12;

function bullets<T>(items: T[], render: (item: T) => string) {
  const shown = items.slice(0, LIST_LIMIT).map((item) => `• ${render(item)}`);
  if (items.length > LIST_LIMIT) shown.push(`<i>dan ${items.length - LIST_LIMIT} lainnya</i>`);
  return shown.join("\n");
}

const clock = (value: string) => value.slice(0, 5).replace(":", ".");

export function birthdayLines(entries: BirthdayEntry[]) {
  return bullets(entries, (entry) => {
    const text = `${escapeHtml(entry.name)}, ke-${entry.turning} · ${whenLabel(entry.date, entry.daysUntil)}`;
    return entry.greetUrl && entry.daysUntil === 0 ? `${text} · ${link(entry.greetUrl, "kirim ucapan")}` : text;
  });
}

export function anniversaryLines(entries: AnniversaryEntry[]) {
  return bullets(entries, (entry) => `${escapeHtml(entry.couple)}, ${entry.years} tahun · ${whenLabel(entry.date, entry.daysUntil)}`);
}

export function scheduleLines(entries: ScheduleEntry[]) {
  if (!entries.length) return "<i>Tidak ada jadwal.</i>";
  return bullets(entries, (entry) => {
    const title = entry.href ? link(entry.href, entry.title) : escapeHtml(entry.title);
    return `<b>${clock(entry.start)}</b> ${title}${entry.place ? ` · ${escapeHtml(entry.place)}` : ""}`;
  });
}

export type DigestInput = {
  today: string;
  topics: Topic[];
  birthdays: BirthdayEntry[];
  anniversaries: AnniversaryEntry[];
  scheduleToday: ScheduleEntry[];
  scheduleTomorrow: ScheduleEntry[];
  tomorrow: string;
  waitingCount: number;
};

/**
 * Ringkasan harian untuk satu chat, hanya berisi topik yang dia ikuti.
 * Null kalau tidak ada yang perlu dikabarkan hari itu.
 */
export function buildDigest(input: DigestInput) {
  const has = (topic: Topic) => input.topics.includes(topic);
  const sections: string[] = [];

  if (has("ulang_tahun") && input.birthdays.length) {
    const today = input.birthdays.filter((entry) => entry.daysUntil === 0);
    const soon = input.birthdays.filter((entry) => entry.daysUntil > 0);
    if (today.length) sections.push(`🎂 <b>Ulang tahun hari ini</b>\n${birthdayLines(today)}`);
    if (soon.length) sections.push(`🗓 <b>Ulang tahun seminggu ke depan</b>\n${birthdayLines(soon)}`);
  }

  if (has("anniversary") && input.anniversaries.length) {
    sections.push(`💍 <b>Anniversary pernikahan</b>\n${anniversaryLines(input.anniversaries)}`);
  }

  if (has("jadwal") && (input.scheduleToday.length || input.scheduleTomorrow.length)) {
    sections.push(
      `⛪ <b>Jadwal hari ini</b>\n${scheduleLines(input.scheduleToday)}\n\n<b>Besok, ${longDay(input.tomorrow)}</b>\n${scheduleLines(
        input.scheduleTomorrow,
      )}`,
    );
  }

  if (has("jemaat_baru") && input.waitingCount > 0) {
    sections.push(
      `🙋 <b>${input.waitingCount} jemaat baru</b> masih menunggu Life Group. Ketik /jemaatbaru untuk memasukkan mereka ke grup.`,
    );
  }

  if (!sections.length) return null;
  return [`☀️ <b>Selamat pagi! ${longDay(input.today)}</b>`, ...sections].join("\n\n");
}

export function newMemberMessage(entry: NewMemberEntry) {
  const lines = [
    entry.source === "situs" ? "🙋 <b>Jemaat baru daftar lewat situs</b>" : "🙋 <b>Jemaat baru ditambahkan admin</b>",
    "",
    `<b>${escapeHtml(entry.name)}</b>`,
  ];
  if (entry.phone) lines.push(`WA: ${escapeHtml(entry.phone)}`);
  if (entry.area) lines.push(`Domisili: ${escapeHtml(entry.area)}`);
  if (entry.wish) lines.push(`Ingin gabung: ${escapeHtml(entry.wish)}`);
  if (entry.note) lines.push(escapeHtml(entry.note));
  lines.push("", "Pilih Life Group-nya di bawah:");
  return lines.join("\n");
}

export type PrayerEntry = {
  name: string;
  phone?: string | null;
  request: string | null;
  /** Alamat publik halaman Contact Us di admin, kalau situs sudah online (https). */
  adminUrl?: string | null;
};

/** Batas isi permohonan di Telegram; teks lengkapnya tetap ada di admin panel. */
const PRAYER_LIMIT = 3000;

/** Permohonan doa dari situs. Isi permohonan ditulis pengunjung, jadi selalu di-escape. */
export function prayerMessage(entry: PrayerEntry) {
  const request = (entry.request ?? "").trim();
  const shown = request.length > PRAYER_LIMIT ? `${request.slice(0, PRAYER_LIMIT).trimEnd()}…` : request;
  const lines = ["🙏 <b>Permohonan doa baru</b>", "", `<b>${escapeHtml(entry.name)}</b>`];
  if (entry.phone) lines.push(`WA: ${escapeHtml(entry.phone)}`);
  lines.push("", shown ? `<blockquote>${escapeHtml(shown)}</blockquote>` : "<i>Tanpa isi permohonan.</i>");
  lines.push(
    "",
    entry.adminUrl
      ? `Lihat dan tandai di ${link(entry.adminUrl, "admin panel, menu Contact Us")}.`
      : "Lihat dan tandai di admin panel, menu Contact Us (/admin/kontak).",
  );
  return lines.join("\n");
}

export const HELP_TEXT = [
  "<b>Bot internal Every Nation Kelapa Gading</b>",
  "",
  "/ulangtahun · ulang tahun 30 hari ke depan",
  "/anniversary · anniversary pernikahan 30 hari ke depan",
  "/jadwal · jadwal gereja minggu ini",
  "/jemaatbaru · jemaat baru yang belum punya Life Group",
  "/bantuan · daftar perintah",
  "",
  "Setiap pagi bot mengirim ringkasan sesuai pengingat yang dipilih admin untukmu.",
].join("\n");

/** Untuk orang yang belum tersambung: minta nomornya lewat tombol. */
export const WELCOME_TEXT = [
  "Halo! Ini bot internal Every Nation Kelapa Gading.",
  "",
  "Tekan tombol <b>Kirim nomor saya</b> di bawah supaya kami bisa mencocokkan nomormu dengan daftar penerima dari admin gereja.",
].join("\n");

export const UNKNOWN_NUMBER_TEXT = [
  "Maaf, nomor ini belum terdaftar sebagai penerima.",
  "",
  "Minta admin gereja menambahkan nomor Telegram-mu di admin panel (menu Bot Telegram), lalu ketik /start lagi.",
].join("\n");

export const NOT_OWN_CONTACT_TEXT = "Kirim nomormu sendiri lewat tombol <b>Kirim nomor saya</b> ya, bukan kontak orang lain.";

export const PRIVATE_ONLY_TEXT = "Bot ini hanya bisa dipakai lewat chat pribadi. Buka bot-nya langsung, lalu tekan Mulai.";

/** Tombol balasan (reply keyboard) yang meminta nomor Telegram pengguna. */
export const CONTACT_KEYBOARD = {
  keyboard: [[{ text: "📱 Kirim nomor saya", request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
  is_persistent: false,
} as const;

export const REMOVE_KEYBOARD = { remove_keyboard: true } as const;
