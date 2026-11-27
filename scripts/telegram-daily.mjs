#!/usr/bin/env node
/**
 * Pemicu ringkasan harian bot Telegram. Dijalankan PM2 (`enkg-telegram-daily`)
 * tiap jam, lalu selesai. Aplikasinya sendiri yang memutuskan kapan mengirim:
 * pertama kali setelah 06.00 WIB, sekali sehari per chat. Jadi zona waktu
 * server tidak berpengaruh, dan cron yang terlewat terkejar di jam berikutnya.
 */

const port = process.env.PORT || 3001;
const secret = process.env.CRON_SECRET || "";

if (secret.length < 16) {
  console.log("[telegram-daily] CRON_SECRET belum diisi, dilewati.");
  process.exit(0);
}

try {
  const res = await fetch(`http://127.0.0.1:${port}/api/telegram/daily`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(60_000),
  });
  console.log(`[telegram-daily] ${res.status} ${await res.text()}`);
  process.exit(res.ok ? 0 : 1);
} catch (error) {
  console.error("[telegram-daily] gagal:", error instanceof Error ? error.message : error);
  process.exit(1);
}
