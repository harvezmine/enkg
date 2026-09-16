"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { site } from "@/content/site";

import { Icon } from "./icons";

/**
 * QRIS sengaja disembunyikan di balik satu tombol. Gambarnya tinggi dan penuh
 * detail; kalau ditaruh langsung di kartu, dia yang jadi isi section Give,
 * padahal kebanyakan orang tetap transfer lewat rekening di atasnya.
 */
export function QrisDialog() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // Fokus dikembalikan ke tombol pemanggil, bukan dilepas ke atas halaman.
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return close();
      if (event.key !== "Tab") return;
      // Tab dikurung di dalam dialog: kalau lolos, pengguna keyboard berpindah ke
      // halaman di belakang yang sedang tertutup dan tidak tahu harus kembali ke mana.
      const stops = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button");
      if (!stops?.length) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const dialog = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qris-title"
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={close}
        className="animate-fade absolute inset-0 cursor-default bg-navy-950/85 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        className="animate-sheet relative flex max-h-full w-full max-w-sm flex-col overflow-y-auto rounded-[1.75rem] bg-cream-50 p-5 text-ink shadow-deep sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-navy-700 uppercase">QRIS</p>
            <h3 id="qris-title" className="font-display mt-1.5 text-xl leading-tight font-bold">
              {site.give.accountName}
            </h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Tutup QRIS"
            className="-mt-1 -mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-ink"
          >
            <Icon.close className="h-5 w-5" />
          </button>
        </div>

        {/* Gambarnya sudah punya bingkai birunya sendiri, jadi di sini cukup
            dialasi krem gelap tipis supaya tepi putihnya tidak lebur ke kartu. */}
        <div className="mt-5 rounded-2xl bg-cream-200/70 p-2.5">
          <Image
            src={site.give.qris.src}
            alt={`Kode QRIS persembahan ${site.give.accountName}`}
            width={site.give.qris.width}
            height={site.give.qris.height}
            sizes="(min-width: 640px) 360px, 80vw"
            className="w-full rounded-xl"
          />
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink-soft">
          Pindai dengan aplikasi bank atau dompet digital apa pun yang mendukung QRIS.
        </p>
        <a
          href={site.give.qris.src}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-2 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-navy-700"
        >
          <span className="link-sweep">Buka gambar penuh</span>
          <Icon.arrowUpRight className="lift h-4 w-4" />
        </a>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-sun w-full sm:w-auto"
      >
        <Icon.qr className="h-5 w-5" /> Beri lewat QRIS
      </button>
      {/* Dirender ke <body>: kartu Give dibungkus Reveal, dan transform dari AOS
          bikin position:fixed terkurung di dalam kartu, bukan menutup layar. */}
      {open && mounted && createPortal(dialog, document.body)}
    </>
  );
}
