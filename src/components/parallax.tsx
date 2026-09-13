"use client";

import type { ReactNode } from "react";
import { Parallax as ScrollParallax } from "react-scroll-parallax";

/**
 * Pembungkus react-scroll-parallax supaya bisa dipakai dari server component.
 * `speed` negatif bergerak lebih lambat dari scroll (terasa jauh di belakang),
 * positif lebih cepat (terasa dekat). Kisaran yang enak: -12 sampai 12.
 */
export function Parallax({
  speed = -8,
  className,
  children,
}: {
  speed?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ScrollParallax speed={speed} className={className}>
      {children}
    </ScrollParallax>
  );
}
