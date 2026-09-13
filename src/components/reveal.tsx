"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  variant?: "up" | "left" | "right" | "scale" | "fade" | "curtain";
  /** Jeda dalam milidetik — untuk efek berurutan pada grid. */
  delay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Scroll reveal tanpa library animasi: satu IntersectionObserver per elemen,
 * dilepas setelah terlihat sekali. Gerakannya CSS ([data-reveal] di
 * globals.css) dan otomatis mati untuk prefers-reduced-motion.
 * Jangan dipakai di hero — konten di atas lipatan harus langsung terlihat.
 */
export function Reveal({ children, variant = "up", delay = 0, as: Tag = "div", className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.visible = "true";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={className}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
