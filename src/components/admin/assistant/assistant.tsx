"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

/*
 * Asisten internal admin. Percakapan disimpan di sessionStorage (hilang saat
 * tab ditutup). Usulan perubahan data tampil sebagai kartu: baru tersimpan
 * setelah admin menekan "Jalankan".
 */

type Proposal = {
  kind: "proposal";
  summary: string;
  token: string;
  state: "pending" | "running" | "done" | "cancelled" | "error";
  result?: { message: string; href?: string; notify?: { href: string; label: string } };
};
type Item = { kind: "user"; text: string } | { kind: "assistant"; text: string; error?: boolean } | Proposal;

const STORAGE_KEY = "enkg-asisten:v1";
const SUGGESTIONS = [
  "Jemaat baru yang menunggu Life Group",
  "Kiriman Contact Us minggu ini",
  "Buat draf pengumuman",
  "Anggota Heritage",
];

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
    </svg>
  );
}

/* ── Teks jawaban: tebal, daftar, tautan admin/wa.me, nomor WA jadi tautan ── */

const PHONE = /((?:\+62|62|0)8\d[\d\s-]{6,13}\d)/g;
const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

function safeHref(href: string) {
  return href.startsWith("/admin") || href.startsWith("https://wa.me/") ? href : null;
}

function Phones({ text }: { text: string }) {
  const parts = text.split(PHONE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <a key={i} href={whatsappLink(part)} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Inline({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return (
    <>
      {text.split(INLINE).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}><Phones text={part.slice(2, -2)} /></strong>;
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          const href = safeHref(link[2]!);
          if (!href) return <Fragment key={i}>{link[1]}</Fragment>;
          return href.startsWith("/admin") ? (
            <Link key={i} href={href} onClick={onNavigate} className="font-semibold text-navy-700 underline decoration-sun-500 decoration-2 underline-offset-2">
              {link[1]}
            </Link>
          ) : (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline underline-offset-2">
              {link[1]}
            </a>
          );
        }
        return <Phones key={i} text={part} />;
      })}
    </>
  );
}

function Answer({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  // Jaring pengaman gaya: tanpa tanda pisah panjang, tanpa judul markdown.
  const clean = text.replace(/\s—\s/g, ": ").replace(/—/g, "-").replace(/^#{1,6}\s+/gm, "");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={blocks.length} className="list-disc space-y-1 pl-5">
        {list.map((item, i) => (
          <li key={i}>
            <Inline text={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>,
    );
    list = [];
  };
  for (const line of clean.split("\n")) {
    const item = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (item) {
      list.push(item[1]!);
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={blocks.length}><Inline text={line} onNavigate={onNavigate} /></p>);
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}

/* ── Komponen utama ───────────────────────────────────────────────────────── */

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setItems((JSON.parse(raw) as Item[]).map((item) => (item.kind === "proposal" && item.state === "running" ? { ...item, state: "pending" } : item)));
    } catch {
      // Penyimpanan tidak tersedia: percakapan cukup di memori.
    }
    setRestored(true);
  }, []);
  useEffect(() => {
    // Baru menyimpan setelah riwayat lama dipulihkan, supaya tidak tertimpa kosong.
    if (!restored) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-40)));
    } catch {}
  }, [items, restored]);

  useEffect(() => {
    if (!open) return;
    if (enabled === null) {
      fetch("/admin/asisten", { redirect: "manual" })
        .then((res) => (res.ok ? res.json() : { enabled: false }))
        .then((json: { enabled?: boolean }) => setEnabled(Boolean(json.enabled)))
        .catch(() => setEnabled(false));
    }
    input.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, enabled]);

  useEffect(() => {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight });
  }, [items, status, open]);

  const closeOnPhone = useCallback(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setOpen(false);
  }, []);

  const send = async (question: string) => {
    const text = question.trim().slice(0, 1500);
    if (!text || busy) return;
    const next: Item[] = [...items, { kind: "user", text }];
    setItems(next);
    setDraft("");
    setBusy(true);
    setStatus("Berpikir…");

    // Riwayat untuk model: teks saja; hasil usulan diringkas jadi satu kalimat.
    const history = next
      .map((item) =>
        item.kind === "user"
          ? { role: "user", content: item.text }
          : item.kind === "assistant"
            ? item.error ? null : { role: "assistant", content: item.text }
            : item.state === "done"
              ? { role: "assistant", content: `(Admin menjalankan: ${item.summary})` }
              : item.state === "cancelled"
                ? { role: "assistant", content: `(Admin membatalkan: ${item.summary})` }
                : null,
      )
      .filter(Boolean)
      .slice(-12);

    try {
      const res = await fetch("/admin/asisten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        redirect: "manual",
      });
      if (!res.ok || !res.body) {
        const json = res.headers.get("content-type")?.includes("json") ? ((await res.json()) as { error?: string }) : null;
        setItems((all) => [...all, { kind: "assistant", text: json?.error ?? "Sesi berakhir. Muat ulang halaman.", error: true }]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as { type: string; text?: string; summary?: string; token?: string };
          if (event.type === "status") setStatus(event.text ?? null);
          else if (event.type === "proposal") setItems((all) => [...all, { kind: "proposal", summary: event.summary!, token: event.token!, state: "pending" }]);
          else if (event.type === "answer") setItems((all) => [...all, { kind: "assistant", text: event.text ?? "" }]);
          else if (event.type === "error") setItems((all) => [...all, { kind: "assistant", text: event.text ?? "Gagal.", error: true }]);
        }
      }
    } catch {
      setItems((all) => [...all, { kind: "assistant", text: "Koneksi terputus. Coba lagi.", error: true }]);
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  const decide = async (index: number, run: boolean) => {
    const target = items[index];
    if (!target || target.kind !== "proposal" || target.state !== "pending") return;
    const update = (patch: Partial<Proposal>) =>
      setItems((all) => all.map((item, i) => (i === index && item.kind === "proposal" ? { ...item, ...patch } : item)));
    if (!run) return update({ state: "cancelled" });
    update({ state: "running" });
    try {
      const res = await fetch("/admin/asisten/jalankan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: target.token }),
        redirect: "manual",
      });
      const json = (await res.json().catch(() => null)) as Proposal["result"] & { ok?: boolean } | null;
      update({ state: json?.ok ? "done" : "error", result: json ?? { message: "Gagal menjalankan." } });
    } catch {
      update({ state: "error", result: { message: "Koneksi terputus." } });
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 inline-flex h-12 items-center gap-2 rounded-full bg-navy-700 pr-4 pl-3.5 text-sm font-semibold text-cream-100 shadow-lift transition hover:bg-navy-800 lg:right-6 lg:bottom-6"
        >
          <SparkIcon className="h-5 w-5 text-sun-400" />
          Asisten
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Asisten"
          className="animate-sheet fixed inset-0 z-50 flex flex-col bg-cream-50 lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[26rem] lg:border-l lg:border-ink/10 lg:shadow-deep"
        >
          <header className="bg-navy-deep flex shrink-0 items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-cream-100">
            <SparkIcon className="h-5 w-5 text-sun-400" />
            <p className="font-display flex-1 text-base font-bold">Asisten</p>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setItems([])}
                className="rounded-full px-3 py-2 text-xs font-semibold text-cream-100/75 transition hover:bg-white/10 hover:text-cream-100"
              >
                Mulai baru
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup asisten"
              className="grid h-10 w-10 place-items-center rounded-full text-cream-100/75 transition hover:bg-white/10 hover:text-cream-100"
            >
              <Icon.close className="h-5 w-5" />
            </button>
          </header>

          <div ref={scroll} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
            {enabled === false ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-ink-soft ring-1 ring-ink/8">Asisten belum aktif.</p>
            ) : items.length === 0 ? (
              <div className="grid gap-2">
                {SUGGESTIONS.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => send(text)}
                    className="rounded-2xl bg-white px-4 py-3 text-left text-[15px] font-semibold text-ink ring-1 ring-ink/8 transition hover:ring-navy-300"
                  >
                    {text}
                  </button>
                ))}
              </div>
            ) : (
              items.map((item, index) =>
                item.kind === "user" ? (
                  <div key={index} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-navy-700 px-4 py-2.5 text-[15px] whitespace-pre-wrap text-cream-50">{item.text}</p>
                  </div>
                ) : item.kind === "assistant" ? (
                  <div
                    key={index}
                    className={cn(
                      "max-w-[92%] rounded-2xl rounded-tl-md px-4 py-3 text-[15px] leading-relaxed ring-1",
                      item.error ? "bg-red-50 text-red-800 ring-red-200" : "bg-white text-ink ring-ink/8",
                    )}
                  >
                    <Answer text={item.text} onNavigate={closeOnPhone} />
                  </div>
                ) : (
                  <div key={index} className="rounded-2xl bg-sun-400/15 p-3.5 ring-1 ring-sun-500/40">
                    <p className="text-sm font-semibold text-ink">{item.summary}</p>
                    {item.state === "pending" || item.state === "running" ? (
                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          disabled={item.state === "running"}
                          onClick={() => decide(index, true)}
                          className="btn btn-navy px-4 py-2 text-sm"
                        >
                          {item.state === "running" ? "Menjalankan…" : "Jalankan"}
                        </button>
                        <button
                          type="button"
                          disabled={item.state === "running"}
                          onClick={() => decide(index, false)}
                          className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-white/60"
                        >
                          Batal
                        </button>
                      </div>
                    ) : item.state === "cancelled" ? (
                      <p className="mt-1 text-xs text-ink-soft">Dibatalkan</p>
                    ) : (
                      <div className="mt-1.5 space-y-2">
                        <p className={cn("flex items-center gap-1.5 text-sm", item.state === "done" ? "text-emerald-800" : "text-red-700")}>
                          {item.state === "done" && <Icon.check className="h-4 w-4 shrink-0" />}
                          {item.result?.message}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.result?.notify && (
                            <a href={item.result.notify.href} target="_blank" rel="noopener noreferrer" className="btn btn-wa px-3.5 py-2 text-xs">
                              <Icon.whatsapp className="h-4 w-4" />
                              {item.result.notify.label}
                            </a>
                          )}
                          {item.result?.href && (
                            <Link href={item.result.href} onClick={closeOnPhone} className="btn btn-outline px-3.5 py-2 text-xs">
                              Buka
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ),
              )
            )}
            {status && (
              <p className="flex items-center gap-2 px-1 text-sm text-ink-soft" aria-live="polite">
                <span className="h-2 w-2 animate-pulse rounded-full bg-navy-500" />
                {status}
              </p>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
            className="shrink-0 border-t border-ink/8 bg-cream-50 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-end gap-2 rounded-[1.4rem] bg-white p-1.5 pl-4 ring-1 ring-ink/10 focus-within:ring-2 focus-within:ring-navy-700">
              <textarea
                ref={input}
                value={draft}
                rows={1}
                maxLength={1500}
                disabled={enabled === false}
                onChange={(event) => {
                  setDraft(event.target.value);
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    send(draft);
                  }
                }}
                placeholder="Tanya atau minta sesuatu…"
                aria-label="Pesan untuk asisten"
                className="max-h-[120px] min-h-10 flex-1 resize-none bg-transparent py-2 text-base leading-relaxed text-ink outline-none placeholder:text-ink-soft/55"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim() || enabled === false}
                aria-label="Kirim"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-700 text-cream-50 transition hover:bg-navy-800 disabled:bg-ink/10 disabled:text-ink-soft/50"
              >
                <Icon.arrowRight className="h-5 w-5 -rotate-90" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
