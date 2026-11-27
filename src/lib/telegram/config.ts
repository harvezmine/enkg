/**
 * Konfigurasi bot Telegram internal, dibaca dari environment.
 *
 * Semua fitur bot diam (no-op) selama token atau secret belum diisi, jadi situs
 * dan admin panel tetap jalan normal sebelum bot disiapkan.
 */

/** Telegram hanya menerima huruf, angka, "_" dan "-" untuk secret_token, 1-256 karakter. */
const SECRET_FORMAT = /^[A-Za-z0-9_-]{16,256}$/;

export type TelegramConfig = {
  token: string;
  webhookSecret: string;
  apiBase: string;
  siteUrl: string;
};

export function telegramConfig(): TelegramConfig | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!token || !webhookSecret || !SECRET_FORMAT.test(webhookSecret)) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  return {
    token,
    webhookSecret,
    // Bisa diarahkan ke stub lokal saat pengujian.
    apiBase: (process.env.TELEGRAM_API_BASE?.trim() || "https://api.telegram.org").replace(/\/+$/, ""),
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "").replace(/\/+$/, ""),
  };
}

export const isTelegramConfigured = () => telegramConfig() !== null;

/** Status per variabel, untuk halaman admin (tanpa pernah menampilkan nilainya). */
export function telegramEnvStatus() {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
  return {
    token: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
    webhookSecret: secret ? (SECRET_FORMAT.test(secret) ? "ok" : "format") : "kosong",
    cronSecret: (process.env.CRON_SECRET?.trim() ?? "").length >= 16,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "",
  } as const;
}

/**
 * Tombol URL di Telegram hanya andal untuk alamat https publik; localhost
 * ditolak Telegram dan membuat seluruh pesan gagal terkirim.
 */
export function publicAdminUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "").replace(/\/+$/, "");
  if (!/^https:\/\//.test(base) || /localhost|127\.0\.0\.1/.test(base)) return null;
  return `${base}${path}`;
}
