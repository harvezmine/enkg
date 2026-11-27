import { NextResponse } from "next/server";

import { telegramConfig } from "@/lib/telegram/config";
import { handleUpdate, type TelegramUpdate } from "@/lib/telegram/handlers";
import { secretMatches } from "@/lib/telegram/secret";

export const dynamic = "force-dynamic";

/**
 * Webhook bot Telegram. Telegram mengirim header X-Telegram-Bot-Api-Secret-Token
 * berisi secret yang didaftarkan saat setWebhook; tanpa itu permintaan ditolak,
 * jadi orang lain tidak bisa memalsukan perintah atau tombol assign.
 */
export async function POST(request: Request) {
  const config = telegramConfig();
  if (!config) return NextResponse.json({ ok: false, error: "Bot belum dikonfigurasi." }, { status: 503 });

  if (!secretMatches(request.headers.get("x-telegram-bot-api-secret-token"), config.webhookSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await handleUpdate(update);
  } catch (error) {
    // Tetap balas 200: kalau tidak, Telegram mengirim ulang update yang sama terus-menerus.
    console.error("[telegram] webhook:", error instanceof Error ? error.message : error);
  }
  return NextResponse.json({ ok: true });
}
