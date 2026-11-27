"use server";

import { revalidatePath } from "next/cache";

import { adminDb } from "@/lib/admin-auth";
import { text } from "@/lib/form-data";
import { callTelegram, sendMessage } from "@/lib/telegram/api";
import { telegramConfig } from "@/lib/telegram/config";
import { CHATS_TABLE } from "@/lib/telegram/data";
import { sendDailyDigests } from "@/lib/telegram/digest";
import { TOPICS, isTopic } from "@/lib/telegram/format";
import { recipientDigits, recipientStatus, type Recipient } from "@/lib/telegram/recipients";

import type { ActionState } from "./admin";

/*
 * Aksi admin untuk bot Telegram. Semuanya lewat adminDb(): tanpa sesi admin
 * yang sah, permintaan dialihkan ke halaman login sebelum menyentuh apa pun.
 */

const COMMANDS = [
  { command: "ulangtahun", description: "Ulang tahun 30 hari ke depan" },
  { command: "anniversary", description: "Anniversary pernikahan 30 hari ke depan" },
  { command: "jadwal", description: "Jadwal gereja minggu ini" },
  { command: "jemaatbaru", description: "Jemaat baru yang belum punya Life Group" },
  { command: "bantuan", description: "Daftar perintah" },
];

const refresh = () => revalidatePath("/admin/telegram");

/** Daftarkan alamat situs ke Telegram supaya bot bisa menerima dan membalas pesan (webhook). */
export async function connectBot(_prev: ActionState): Promise<ActionState> {
  await adminDb();
  const config = telegramConfig();
  if (!config) return { status: "error", message: "Kunci bot belum diisi di server. Minta pengelola server mengisi pengaturan bot Telegram." };
  if (!/^https:\/\//.test(config.siteUrl) || /localhost|127\.0\.0\.1/.test(config.siteUrl)) {
    return { status: "error", message: "Bot baru bisa disambungkan setelah situs online dengan alamat https." };
  }

  const result = await callTelegram("setWebhook", {
    url: `${config.siteUrl}/api/telegram/webhook`,
    secret_token: config.webhookSecret,
    allowed_updates: ["message", "callback_query", "my_chat_member"],
  });
  if (!result.ok) return { status: "error", message: `Telegram menolak: ${result.description}` };

  // Menu perintah di aplikasi Telegram, hanya di chat pribadi. Kalau gagal, bot tetap tersambung.
  await callTelegram("setMyCommands", { commands: COMMANDS, scope: { type: "all_private_chats" } });
  refresh();
  return { status: "success", message: "Bot tersambung. Sekarang bot bisa menerima dan membalas pesan." };
}

const orderedTopics = (values: string[]) => TOPICS.filter((topic) => values.includes(topic));

export async function addRecipient(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await adminDb();
  const name = text(fd, "name", 80).replace(/\s+/g, " ");
  const phone = text(fd, "phone", 40);
  const digits = recipientDigits(phone);
  const topics = orderedTopics(fd.getAll("topics").map(String).filter(isTopic));

  if (name.length < 2) return { status: "error", message: "Isi nama penerima." };
  if (!digits) return { status: "error", message: "Nomor Telegram belum lengkap. Tulis seperti 0812 3456 7890." };
  if (!topics.length) return { status: "error", message: "Pilih minimal satu pengingat." };

  const { error } = await supabase.from(CHATS_TABLE).insert({ name, phone, phone_digits: digits, topics, is_active: true });
  if (error) {
    console.error("[telegram] addRecipient:", error.message);
    return {
      status: "error",
      message: error.code === "23505" ? "Nomor ini sudah ada di daftar penerima." : "Gagal menyimpan. Pastikan schema.sql terbaru sudah dijalankan.",
    };
  }
  refresh();
  return { status: "success", message: `${name} ditambahkan. Kirim petunjuknya supaya dia membuka bot.` };
}

export async function updateChatTopics(fd: FormData) {
  const supabase = await adminDb();
  const topics = orderedTopics(fd.getAll("topics").map(String).filter(isTopic));
  await supabase.from(CHATS_TABLE).update({ topics }).eq("id", text(fd, "id", 60));
  refresh();
}

export async function setChatActive(fd: FormData) {
  const supabase = await adminDb();
  await supabase.from(CHATS_TABLE).update({ is_active: text(fd, "active", 5) === "true" }).eq("id", text(fd, "id", 60));
  refresh();
}

export async function removeChat(fd: FormData) {
  const supabase = await adminDb();
  await supabase.from(CHATS_TABLE).delete().eq("id", text(fd, "id", 60));
  refresh();
}

export async function sendTestMessage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await adminDb();
  const { data } = await supabase.from(CHATS_TABLE).select("*").eq("id", text(fd, "id", 60)).maybeSingle();
  const recipient = data as Recipient | null;
  if (!recipient) return { status: "error", message: "Penerima tidak ditemukan." };
  if (recipientStatus(recipient) !== "tersambung") {
    return { status: "error", message: "Penerima ini belum membuka bot atau sedang nonaktif." };
  }

  const result = await sendMessage(
    recipient.chat_id!,
    "👋 Pesan tes dari admin panel Every Nation Kelapa Gading. Bot tersambung dengan baik.",
  );
  return result.ok
    ? { status: "success", message: "Pesan tes terkirim." }
    : { status: "error", message: `Gagal mengirim: ${result.description}` };
}

export async function sendDigestNow(_prev: ActionState): Promise<ActionState> {
  await adminDb();
  const report = await sendDailyDigests({ force: true });
  refresh();
  if (report.note) return { status: "error", message: report.note };
  if (!report.sent && !report.failed) return { status: "success", message: "Tidak ada yang perlu dikabarkan hari ini." };
  return report.failed
    ? { status: "error", message: `${report.sent} terkirim, ${report.failed} gagal. Mungkin penerimanya memblokir bot.` }
    : { status: "success", message: `Ringkasan terkirim ke ${report.sent} orang.` };
}
