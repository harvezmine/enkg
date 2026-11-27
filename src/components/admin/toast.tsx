"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * Notifikasi kecil ("toast") untuk admin panel.
 *
 *   showToast("Tersimpan.")                     // dari komponen klien mana pun
 *   showToast("Gagal menyimpan.", "error")
 *
 * <Toaster /> dipasang sekali di AdminShell. Ia juga membaca ?saved=,
 * ?deleted=, dan ?assigned= di alamat halaman, jadi halaman yang dialihkan
 * setelah menyimpan otomatis menampilkan konfirmasi yang sama di mana pun.
 */

export type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };

const EVENT = "enkg-admin-toast";
const DURATION_MS = 4500;

export function showToast(message: string, tone: ToastTone = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, tone } }));
}

/** Pesan untuk parameter alamat yang dipakai halaman admin setelah menyimpan. */
export function messageForParams(params: URLSearchParams): { message: string; tone: ToastTone } | null {
  const saved = params.get("saved");
  if (saved) return { message: saved === "keluarga" ? "Anggota keluarga tersimpan." : "Tersimpan.", tone: "success" };
  if (params.get("deleted")) return { message: "Sudah dihapus.", tone: "success" };
  if (params.get("assigned")) return { message: "Sudah dimasukkan ke Life Group.", tone: "success" };
  return null;
}

function UrlToasts({ onShow }: { onShow: (message: string, tone: ToastTone) => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const key = `${pathname}?${params.toString()}`;
    if (shown.current === key) return;
    shown.current = key;
    const found = messageForParams(new URLSearchParams(params.toString()));
    if (found) onShow(found.message, found.tone);
  }, [pathname, params, onShow]);

  return null;
}

const TONE: Record<ToastTone, { box: string; icon: typeof Icon.check }> = {
  success: { box: "bg-navy-900 text-cream-100", icon: Icon.check },
  error: { box: "bg-red-700 text-white", icon: Icon.alert },
  info: { box: "bg-ink text-cream-100", icon: Icon.alert },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, tone: ToastTone) => {
    const id = nextId.current++;
    // Pesan yang sama tidak ditumpuk dua kali.
    setItems((current) => [...current.filter((item) => item.message !== message), { id, message, tone }].slice(-3));
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), DURATION_MS);
  }, []);

  useEffect(() => {
    const listener = (event: Event) => {
      const { message, tone } = (event as CustomEvent<{ message: string; tone: ToastTone }>).detail;
      push(message, tone);
    };
    window.addEventListener(EVENT, listener);
    return () => window.removeEventListener(EVENT, listener);
  }, [push]);

  return (
    <>
      <Suspense fallback={null}>
        <UrlToasts onShow={push} />
      </Suspense>
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 lg:inset-x-auto lg:right-8 lg:bottom-8 lg:items-end"
      >
        {items.map((item) => {
          const { box, icon: ToneIcon } = TONE[item.tone];
          return (
            <div
              key={item.id}
              role={item.tone === "error" ? "alert" : "status"}
              className={cn(
                "animate-sheet pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl py-3 pr-2 pl-4 text-sm font-medium shadow-deep",
                box,
              )}
            >
              <ToneIcon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.message}</span>
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                aria-label="Tutup pemberitahuan"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full opacity-70 transition hover:bg-white/10 hover:opacity-100"
              >
                <Icon.close className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
