import "server-only";

import { addDays } from "@/lib/calendar";
import { todayWib } from "@/lib/people";

import { sendMessage } from "./api";
import { isTelegramConfigured } from "./config";
import { CHATS_TABLE, anniversaryEntries, birthdayEntries, db, scheduleByDay, waitingMembers } from "./data";
import { buildDigest } from "./format";
import type { Recipient } from "./recipients";

/** Ringkasan dikirim mulai pukul 06.00 WIB. Cron boleh jalan tiap jam: yang pertama setelah jam ini yang mengirim. */
export const DIGEST_HOUR_WIB = 6;
/** Rentang pengingat ulang tahun & anniversary di ringkasan harian. */
const LOOKAHEAD_DAYS = 7;

export const hourWib = (now: Date) => (now.getUTCHours() + 7) % 24;

export type DigestReport = { sent: number; skipped: number; failed: number; note?: string };

/**
 * Kirim ringkasan harian ke setiap penerima yang tersambung, satu per satu,
 * paling banyak sekali sehari per orang (WIB). `force` mengabaikan jam dan
 * catatan "sudah terkirim hari ini", dipakai tombol "Kirim ringkasan sekarang"
 * di admin panel.
 */
export async function sendDailyDigests({ now = new Date(), force = false } = {}): Promise<DigestReport> {
  if (!isTelegramConfigured()) return { sent: 0, skipped: 0, failed: 0, note: "Bot belum dikonfigurasi." };
  if (!force && hourWib(now) < DIGEST_HOUR_WIB) return { sent: 0, skipped: 0, failed: 0, note: "Belum pukul 06.00 WIB." };

  const supabase = db();
  const { data, error } = await supabase
    .from(CHATS_TABLE)
    .select("*")
    .eq("is_active", true)
    .eq("chat_type", "private")
    .not("chat_id", "is", null)
    .not("telegram_user_id", "is", null);
  if (error) return { sent: 0, skipped: 0, failed: 0, note: error.message };
  const chats = (data ?? []) as Recipient[];
  if (!chats.length) return { sent: 0, skipped: 0, failed: 0, note: "Belum ada penerima yang tersambung. Minta mereka membuka bot dan menekan Kirim nomor saya." };

  const today = todayWib(now);
  const tomorrow = addDays(today, 1);
  const [birthdays, anniversaries, schedule, waiting] = await Promise.all([
    birthdayEntries(today, LOOKAHEAD_DAYS),
    anniversaryEntries(today, LOOKAHEAD_DAYS),
    scheduleByDay(now, 2),
    waitingMembers(),
  ]);

  const report: DigestReport = { sent: 0, skipped: 0, failed: 0 };

  for (const chat of chats) {
    if (!force) {
      // Klaim dulu baru kirim: dua proses cron yang berbarengan tidak akan mengirim dua kali.
      const { data: claimed } = await supabase
        .from(CHATS_TABLE)
        .update({ last_digest_on: today })
        .eq("id", chat.id)
        .or(`last_digest_on.is.null,last_digest_on.lt.${today}`)
        .select("id");
      if (!claimed?.length) {
        report.skipped++;
        continue;
      }
    }

    const html = buildDigest({
      today,
      tomorrow,
      topics: chat.topics,
      birthdays,
      anniversaries,
      scheduleToday: schedule.byDay.get(today) ?? [],
      scheduleTomorrow: schedule.byDay.get(tomorrow) ?? [],
      waitingCount: waiting.total,
    });
    if (!html) {
      report.skipped++;
      continue;
    }

    const result = await sendMessage(chat.chat_id!, html);
    if (result.ok) {
      report.sent++;
      if (force) await supabase.from(CHATS_TABLE).update({ last_digest_on: today }).eq("id", chat.id);
    } else {
      report.failed++;
      // Gagal kirim: kembalikan tanggalnya supaya cron jam berikutnya mencoba lagi.
      if (!force) await supabase.from(CHATS_TABLE).update({ last_digest_on: chat.last_digest_on }).eq("id", chat.id);
    }
  }

  return report;
}
