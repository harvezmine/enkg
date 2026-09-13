"use client";

import "aos/dist/aos.css";

import { useEffect, useState, type ReactNode } from "react";
import { ParallaxProvider } from "react-scroll-parallax";

/**
 * Menjalankan AOS (animasi saat scroll) dan menyediakan konteks parallax,
 * sama seperti situs Janji Pengharapan (jp/src/components/motion.tsx).
 * Keduanya mati bila perangkat pengguna meminta "kurangi gerakan".
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);

    let cancelled = false;
    // AOS menyentuh `window`, jadi di-import dinamis agar tidak ikut dievaluasi di server.
    import("aos").then(({ default: aos }) => {
      if (cancelled) return;
      aos.init({
        duration: 900,
        easing: "ease-out-cubic",
        once: true,
        offset: 60,
        disable: () => media.matches,
      });
      // Posisi elemen bergeser setelah font & gambar selesai dimuat.
      document.fonts?.ready.then(() => aos.refresh());
      window.addEventListener("load", () => aos.refresh(), { once: true });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return <ParallaxProvider isDisabled={reduceMotion}>{children}</ParallaxProvider>;
}
