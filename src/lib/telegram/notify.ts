import "server-only";

import { TABLES, type ContactSubmission } from "@/lib/db-types";
import { whatsappLink } from "@/lib/whatsapp";

import { sendMessage, type InlineButton } from "./api";
import { isTelegramConfigured, publicAdminUrl } from "./config";
import { chatsFor, db } from "./data";
import { prayerMessage, type Topic } from "./format";
import { memberCard } from "./members";

/*
 * Pemberitahuan keluar dari aplikasi ke Telegram, dikirim satu per satu ke
 * setiap penerima yang tersambung dan mengikuti topiknya. Fungsi di sini aman
 * dipanggil dari mana saja (Server Action, route handler, `after()`): tidak
 * pernah melempar error dan langsung selesai kalau bot belum dikonfigurasi.
 */

/**
 * Kabari penerima bertopik "jemaat_baru" tentang jemaat baru, lengkap dengan
 * tombol Life Group untuk langsung meng-assign.
 *  - `submissionId`: kiriman Gabung Life Group dari situs.
 *  - `personId`: jemaat yang ditambahkan admin dengan status "baru".
 */
export async function notifyNewMember({ personId, submissionId }: { personId?: string; submissionId?: string }) {
  try {
    if (!isTelegramConfigured() || (!personId && !submissionId)) return;
    const recipients = await chatsFor("jemaat_baru");
    if (!recipients.length) return;

    const card = personId
      ? await memberCard({ kind: "person", id: personId }, "admin")
      : await memberCard({ kind: "submission", id: submissionId! }, "situs");
    if (!card) return;

    for (const recipient of recipients) await sendMessage(recipient.chat_id!, card.html, card.keyboard);
  } catch (error) {
    console.error("[telegram] notifyNewMember:", error instanceof Error ? error.message : error);
  }
}

/** Kabari penerima bertopik "doa" tentang permohonan doa yang baru masuk lewat situs. */
export async function notifyPrayer(submissionId: string) {
  try {
    if (!isTelegramConfigured()) return;
    const recipients = await chatsFor("doa");
    if (!recipients.length) return;

    const { data } = await db().from(TABLES.submissions).select("*").eq("id", submissionId).eq("form", "prayer").maybeSingle();
    const submission = data as ContactSubmission | null;
    if (!submission) return;

    const adminUrl = publicAdminUrl("/admin/kontak?form=prayer");
    const html = prayerMessage({ name: submission.name, phone: submission.phone, request: submission.request, adminUrl });
    const firstName = submission.name.trim().split(/\s+/)[0] ?? submission.name;
    const buttons: InlineButton[][] = [];
    if (submission.phone) {
      buttons.push([
        {
          text: "Hubungi lewat WhatsApp",
          url: whatsappLink(
            submission.phone,
            `Halo ${firstName}, kami dari Every Nation Kelapa Gading. Kami sudah menerima permohonan doamu dan ikut mendoakan.`,
          ),
        },
      ]);
    }
    if (adminUrl) buttons.push([{ text: "Buka di admin", url: adminUrl }]);

    for (const recipient of recipients) {
      await sendMessage(recipient.chat_id!, html, buttons.length ? { inline_keyboard: buttons } : undefined);
    }
  } catch (error) {
    console.error("[telegram] notifyPrayer:", error instanceof Error ? error.message : error);
  }
}

/** Pesan bebas (HTML Telegram, data pengguna sudah di-escape pemanggil) ke semua penerima bertopik `topic`. */
export async function notifyText(topic: Topic, html: string) {
  try {
    if (!isTelegramConfigured()) return;
    for (const recipient of await chatsFor(topic)) await sendMessage(recipient.chat_id!, html);
  } catch (error) {
    console.error("[telegram] notifyText:", error instanceof Error ? error.message : error);
  }
}
