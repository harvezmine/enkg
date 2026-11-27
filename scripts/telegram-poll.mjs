#!/usr/bin/env node
/**
 * Uji bot Telegram di komputer sendiri, tanpa https.
 *
 * Telegram hanya bisa mengirim webhook ke alamat https publik. Untuk uji lokal,
 * skrip ini mengambil pesan masuk lewat getUpdates (long polling) lalu
 * meneruskannya ke webhook situs lokal, persis seperti yang dilakukan Telegram.
 *
 *   node --env-file=.env.local scripts/telegram-poll.mjs [port]
 *
 * Hanya jalan selama bot BELUM punya webhook (situs online belum menekan
 * "Sambungkan bot"). Skrip ini sengaja tidak pernah menghapus webhook: kalau
 * Telegram menjawab 409, berarti bot sedang dipakai situs online, jadi berhenti.
 */

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const apiBase = (process.env.TELEGRAM_API_BASE?.trim() || "https://api.telegram.org").replace(/\/+$/, "");
const port = process.argv[2] || process.env.PORT || 3000;
const target = `http://localhost:${port}/api/telegram/webhook`;

if (!token || !secret) {
  console.error("[telegram-poll] Isi TELEGRAM_BOT_TOKEN dan TELEGRAM_WEBHOOK_SECRET dulu (mis. di .env.local).");
  process.exit(1);
}

let offset = 0;
let running = true;
process.on("SIGINT", () => {
  running = false;
  console.log("\n[telegram-poll] berhenti.");
  process.exit(0);
});

console.log(`[telegram-poll] meneruskan pesan bot ke ${target}. Tekan Ctrl+C untuk berhenti.`);

while (running) {
  let json;
  try {
    const res = await fetch(`${apiBase}/bot${token}/getUpdates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ offset, timeout: 30, allowed_updates: ["message", "callback_query", "my_chat_member"] }),
      signal: AbortSignal.timeout(40_000),
    });
    json = await res.json();
    if (res.status === 409) {
      console.error("[telegram-poll] Bot sedang memakai webhook (situs online). Skrip ini hanya untuk uji lokal, berhenti.");
      process.exit(1);
    }
  } catch (error) {
    console.error("[telegram-poll] gagal menghubungi Telegram:", error instanceof Error ? error.message : error);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    continue;
  }

  if (!json?.ok) {
    // Token tidak pernah dicetak: hanya pesan dari Telegram.
    console.error("[telegram-poll] Telegram menolak:", json?.description ?? "tanpa keterangan");
    process.exit(1);
  }

  for (const update of json.result) {
    offset = update.update_id + 1;
    const kind = Object.keys(update).find((key) => key !== "update_id");
    try {
      const res = await fetch(target, {
        method: "POST",
        headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret },
        body: JSON.stringify(update),
      });
      console.log(`[telegram-poll] ${kind} #${update.update_id} → ${res.status}`);
    } catch (error) {
      console.error(`[telegram-poll] ${kind} #${update.update_id} gagal diteruskan:`, error instanceof Error ? error.message : error);
    }
  }
}
