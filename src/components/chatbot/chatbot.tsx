"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type SVGProps } from "react";

import { Icon } from "@/components/icons";
import { whatsappMessages, whatsappUrl } from "@/content/site";
import { MAX_CHARS, MAX_MESSAGES, QUICK_REPLIES, type ChatMessage } from "@/lib/chatbot/messages";
import { cn } from "@/lib/utils";

import { ReplyText } from "./reply-text";

/*
 * Chatbot mengambang di situs publik, menggantikan tombol WhatsApp. Pertanyaan
 * dijawab /api/chat (AI bila tersedia, kalau tidak dari informasi situs), dan
 * jalan ke WhatsApp tim selalu terlihat di kepala jendela.
 */

const STORAGE_KEY = "enkg-chat:v1";
const MAX_STORED = 30;

const WELCOME =
  "Halo! Aku asisten situs Every Nation Kelapa Gading. Pilih salah satu pertanyaan di bawah, atau ketik pertanyaanmu sendiri.";

/** Ikon tiap pertanyaan cepat, supaya mudah dikenali tanpa harus membaca semuanya. */
const QUICK_ICON: Record<string, (props: { className?: string }) => ReactNode> = {
  jadwal: Icon.calendar,
  lifegroup: Icon.users,
  doa: Icon.heart,
  lokasi: Icon.mapPin,
  anak: Icon.home,
  pertama: Icon.arrowRight,
};

/** Sapaan kecil di samping tombol chat, sekali per kunjungan. */
const NUDGE_KEY = "enkg-chat:sapa";
const NUDGE_AFTER_MS = 6000;
const NUDGE_FOR_MS = 14000;

type Status = "idle" | "waiting" | "streaming";
type Failure = { message: string } | null;

function SendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  );
}

function ResetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
    </svg>
  );
}

/** Tautan WhatsApp yang membawa pertanyaan terakhir, supaya tim tidak perlu bertanya ulang. */
function handoffUrl(messages: ChatMessage[]) {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content;
  return whatsappUrl(last ? `Halo Every Nation Kelapa Gading, saya mau tanya: ${last.slice(0, 300)}` : whatsappMessages.general);
}

function loadStored(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed
          .filter((m): m is ChatMessage => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
          .slice(-MAX_STORED)
      : [];
  } catch {
    return [];
  }
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState<Failure>(null);
  const [announce, setAnnounce] = useState("");
  const [modal, setModal] = useState(false);
  const [nudge, setNudge] = useState(false);

  const titleId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const restored = useRef(false);

  // Percakapan bertahan selama tab terbuka (sessionStorage), tidak lebih lama.
  useEffect(() => {
    setMessages(loadStored());
    restored.current = true;
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      // Mode privat atau penyimpanan penuh: percakapan cukup hidup di memori.
    }
  }, [messages]);

  // Sapa sekali per kunjungan, beberapa detik setelah halaman dibuka.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(NUDGE_KEY)) return;
    } catch {
      return;
    }
    const show = window.setTimeout(() => {
      setNudge(true);
      try {
        sessionStorage.setItem(NUDGE_KEY, "1");
      } catch {}
    }, NUDGE_AFTER_MS);
    const hide = window.setTimeout(() => setNudge(false), NUDGE_AFTER_MS + NUDGE_FOR_MS);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  // Di HP jendela memenuhi layar (modal); di desktop jadi kartu di pojok.
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setModal(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && panelRef.current?.contains(document.activeElement)) return close();
      if (event.key !== "Tab" || !modal) return;
      const stops = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), textarea");
      if (!stops?.length) return;
      const first = stops[0]!;
      const last = stops[stops.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    if (modal) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, modal, close]);

  // Selalu ikut ke pesan terbaru.
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, status, failure, open]);

  const send = useCallback(
    async (question: string) => {
      const content = question.trim().slice(0, MAX_CHARS);
      if (!content || status !== "idle") return;

      const history: ChatMessage[] = [...messages, { role: "user", content }];
      setMessages(history);
      setDraft("");
      setFailure(null);
      setStatus("waiting");

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-MAX_MESSAGES) }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const reason = await res.text().catch(() => "");
          setFailure({ message: reason && reason.length < 200 ? reason : "Maaf, asisten sedang tidak bisa menjawab." });
          setStatus("idle");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";
        setMessages([...history, { role: "assistant", content: "" }]);
        setStatus("streaming");
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          const snapshot = answer;
          setMessages([...history, { role: "assistant", content: snapshot }]);
        }
        answer += decoder.decode();
        if (!answer.trim()) {
          setMessages(history);
          setFailure({ message: "Maaf, jawabannya kosong. Coba tanya lagi, atau lanjut lewat WhatsApp." });
        } else {
          setMessages([...history, { role: "assistant", content: answer }]);
          setAnnounce(answer.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, ""));
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setFailure({ message: "Koneksi terputus. Coba lagi sebentar, atau lanjut lewat WhatsApp." });
        }
      } finally {
        abortRef.current = null;
        setStatus("idle");
      }
    },
    [messages, status],
  );

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setFailure(null);
    setDraft("");
    setStatus("idle");
    inputRef.current?.focus();
  };

  const busy = status !== "idle";
  const started = messages.some((m) => m.role === "user");
  const remaining = MAX_CHARS - draft.length;

  return (
    <>
      {/* ── Tombol pembuka ─────────────────────────────────────────────────── */}
      {nudge && !open && (
        <div className="animate-sheet fixed right-4 bottom-[5.25rem] z-40 max-w-[16rem] sm:right-6 sm:bottom-[6.25rem]">
          <button
            type="button"
            onClick={() => {
              setNudge(false);
              setOpen(true);
            }}
            className="block rounded-2xl rounded-br-md bg-white px-4 py-3 pr-9 text-left text-[15px] leading-snug text-ink shadow-lift ring-1 ring-ink/8"
          >
            Halo! Mau tanya jadwal ibadah atau Life Group? <span className="font-semibold text-navy-700">Tanya di sini.</span>
          </button>
          <button
            type="button"
            onClick={() => setNudge(false)}
            aria-label="Tutup sapaan"
            className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-cream-100"
          >
            <Icon.close className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => {
          setNudge(false);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Buka chat dengan Every Nation Kelapa Gading"
        className={cn(
          "bg-navy-deep group fixed right-4 bottom-4 z-40 flex items-center gap-2.5 rounded-full p-1.5 pr-4 text-cream-100 shadow-lift ring-1 ring-white/10 transition duration-300 hover:-translate-y-0.5 sm:right-6 sm:bottom-6 sm:pr-5",
          open && "pointer-events-none scale-90 opacity-0",
        )}
      >
        <span className="relative grid h-11 w-11 place-items-center rounded-full bg-sun-500 text-navy-900 transition group-hover:rotate-[-8deg]">
          <Icon.message className="h-5 w-5" />
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#25d366] ring-2 ring-navy-800" />
        </span>
        <span className="text-left">
          <span className="block text-sm leading-tight font-semibold">Tanya kami</span>
          <span className="hidden text-[11px] leading-tight text-cream-100/60 sm:block">Jadwal, Life Group, lokasi</span>
        </span>
      </button>

      {/* ── Jendela chat ───────────────────────────────────────────────────── */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal={modal || undefined}
          aria-labelledby={titleId}
          className={cn(
            "animate-sheet fixed z-60 flex flex-col overflow-hidden bg-cream-50 text-ink",
            "inset-0 pt-[env(safe-area-inset-top)]",
            "sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(38rem,calc(100dvh-3rem))] sm:w-[24rem] sm:rounded-[1.75rem] sm:pt-0 sm:shadow-deep sm:ring-1 sm:ring-ink/10",
          )}
        >
          <header className="bg-navy-deep relative shrink-0 text-cream-100">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sun-500 text-navy-900">
                <Icon.message className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="font-display text-base leading-tight font-bold">
                  Tanya ENKG
                </h2>
                <p className="flex items-center gap-1.5 text-xs text-cream-100/65">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#25d366]" />
                  Siap menjawab
                </p>
              </div>
              {started && (
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Mulai percakapan baru"
                  title="Mulai percakapan baru"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream-100/70 transition hover:bg-white/10 hover:text-cream-100"
                >
                  <ResetIcon className="h-[18px] w-[18px]" />
                </button>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Tutup chat"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream-100/70 transition hover:bg-white/10 hover:text-cream-100"
              >
                <Icon.close className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="bg-paper min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
            onClick={(event) => {
              // Tautan ke bagian halaman ini (mis. #kalender): di HP jendela chat
              // menutupi layar, jadi tutup dulu supaya bagiannya langsung terlihat.
              const link = (event.target as HTMLElement).closest("a");
              if (modal && link?.getAttribute("href")?.startsWith("#")) setOpen(false);
            }}
          >
            <ol className="space-y-3" aria-label="Percakapan">
              <li className="flex flex-col items-start">
                <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-base leading-relaxed shadow-soft ring-1 ring-ink/6">
                  {WELCOME}
                </div>
                {!started && <HelpLink href={handoffUrl(messages)} />}
              </li>

              {messages.map((message, index) =>
                message.role === "user" ? (
                  <li key={index} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-navy-700 px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap text-cream-50">
                      {message.content}
                    </div>
                  </li>
                ) : (
                  <li key={index} className="flex flex-col items-start">
                    <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-base leading-relaxed shadow-soft ring-1 ring-ink/6">
                      {message.content ? <ReplyText text={message.content} /> : <Typing />}
                    </div>
                    {/* Setiap jawaban yang sudah selesai ditutup dengan jalan ke tim. */}
                    {message.content && !(busy && index === messages.length - 1) && (
                      <HelpLink href={handoffUrl(messages.slice(0, index))} />
                    )}
                  </li>
                ),
              )}

              {status === "waiting" && (
                <li className="flex">
                  <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-soft ring-1 ring-ink/6">
                    <Typing />
                  </div>
                </li>
              )}

              {failure && (
                <li className="flex">
                  <div role="alert" className="max-w-[88%] rounded-2xl rounded-tl-md bg-sun-400/15 px-4 py-3 text-sm leading-relaxed ring-1 ring-sun-500/40">
                    <p>{failure.message}</p>
                    <a
                      href={handoffUrl(messages)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-wa mt-3 px-4 py-2 text-sm"
                    >
                      <Icon.whatsapp className="h-4 w-4" /> Hubungi kami
                    </a>
                  </div>
                </li>
              )}
            </ol>

            {!busy && !started && (
              <div className="mt-4 grid grid-cols-2 gap-2" aria-label="Pertanyaan cepat">
                {QUICK_REPLIES.map((reply) => {
                  const ReplyIcon = QUICK_ICON[reply.id] ?? Icon.message;
                  return (
                    <button
                      key={reply.id}
                      type="button"
                      onClick={() => send(reply.prompt)}
                      className="flex min-h-14 items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 text-left text-sm leading-snug font-semibold text-ink ring-1 ring-ink/8 transition hover:ring-navy-300 active:scale-[0.98]"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-700">
                        <ReplyIcon className="h-4 w-4" />
                      </span>
                      {reply.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Setelah ada jawaban: saran pertanyaan dalam satu baris yang bisa digeser. */}
          {!busy && started && (
            <div className="shrink-0 border-t border-ink/6 bg-cream-50" aria-label="Pertanyaan lain">
              <div className="flex gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
                {QUICK_REPLIES.filter((reply) => !messages.some((m) => m.role === "user" && m.content === reply.prompt)).map((reply) => (
                  <button
                    key={reply.id}
                    type="button"
                    onClick={() => send(reply.prompt)}
                    className="shrink-0 rounded-full bg-white px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-navy-800 ring-1 ring-ink/10 transition hover:ring-navy-300"
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
            className="shrink-0 border-t border-ink/8 bg-cream-50 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
          >
            <div className="flex items-end gap-2 rounded-[1.4rem] bg-white p-1.5 pl-4 ring-1 ring-ink/10 transition focus-within:ring-2 focus-within:ring-navy-700">
              <label htmlFor={`${titleId}-input`} className="sr-only">
                Tulis pertanyaan
              </label>
              <textarea
                id={`${titleId}-input`}
                ref={inputRef}
                value={draft}
                rows={1}
                maxLength={MAX_CHARS}
                onChange={(event) => {
                  setDraft(event.target.value);
                  const el = event.target;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    send(draft);
                  }
                }}
                placeholder="Ketik pertanyaanmu…"
                className="max-h-[120px] min-h-10 flex-1 resize-none bg-transparent py-2 text-base leading-relaxed text-ink outline-none placeholder:text-ink-soft/55"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label="Kirim"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-700 text-cream-50 transition hover:bg-navy-800 disabled:bg-ink/10 disabled:text-ink-soft/50"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1.5 flex items-start justify-between gap-3 px-1 text-[11px] leading-snug text-ink-soft/80">
              <span>Dijawab otomatis, bisa keliru.</span>
              {remaining < 100 && <span className="tabular shrink-0">{remaining}</span>}
            </p>
          </form>

          <p className="sr-only" aria-live="polite">
            {busy ? "Asisten sedang menulis jawaban." : announce}
          </p>
        </div>
      )}
    </>
  );
}

/** Baris kecil di bawah setiap jawaban: jalan ke tim lewat WhatsApp. */
function HelpLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 ml-1 inline-flex items-center gap-1.5 rounded-full py-1 pr-2 text-sm text-ink-soft transition hover:text-navy-700"
    >
      <Icon.whatsapp className="h-4 w-4 text-[#1da851]" />
      Perlu bantuan?
      <span className="font-semibold text-navy-700 underline decoration-sun-500 decoration-2 underline-offset-4">Hubungi kami</span>
    </a>
  );
}

function Typing() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Sedang menulis">
      <span className="mr-1.5 text-sm text-ink-soft">Sedang menulis</span>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-bounce rounded-full bg-navy-300"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
