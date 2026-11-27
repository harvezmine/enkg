"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";

import { Icon } from "@/components/icons";

/*
 * Peringatan "perubahan belum disimpan" untuk form panjang.
 *
 * Cara pakai paling mudah: taruh di dalam <form>, di mana saja.
 *
 *   <form onSubmit={...}>
 *     <UnsavedGuard />
 *     ...
 *   </form>
 *
 * Form jadi "kotor" saat ada event input/change di dalamnya, dan bersih lagi
 * saat dikirim (submit) atau di-reset, jadi setelah menyimpan tidak ada
 * peringatan. Kontrol custom yang mengubah <input type="hidden"> lewat kode
 * perlu memanggil markFormDirty(inputnya) supaya ikut terhitung.
 *
 * Alternatif: <UnsavedGuard formRef={ref} /> untuk form di luar komponen ini,
 * atau <UnsavedGuard when={sudahDiubah} /> untuk mengatur sendiri.
 *
 * Yang dijaga: muat ulang / tutup tab (dialog bawaan browser) dan klik tautan
 * ke halaman lain di situs ini (dialog kita sendiri). Tombol kembali bawaan
 * browser tidak bisa dicegat dengan andal di Next.js, jadi tidak dijaga.
 */

/** Panggil dari kontrol custom setelah mengubah nilai input tersembunyi. */
export function markFormDirty(element: Element | null | undefined) {
  element?.dispatchEvent(new Event("input", { bubbles: true }));
}

export function UnsavedGuard({
  formRef,
  when,
}: {
  formRef?: RefObject<HTMLFormElement | null>;
  /** Kalau diisi, status kotor diatur pemanggil, bukan dari event form. */
  when?: boolean;
}) {
  const anchor = useRef<HTMLSpanElement>(null);
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const active = when ?? dirty;
  const activeRef = useRef(active);
  activeRef.current = active;
  const stayButton = useRef<HTMLButtonElement>(null);

  // Pantau isian form.
  useEffect(() => {
    if (when !== undefined) return;
    const form = formRef?.current ?? anchor.current?.closest("form");
    if (!form) return;
    const mark = (event: Event) => {
      if ((event.target as Element | null)?.closest?.("[data-unsaved-ignore]")) return;
      setDirty(true);
    };
    const clear = () => setDirty(false);
    form.addEventListener("input", mark);
    form.addEventListener("change", mark);
    form.addEventListener("submit", clear);
    form.addEventListener("reset", clear);
    return () => {
      form.removeEventListener("input", mark);
      form.removeEventListener("change", mark);
      form.removeEventListener("submit", clear);
      form.removeEventListener("reset", clear);
    };
  }, [formRef, when]);

  // Muat ulang atau tutup tab.
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);

  // Klik tautan di dalam situs. Dipasang di fase capture supaya jalan sebelum
  // navigasi bawaan <Link> Next.js.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!activeRef.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      setTarget(`${url.pathname}${url.search}${url.hash}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!target) return;
    stayButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTarget(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [target]);

  const leave = () => {
    const href = target!;
    activeRef.current = false;
    setDirty(false);
    setTarget(null);
    router.push(href);
  };

  return (
    <>
      <span ref={anchor} hidden />
      {target && (
        <div className="fixed inset-0 z-[70] grid place-items-end p-3 sm:place-items-center" role="presentation">
          <button type="button" aria-label="Tetap di halaman ini" onClick={() => setTarget(null)} className="animate-fade absolute inset-0 bg-ink/45" />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
            aria-describedby="unsaved-text"
            className="animate-sheet relative w-full max-w-md rounded-3xl bg-cream-50 p-6 shadow-deep"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sun-400/25 text-navy-800">
              <Icon.alert className="h-6 w-6" />
            </span>
            <h2 id="unsaved-title" className="font-display mt-4 text-xl font-bold text-ink">
              Perubahan belum disimpan
            </h2>
            <p id="unsaved-text" className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              Kalau pindah halaman sekarang, isian yang baru kamu ubah akan hilang. Tekan Simpan dulu kalau mau menyimpannya.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={leave} className="btn btn-outline px-5 py-3 text-sm">
                Tinggalkan tanpa simpan
              </button>
              <button ref={stayButton} type="button" onClick={() => setTarget(null)} className="btn btn-navy px-5 py-3 text-sm">
                Tetap di sini
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
