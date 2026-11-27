import type { Metadata } from "next";
import type { ReactNode } from "react";

import { removeChat, setChatActive } from "@/app/actions/telegram";
import { DbError } from "@/components/admin/db-error";
import { DeleteButton } from "@/components/admin/delete-button";
import { AddRecipientForm, ConnectBotButton, DigestNowButton, TestMessageButton, TopicToggles } from "@/components/admin/telegram/controls";
import { AdminPageHeader, Badge, Card } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { callTelegram } from "@/lib/telegram/api";
import { telegramConfig, telegramEnvStatus } from "@/lib/telegram/config";
import { allChats } from "@/lib/telegram/data";
import { recipientStatus, type Recipient, type RecipientStatus } from "@/lib/telegram/recipients";
import { formatDate } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Bot Telegram" };
export const dynamic = "force-dynamic";

type WebhookInfo = { url: string; pending_update_count: number; last_error_message?: string };

const STATUS: Record<RecipientStatus, { label: string; tone: "green" | "sun" | "gray" }> = {
  tersambung: { label: "Tersambung", tone: "green" },
  menunggu: { label: "Menunggu dibuka di Telegram", tone: "sun" },
  nonaktif: { label: "Nonaktif", tone: "gray" },
};

function StatusRow({ ok, label, children }: { ok: boolean; label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${ok ? "bg-emerald-50 text-emerald-700" : "bg-sun-400/20 text-[#7a5a00]"}`}
      >
        {ok ? <Icon.check className="h-3.5 w-3.5" /> : <Icon.alert className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-ink">{label}</p>
        <div className="mt-0.5 leading-relaxed text-ink-soft">{children}</div>
      </div>
    </li>
  );
}

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-cream-200 px-1.5 py-0.5 text-xs text-ink">{children}</code>
);

/** Pesan WhatsApp berisi langkah membuka bot, dikirim admin ke penerimanya. */
function guideLink(recipient: Recipient, botUsername: string | null) {
  if (!recipient.phone) return null;
  const name = recipient.name?.split(" ")[0] ?? "";
  const bot = botUsername ? `https://t.me/${botUsername}` : "bot Telegram gereja";
  return whatsappLink(
    recipient.phone,
    [
      `Halo${name ? ` ${name}` : ""}, kamu didaftarkan sebagai penerima pengingat internal Every Nation Kelapa Gading di Telegram.`,
      "",
      `1. Buka ${bot}`,
      "2. Tekan Mulai (Start)",
      "3. Tekan tombol Kirim nomor saya",
      "",
      `Pastikan Telegram kamu memakai nomor ${recipient.phone}. Terima kasih!`,
    ].join("\n"),
  );
}

export default async function TelegramPage() {
  await adminDb();
  const env = telegramEnvStatus();
  const config = telegramConfig();

  const [me, webhook, list] = await Promise.all([
    config ? callTelegram<{ username: string; first_name: string }>("getMe") : Promise.resolve(null),
    config ? callTelegram<WebhookInfo>("getWebhookInfo") : Promise.resolve(null),
    allChats(),
  ]);

  const bot = me?.ok ? me.result : null;
  const hook = webhook?.ok ? webhook.result : null;
  const expectedHook = config ? `${config.siteUrl}/api/telegram/webhook` : "";
  const connected = Boolean(hook?.url && hook.url === expectedHook);
  const ready = Boolean(bot) && connected;
  const recipients = list.chats;
  const linkedCount = recipients.filter((r) => recipientStatus(r) === "tersambung").length;

  return (
    <>
      <AdminPageHeader
        title="Bot Telegram"
      />
      <DbError error={list.error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-6">
          {/* ── Ringkasan status ─────────────────────────────────────── */}
          <Card className={`flex flex-wrap items-center gap-4 p-4 sm:p-5 ${ready ? "" : "ring-sun-500/40"}`}>
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${ready ? "bg-emerald-50 text-emerald-700" : "bg-sun-400/20 text-[#7a5a00]"}`}
            >
              {ready ? <Icon.check className="h-6 w-6" /> : <Icon.alert className="h-6 w-6" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-ink">
                {ready ? "Bot siap" : !config ? "Bot belum diatur di server" : !bot ? "Kunci bot ditolak Telegram" : "Bot belum tersambung ke situs"}
              </p>
              <p className="mt-0.5 text-sm text-ink-soft">
                {ready
                  ? `${linkedCount} dari ${recipients.length} penerima sudah tersambung.`
                  : !config
                    ? "Minta pengelola server mengisi pengaturan bot. Petunjuknya ada di bagian Detail teknis."
                    : !bot
                      ? "Periksa lagi token bot dari BotFather di pengaturan server."
                      : "Tekan Sambungkan bot di samping. Cukup sekali setelah situs online."}
              </p>
            </div>
            {bot && (
              <a
                href={`https://t.me/${bot.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline shrink-0 px-4 py-2.5 text-sm"
              >
                Buka @{bot.username}
              </a>
            )}
          </Card>

          {/* ── Penerima ─────────────────────────────────────────────── */}
          <section>
            <h2 className="font-display mb-4 text-xl font-bold text-ink">Penerima</h2>

            {recipients.length ? (
              <ul className="space-y-3">
                {recipients.map((recipient) => {
                  const status = recipientStatus(recipient);
                  const guide = guideLink(recipient, bot?.username ?? null);
                  return (
                    <li key={recipient.id}>
                      <Card className={`p-4 sm:p-5 ${status === "nonaktif" ? "opacity-70" : ""}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display truncate text-lg font-bold text-ink">{recipient.name || recipient.phone}</p>
                              <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-ink-soft">
                              {[
                                recipient.phone,
                                recipient.linked_at ? `tersambung ${formatDate(recipient.linked_at)}` : `didaftarkan ${formatDate(recipient.created_at)}`,
                                recipient.last_digest_on && `ringkasan terakhir ${formatDate(`${recipient.last_digest_on}T00:00:00+07:00`)}`,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <form action={setChatActive}>
                            <input type="hidden" name="id" value={recipient.id} />
                            <input type="hidden" name="active" value={recipient.is_active ? "false" : "true"} />
                            <button
                              type="submit"
                              className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-cream-100 hover:text-ink"
                            >
                              {recipient.is_active ? "Hentikan sementara" : "Aktifkan lagi"}
                            </button>
                          </form>
                        </div>

                        {status === "menunggu" && (
                          <div className="mt-4 rounded-xl bg-sun-400/15 p-3.5 text-sm text-ink ring-1 ring-sun-500/40">
                            <p>
                              Belum membuka bot. Minta {recipient.name?.split(" ")[0] || "dia"} membuka{" "}
                              {bot ? <strong>@{bot.username}</strong> : "bot gereja"}, menekan Mulai, lalu Kirim nomor saya.
                            </p>
                            {guide && (
                              <a href={guide} target="_blank" rel="noopener noreferrer" className="btn btn-wa mt-3 px-4 py-2 text-sm">
                                <Icon.whatsapp className="h-4 w-4" />
                                Kirim petunjuk lewat WhatsApp
                              </a>
                            )}
                          </div>
                        )}

                        <p className="mt-4 mb-2 text-xs font-semibold text-ink-soft">Pengingat yang dikirim</p>
                        <TopicToggles id={recipient.id} topics={recipient.topics} />

                        <div className="mt-4 flex flex-wrap items-start justify-between gap-2 border-t border-ink/8 pt-3">
                          {status === "tersambung" ? <TestMessageButton id={recipient.id} /> : <span />}
                          <DeleteButton action={removeChat} id={recipient.id} label="Hapus penerima" />
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            ) : (
              !list.error && (
                <div className="rounded-2xl border border-dashed border-ink/15 bg-white/60 px-6 py-10 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy-50 text-navy-700">
                    <Icon.message className="h-5 w-5" />
                  </div>
                  <p className="font-display mt-4 text-lg font-bold text-ink">Belum ada penerima</p>
                </div>
              )
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="p-4 sm:p-5">
            <h2 className="font-display mb-4 text-lg font-bold text-ink">Tambah penerima</h2>
            <AddRecipientForm />
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold text-ink">Sambungkan bot</h2>
            {config && (
              <div className="mt-4 space-y-3">
                <ConnectBotButton />
                <DigestNowButton />
              </div>
            )}

            <details className="group mt-4 border-t border-ink/8 pt-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
                Detail teknis untuk pengelola server
              </summary>
              <ul className="mt-1 divide-y divide-ink/8">
                <StatusRow ok={env.token && Boolean(bot)} label="Token bot">
                  {!env.token ? (
                    <>
                      Isi <Code>TELEGRAM_BOT_TOKEN</Code> dari @BotFather.
                    </>
                  ) : bot ? (
                    <>Tersambung sebagai @{bot.username}.</>
                  ) : (
                    "Token terisi tapi Telegram menolaknya."
                  )}
                </StatusRow>
                <StatusRow ok={env.webhookSecret === "ok"} label="Secret webhook">
                  {env.webhookSecret === "ok" ? (
                    "Terisi."
                  ) : (
                    <>
                      Isi <Code>TELEGRAM_WEBHOOK_SECRET</Code>: teks acak 16 sampai 256 karakter (huruf, angka, _ atau -).
                    </>
                  )}
                </StatusRow>
                <StatusRow ok={connected} label="Webhook">
                  {connected ? (
                    <>
                      Terpasang ke {expectedHook}.{hook?.last_error_message ? ` Error terakhir: ${hook.last_error_message}` : ""}
                    </>
                  ) : (
                    <>
                      Belum terpasang. Butuh <Code>NEXT_PUBLIC_SITE_URL</Code> berupa alamat https publik.
                    </>
                  )}
                </StatusRow>
                <StatusRow ok={env.cronSecret} label="Ringkasan pagi otomatis">
                  {env.cronSecret ? (
                    "CRON_SECRET terisi. Cron PM2 memanggil ringkasan tiap jam."
                  ) : (
                    <>
                      Isi <Code>CRON_SECRET</Code> (minimal 16 karakter).
                    </>
                  )}
                </StatusRow>
              </ul>
            </details>
          </Card>
        </aside>
      </div>
    </>
  );
}
