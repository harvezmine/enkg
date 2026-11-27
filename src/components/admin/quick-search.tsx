"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Halaman & tindakan yang bisa dicari. `keywords` memuat sebutan sehari-hari. */
const PAGES = [
  { href: "/admin", label: "Ringkasan", keywords: "beranda dashboard awal mulai" },
  { href: "/admin/jemaat/baru", label: "Tambah jemaat baru", keywords: "jemaat baru tambah orang daftar input data" },
  { href: "/admin/jemaat", label: "Data jemaat", keywords: "jemaat anggota orang daftar nama cari" },
  { href: "/admin/jemaat/impor", label: "Impor data jemaat dari Excel", keywords: "excel impor import upload unggah banyak sekaligus spreadsheet" },
  { href: "/admin/jemaat-excel/ekspor", label: "Unduh semua data jemaat (Excel)", keywords: "ekspor export unduh download backup excel" },
  { href: "/admin/kontak", label: "Kiriman Contact Us", keywords: "kontak pesan doa permohonan pendaftaran kiriman form" },
  { href: "/admin/life-group", label: "Life Group", keywords: "lg komsel kelompok jemaat baru antrean leader" },
  { href: "/admin/life-group?baru=1", label: "Buat Life Group baru", keywords: "lg tambah grup baru" },
  { href: "/admin/pelayanan", label: "Pelayanan", keywords: "pelayan tim musisi usher singer multimedia" },
  { href: "/admin/materi", label: "Materi Life Group", keywords: "materi booklet pdf bahan lg" },
  { href: "/admin/kalender", label: "Kalender & jadwal", keywords: "jadwal ibadah doa kalender minggu" },
  { href: "/admin/news", label: "News", keywords: "berita kabar artikel tulisan" },
  { href: "/admin/news/baru", label: "Tulis news baru", keywords: "berita kabar artikel tulis baru" },
  { href: "/admin/event", label: "Event & ProCon", keywords: "acara event procon kegiatan" },
  { href: "/admin/telegram", label: "Bot Telegram", keywords: "telegram bot pengingat notifikasi" },
  { href: "/admin/panduan", label: "Panduan pemakaian", keywords: "panduan bantuan cara tolong help tutorial" },
] as const;

/** Yang ditampilkan sebelum mengetik: hal yang paling sering dicari. */
const STARTERS = ["/admin/jemaat/baru", "/admin/jemaat/impor", "/admin/life-group", "/admin/kontak", "/admin/panduan"];

type Result = { key: string; href: string; label: string; detail?: string; kind: "jemaat" | "halaman" };

const fold = (value: string) =>
  value
    .toLocaleLowerCase("id")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function pageResults(query: string): Result[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const pages = words.length
    ? PAGES.filter((page) => words.every((word) => fold(`${page.label} ${page.keywords}`).includes(word)))
    : PAGES.filter((page) => STARTERS.includes(page.href));
  return pages.slice(0, 6).map((page) => ({ key: page.href, href: page.href, label: page.label, kind: "halaman" }));
}

/** Pemicu pencarian: kotak di sidebar (desktop) atau ikon di header (HP). */
export function SearchTrigger({ variant, onOpen }: { variant: "sidebar" | "icon"; onOpen: () => void }) {
  if (variant === "icon") {
    return (
      <button type="button" onClick={onOpen} aria-label="Cari" className="grid h-10 w-10 place-items-center rounded-full text-cream-100/80">
        <Icon.search className="h-5 w-5" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2.5 rounded-xl bg-white/8 px-3 py-2.5 text-left text-sm text-cream-100/70 ring-1 ring-white/10 transition hover:bg-white/12 hover:text-cream-100"
    >
      <Icon.search className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1">Cari nama atau menu…</span>
      <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 font-sans text-[11px] text-cream-100/60">/</kbd>
    </button>
  );
}

/**
 * Jendela pencarian cepat: nama jemaat dan halaman admin. Dibuka dengan
 * tombol di sidebar/header, tombol "/" atau Ctrl/Cmd+K.
 */
export function SearchPalette({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const router = useRouter();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  // Pintasan keyboard: "/" (bukan saat mengetik di kolom lain) dan Ctrl/Cmd+K.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable=true]");
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        onOpen();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpen]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setPeople([]);
    setActive(0);
    const frame = requestAnimationFrame(() => input.current?.focus());
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Cari jemaat ke server, dengan jeda supaya tidak mengirim tiap huruf.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setPeople([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/admin/cari?q=${encodeURIComponent(q)}`, { signal: controller.signal, redirect: "manual" });
        const json = res.ok ? ((await res.json()) as { people: { id: string; name: string; detail: string }[] }) : { people: [] };
        setPeople(
          json.people.map((person) => ({
            key: person.id,
            href: `/admin/jemaat/${person.id}`,
            label: person.name,
            detail: person.detail,
            kind: "jemaat" as const,
          })),
        );
      } catch {
        // Dibatalkan karena pengguna masih mengetik.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const pages = useMemo(() => pageResults(query), [query]);
  const results = [...people, ...pages];

  useEffect(() => setActive(0), [query, people.length]);

  if (!open) return null;

  const go = (result: Result | undefined) => {
    if (!result) return;
    onClose();
    if (result.href.startsWith("/admin/jemaat-excel/")) window.location.href = result.href;
    else router.push(result.href);
  };

  const section = (title: string, items: Result[], offset: number) =>
    items.length > 0 && (
      <div>
        <p className="px-3 pt-3 pb-1.5 text-xs font-semibold text-ink-soft">{title}</p>
        <ul role="presentation">
          {items.map((result, index) => {
            const position = offset + index;
            return (
              <li
                key={result.key}
                id={`${listId}-${position}`}
                role="option"
                aria-selected={position === active}
                onMouseEnter={() => setActive(position)}
                onClick={() => go(result)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                  position === active ? "bg-navy-700 text-cream-100" : "text-ink hover:bg-cream-100",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                    position === active ? "bg-white/15" : "bg-navy-50 text-navy-700",
                  )}
                >
                  {result.kind === "jemaat" ? <Icon.user className="h-4 w-4" /> : <Icon.arrowRight className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{result.label}</span>
                  {result.detail && (
                    <span className={cn("block truncate text-xs", position === active ? "text-cream-100/75" : "text-ink-soft")}>
                      {result.detail}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Pencarian cepat">
      <button type="button" aria-label="Tutup pencarian" onClick={onClose} className="animate-fade absolute inset-0 bg-ink/45" />
      <div className="animate-sheet relative mx-3 mt-3 overflow-hidden rounded-3xl bg-cream-50 shadow-deep sm:mx-auto sm:mt-[12vh] sm:max-w-xl">
        <div className="flex items-center gap-3 border-b border-ink/8 px-4">
          <Icon.search className="h-5 w-5 shrink-0 text-ink-soft" />
          <input
            ref={input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((index) => Math.min(index + 1, results.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                go(results[active]);
              } else if (event.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Ketik nama jemaat atau menu"
            className="h-16 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-soft/60"
          />
          <button type="button" onClick={onClose} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-cream-100">
            Tutup
          </button>
        </div>

        <div id={listId} role="listbox" aria-label="Hasil pencarian" className="max-h-[60vh] overflow-y-auto p-2 pb-3">
          {section("Jemaat", people, 0)}
          {section(query.trim() ? "Menu" : "Yang sering dibuka", pages, people.length)}
          {loading && <p className="px-3 py-3 text-sm text-ink-soft">Mencari jemaat…</p>}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm leading-relaxed text-ink-soft">
              Tidak ada yang cocok dengan &ldquo;{query.trim()}&rdquo;.
              <br />
              Coba nama panggilan, wilayah, atau nomor WA.
            </p>
          )}
        </div>

        <p className="hidden border-t border-ink/8 px-4 py-2.5 text-xs text-ink-soft sm:block">
          Pakai tombol panah untuk memilih, Enter untuk membuka, Esc untuk menutup.
        </p>
      </div>
    </div>
  );
}
