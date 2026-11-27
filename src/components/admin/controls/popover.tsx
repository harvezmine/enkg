"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

/** true di layar kecil: pilihan dibuka sebagai lembar dari bawah, lebih mudah disentuh. */
export function useIsPhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return phone;
}

/** Tutup saat klik di luar `refs` atau saat Escape ditekan. */
export function useDismiss(open: boolean, refs: RefObject<HTMLElement | null>[], onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (refs.some((ref) => ref.current?.contains(event.target as Node))) return;
      close.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close.current();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, refs]);
}

/**
 * Panel pilihan di bawah (atau di atas, kalau ruang di bawah sempit) tombol
 * pemicunya. Di HP tampil sebagai lembar dari bawah layar dengan latar redup.
 */
export function Popover({
  open,
  anchor,
  panelRef,
  onClose,
  title,
  children,
  className,
  minWidth = 240,
}: {
  open: boolean;
  anchor: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  minWidth?: number;
}) {
  const phone = useIsPhone();
  const [placement, setPlacement] = useState<{ top: number; left: number; width: number; up: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!open || phone) return;
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, minWidth);
      const left = Math.min(rect.left, window.innerWidth - width - 12);
      const below = window.innerHeight - rect.bottom;
      const up = below < 320 && rect.top > below;
      setPlacement({ top: up ? rect.top - 8 : rect.bottom + 8, left: Math.max(12, left), width, up });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, phone, anchor, minWidth]);

  if (!open) return null;

  if (phone) {
    return (
      <div className="fixed inset-0 z-[70]">
        <div className="animate-fade absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
        <div
          ref={panelRef}
          className={cn(
            "animate-sheet absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-hidden rounded-t-3xl bg-cream-50 pb-[env(safe-area-inset-bottom)] shadow-deep",
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-ink/15" aria-hidden="true" />
          {title && <p className="font-display px-5 pt-3 pb-1 text-base font-bold text-ink">{title}</p>}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={
        placement
          ? {
              top: placement.top,
              left: placement.left,
              width: placement.width,
              transform: placement.up ? "translateY(-100%)" : undefined,
            }
          : { visibility: "hidden" }
      }
      className={cn(
        "animate-fade fixed z-[70] overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-ink/10",
        className,
      )}
    >
      {children}
    </div>
  );
}
