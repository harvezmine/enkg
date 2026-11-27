"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tombol "?" kecil yang membuka penjelasan singkat. Bisa diketuk di HP,
 * ditutup dengan Esc atau ketuk di luar.
 *
 *   <HelpTip label="Apa itu status Simpatisan?">
 *     Orang yang rutin datang tapi belum menganggap ENKG gerejanya.
 *   </HelpTip>
 */
export function HelpTip({
  label,
  children,
  className,
}: {
  /** Dibacakan pembaca layar dan tampil sebagai judul penjelasan. */
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<"left" | "right">("left");
  const wrapper = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (event: MouseEvent) => {
    // Kalau HelpTip ditaruh di dalam <label>, jangan sampai klik ikut memfokuskan kolomnya.
    event.preventDefault();
    // Buka ke arah yang masih muat di layar.
    const rect = wrapper.current?.getBoundingClientRect();
    if (rect) setAlign(rect.left > window.innerWidth - 300 ? "right" : "left");
    setOpen((value) => !value);
  };

  return (
    <span ref={wrapper} className={cn("relative inline-flex align-middle", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        className={cn(
          "grid h-6 w-6 place-items-center rounded-full text-xs font-bold transition",
          open ? "bg-navy-700 text-cream-100" : "bg-navy-50 text-navy-700 hover:bg-navy-100",
        )}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className={cn(
            "animate-sheet absolute top-full z-40 mt-2 block w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-4 text-left text-sm leading-relaxed font-normal text-ink shadow-lift ring-1 ring-ink/10",
            align === "left" ? "left-0" : "right-0",
          )}
        >
          <span className="mb-1 block font-semibold text-ink">{label}</span>
          <span className="block text-ink-soft">{children}</span>
        </span>
      )}
    </span>
  );
}
