import { phoneDigits } from "@/lib/people";

import type { Topic } from "./topics";

/*
 * Aturan murni siapa yang boleh tersambung dan memakai bot. Tidak menyentuh
 * database atau jaringan, jadi bisa dites. Penerima adalah satu orang
 * internal; hanya chat pribadi yang bisa tersambung.
 */

export type Recipient = {
  id: string;
  name: string | null;
  phone: string | null;
  phone_digits: string;
  chat_id: number | null;
  telegram_user_id: number | null;
  linked_at: string | null;
  title: string | null;
  chat_type: string | null;
  topics: Topic[];
  is_active: boolean;
  last_digest_on: string | null;
  linked_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Nomor Telegram yang dimasukkan admin → digit pembanding, atau null kalau belum lengkap. */
export function recipientDigits(phone: string) {
  const digits = phoneDigits(phone);
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

export type ContactCheck =
  | { ok: true; digits: string }
  | { ok: false; reason: "bukan_pribadi" | "bukan_milik_sendiri" | "nomor_tidak_valid" };

/**
 * Kontak yang dikirim lewat tombol "Kirim nomor saya". Hanya sah di chat
 * pribadi dan hanya untuk nomor milik pengirimnya sendiri: kontak orang lain
 * yang diteruskan (user_id berbeda atau kosong) ditolak.
 */
export function checkContact(input: {
  chatType: string;
  fromId: number | undefined;
  contactUserId: number | undefined;
  phoneNumber: string | undefined;
}): ContactCheck {
  if (input.chatType !== "private") return { ok: false, reason: "bukan_pribadi" };
  if (!input.fromId || input.contactUserId !== input.fromId) return { ok: false, reason: "bukan_milik_sendiri" };
  const digits = recipientDigits(input.phoneNumber ?? "");
  return digits ? { ok: true, digits } : { ok: false, reason: "nomor_tidak_valid" };
}

/** Penerima yang tersambung dan aktif, dan chat ini memang miliknya. */
export function isLinkedRecipient(recipient: Recipient | null | undefined, chatId: number, fromId: number | undefined) {
  return Boolean(
    recipient &&
      recipient.is_active &&
      recipient.chat_type === "private" &&
      recipient.chat_id === chatId &&
      recipient.telegram_user_id !== null &&
      recipient.telegram_user_id === fromId,
  );
}

/** Tombol assign Life Group: penerima tersambung yang mengikuti pengingat jemaat baru, ditekan oleh orangnya sendiri. */
export function canAssign(recipient: Recipient | null | undefined, chatId: number, fromId: number | undefined) {
  return isLinkedRecipient(recipient, chatId, fromId) && recipient!.topics.includes("jemaat_baru");
}

export type RecipientStatus = "tersambung" | "menunggu" | "nonaktif";

export function recipientStatus(recipient: Pick<Recipient, "is_active" | "chat_id" | "telegram_user_id">): RecipientStatus {
  if (!recipient.is_active) return "nonaktif";
  return recipient.chat_id !== null && recipient.telegram_user_id !== null ? "tersambung" : "menunggu";
}
