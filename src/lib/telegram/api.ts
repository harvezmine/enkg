import "server-only";

import { telegramConfig } from "./config";

/*
 * Klien Bot API Telegram lewat fetch biasa. Tidak pernah melempar error:
 * kegagalan dikembalikan sebagai { ok: false }, karena pemanggilnya (form
 * Contact Us, webhook, cron) tidak boleh ikut gagal hanya karena Telegram.
 */

export type InlineButton = { text: string; callback_data?: string; url?: string };
export type InlineKeyboard = { inline_keyboard: InlineButton[][] };
/** reply_markup apa pun: tombol inline, tombol balasan (mis. minta nomor), atau hapus tombol. */
export type ReplyMarkup = InlineKeyboard | Record<string, unknown>;

export type ApiResult<T = unknown> = { ok: true; result: T } | { ok: false; description: string };

export async function callTelegram<T = unknown>(method: string, payload: Record<string, unknown> = {}): Promise<ApiResult<T>> {
  const config = telegramConfig();
  if (!config) return { ok: false, description: "Bot Telegram belum dikonfigurasi." };

  try {
    const res = await fetch(`${config.apiBase}/bot${config.token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
    if (!json?.ok) {
      const description = json?.description ?? `HTTP ${res.status}`;
      // Token tidak pernah ikut dicatat: yang dicatat hanya nama method dan pesan Telegram.
      console.error(`[telegram] ${method} gagal:`, description);
      return { ok: false, description };
    }
    return { ok: true, result: json.result as T };
  } catch (error) {
    console.error(`[telegram] ${method} gagal:`, error instanceof Error ? error.message : error);
    return { ok: false, description: "Tidak bisa menghubungi Telegram." };
  }
}

export function sendMessage(chatId: number, html: string, keyboard?: ReplyMarkup) {
  return callTelegram<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

export function editMessage(chatId: number, messageId: number, html: string, keyboard?: InlineKeyboard) {
  return callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: keyboard ?? { inline_keyboard: [] },
  });
}

/** Keluar dari grup: bot ini hanya melayani chat pribadi. */
export function leaveChat(chatId: number) {
  return callTelegram("leaveChat", { chat_id: chatId });
}

export function answerCallback(callbackQueryId: string, text?: string, showAlert = false) {
  return callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: showAlert } : {}),
  });
}

/** Susun tombol menjadi baris berisi `perRow` tombol. */
export function rows(buttons: InlineButton[], perRow = 2): InlineButton[][] {
  const result: InlineButton[][] = [];
  for (let i = 0; i < buttons.length; i += perRow) result.push(buttons.slice(i, i + perRow));
  return result;
}
