import "server-only";

import { addDays } from "@/lib/calendar";
import { todayWib } from "@/lib/people";

import { answerCallback, editMessage, leaveChat, sendMessage } from "./api";
import { publicAdminUrl } from "./config";
import {
  anniversaryEntries,
  birthdayEntries,
  findRecipientByChat,
  findRecipientByDigits,
  linkRecipient,
  scheduleByDay,
  unlinkChat,
  waitingMembers,
} from "./data";
import {
  CONTACT_KEYBOARD,
  HELP_TEXT,
  NOT_OWN_CONTACT_TEXT,
  PRIVATE_ONLY_TEXT,
  REMOVE_KEYBOARD,
  TOPIC_LABEL,
  UNKNOWN_NUMBER_TEXT,
  WELCOME_TEXT,
  anniversaryLines,
  birthdayLines,
  decodeAssign,
  escapeHtml,
  longDay,
  parseCommand,
  scheduleLines,
} from "./format";
import { assignFromTelegram, memberCard } from "./members";
import { canAssign, checkContact, isLinkedRecipient, type Recipient } from "./recipients";

/* ── Bentuk update Telegram yang dipakai (sebagian kecil dari Bot API) ─────── */

type TgUser = { id: number; first_name?: string; last_name?: string; username?: string; is_bot?: boolean };
type TgChat = { id: number; type: string; title?: string; first_name?: string; last_name?: string; username?: string };
type TgContact = { phone_number: string; first_name?: string; user_id?: number };
type TgMessage = { message_id: number; chat: TgChat; from?: TgUser; text?: string; contact?: TgContact };

export type TelegramUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: { id: string; from: TgUser; message?: TgMessage; data?: string };
  my_chat_member?: { chat: TgChat; new_chat_member: { status: string } };
};

const who = (user?: TgUser) =>
  [user?.first_name, user?.last_name].filter(Boolean).join(" ") || (user?.username ? `@${user.username}` : "seseorang");

/** Jemaat yang ditampilkan /jemaatbaru dalam satu kali panggil; sisanya lewat admin panel. */
const MAX_CARDS = 5;
const DATA_COMMANDS = ["ulangtahun", "anniversary", "jadwal", "jemaatbaru"];

export async function handleUpdate(update: TelegramUpdate) {
  if (update.callback_query) return handleCallback(update.callback_query);
  if (update.my_chat_member) return handleMembership(update.my_chat_member);
  if (update.message) return handleMessage(update.message);
}

/* ── Bot dimasukkan ke grup / diblokir ────────────────────────────────────── */

async function handleMembership(change: NonNullable<TelegramUpdate["my_chat_member"]>) {
  const status = change.new_chat_member.status;
  if (change.chat.type !== "private") {
    // Bot ini tidak melayani grup: pamit lalu keluar, tanpa mengirim data apa pun.
    if (["member", "administrator"].includes(status)) {
      await sendMessage(change.chat.id, PRIVATE_ONLY_TEXT);
      await leaveChat(change.chat.id);
    }
    return;
  }
  // Pengguna memblokir bot: berhenti mengirim sampai dia membuka bot lagi.
  if (status === "kicked") await unlinkChat(change.chat.id);
}

/* ── Pesan, kontak & perintah ─────────────────────────────────────────────── */

async function handleMessage(message: TgMessage) {
  const chatId = message.chat.id;

  if (message.chat.type !== "private") {
    // Di grup hanya perintah yang sampai ke bot (privacy mode); balas singkat saja.
    if (parseCommand(message.text)) await sendMessage(chatId, PRIVATE_ONLY_TEXT);
    return;
  }

  if (message.contact) return connect(message);

  const parsed = parseCommand(message.text);
  const recipient = await findRecipientByChat(chatId);
  const linked = isLinkedRecipient(recipient, chatId, message.from?.id) ? recipient! : null;

  if (!linked) {
    // Belum tersambung: apa pun pesannya, minta nomornya lewat tombol. Tidak ada data yang dikirim.
    await sendMessage(chatId, WELCOME_TEXT, CONTACT_KEYBOARD);
    return;
  }

  if (!parsed) return;
  const { command } = parsed;

  if (command === "start" || command === "bantuan" || command === "help") {
    await sendMessage(chatId, HELP_TEXT, REMOVE_KEYBOARD);
    return;
  }
  if (!DATA_COMMANDS.includes(command)) return;

  const now = new Date();
  const today = todayWib(now);

  switch (command) {
    case "ulangtahun": {
      const entries = await birthdayEntries(today, 30);
      await sendMessage(
        chatId,
        entries.length ? `🎂 <b>Ulang tahun 30 hari ke depan</b>\n${birthdayLines(entries)}` : "Tidak ada yang berulang tahun dalam 30 hari ke depan.",
      );
      return;
    }
    case "anniversary": {
      const entries = await anniversaryEntries(today, 30);
      await sendMessage(
        chatId,
        entries.length
          ? `💍 <b>Anniversary pernikahan 30 hari ke depan</b>\n${anniversaryLines(entries)}`
          : "Belum ada anniversary dalam 30 hari ke depan. Tanggal menikah diisi di data keluarga jemaat.",
      );
      return;
    }
    case "jadwal": {
      const { dates, byDay } = await scheduleByDay(now, 7);
      const sections = dates
        .filter((date) => byDay.get(date)!.length)
        .map((date) => `<b>${date === today ? "Hari ini" : date === addDays(today, 1) ? "Besok" : longDay(date)}</b>\n${scheduleLines(byDay.get(date)!)}`);
      await sendMessage(chatId, sections.length ? `⛪ <b>Jadwal 7 hari ke depan</b>\n\n${sections.join("\n\n")}` : "Belum ada jadwal minggu ini.");
      return;
    }
    case "jemaatbaru":
      return listNewMembers(linked);
  }
}

/** Kontak dari tombol "Kirim nomor saya": cocokkan dengan daftar penerima dari admin. */
async function connect(message: TgMessage) {
  const chatId = message.chat.id;
  const check = checkContact({
    chatType: message.chat.type,
    fromId: message.from?.id,
    contactUserId: message.contact?.user_id,
    phoneNumber: message.contact?.phone_number,
  });
  if (!check.ok) {
    await sendMessage(chatId, check.reason === "bukan_milik_sendiri" ? NOT_OWN_CONTACT_TEXT : UNKNOWN_NUMBER_TEXT, CONTACT_KEYBOARD);
    return;
  }

  const recipient = await findRecipientByDigits(check.digits);
  if (!recipient?.is_active) {
    await sendMessage(chatId, UNKNOWN_NUMBER_TEXT, REMOVE_KEYBOARD);
    return;
  }

  await linkRecipient(recipient.id, { chatId, userId: message.from!.id, by: who(message.from) });
  const topics = recipient.topics.map((topic) => `• ${TOPIC_LABEL[topic]}`).join("\n");
  await sendMessage(
    chatId,
    [
      `✅ <b>Halo${recipient.name ? ` ${escapeHtml(recipient.name)}` : ""}, kamu sudah tersambung!</b>`,
      "",
      topics ? `Kamu akan menerima:\n${topics}` : "Admin belum memilih pengingat untukmu.",
      "",
      "Ringkasan dikirim tiap pagi. Ketik /bantuan untuk daftar perintah.",
    ].join("\n"),
    REMOVE_KEYBOARD,
  );
}

async function listNewMembers(recipient: Recipient) {
  const chatId = recipient.chat_id!;
  if (!recipient.topics.includes("jemaat_baru")) {
    await sendMessage(chatId, "Kamu tidak mengikuti pengingat Jemaat baru. Minta admin menyalakannya di admin panel.");
    return;
  }

  const waiting = await waitingMembers();
  if (!waiting.total) {
    await sendMessage(chatId, "🙌 Semua jemaat baru sudah punya Life Group.");
    return;
  }

  await sendMessage(chatId, `🙋 <b>${waiting.total} jemaat baru</b> menunggu Life Group. Pilih grupnya di tiap kartu.`);

  const targets = [
    ...waiting.people.map((p) => ({ kind: "person" as const, id: p.id, source: (p.submission_id ? "situs" : "admin") as "situs" | "admin" })),
    ...waiting.submissions.map((s) => ({ kind: "submission" as const, id: s.id, source: "situs" as const })),
  ];
  for (const target of targets.slice(0, MAX_CARDS)) {
    const card = await memberCard({ kind: target.kind, id: target.id }, target.source);
    if (card) await sendMessage(chatId, card.html, card.keyboard);
  }

  if (targets.length > MAX_CARDS) {
    const url = publicAdminUrl("/admin/life-group");
    await sendMessage(
      chatId,
      `Dan ${targets.length - MAX_CARDS} lagi. ${url ? `<a href="${escapeHtml(url)}">Buka antrean di admin panel</a>` : "Lihat antrean di admin panel"}.`,
    );
  }
}

/* ── Tombol assign ────────────────────────────────────────────────────────── */

export async function handleCallback(query: NonNullable<TelegramUpdate["callback_query"]>) {
  const message = query.message;
  const decoded = decodeAssign(query.data);
  if (!message || !decoded) {
    await answerCallback(query.id, "Tombol ini sudah tidak berlaku.");
    return;
  }

  // Hanya penerima tersambung yang mengikuti jemaat baru, dan hanya oleh orangnya sendiri.
  const recipient = await findRecipientByChat(message.chat.id);
  if (!canAssign(recipient, message.chat.id, query.from?.id)) {
    await answerCallback(query.id, "Kamu tidak punya akses untuk memasukkan jemaat ke Life Group.", true);
    return;
  }

  const result = await assignFromTelegram(decoded.target, decoded.groupId, recipient!.name || who(query.from));
  if (result.html) await editMessage(message.chat.id, message.message_id, result.html, result.keyboard);
  await answerCallback(query.id, result.toast);
}
