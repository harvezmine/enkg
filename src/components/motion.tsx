"use client";

import "aos/dist/aos.css";

import { useEffect, useState, type ReactNode } from "react";
import { ParallaxProvider } from "react-scroll-parallax";

/** AOS reveals with a readable fallback and live reduced-motion support. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);

    let cancelled = false;
    let refresh = () => {};
    let frame = 0;
    const scheduleRefresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => refresh());
    };

    import("aos")
      .then(({ default: aos }) => {
        if (cancelled) return;
        aos.init({
          duration: 650,
          easing: "ease-out-cubic",
          once: true,
          offset: 40,
        });
        refresh = () => aos.refresh();
        document.documentElement.classList.add("motion-ready");
        document.fonts?.ready.then(() => {
          if (!cancelled) scheduleRefresh();
        });
        scheduleRefresh();
      })
      .catch(() => {
        // Without motion-ready, all content stays visible if AOS cannot load.
        document.documentElement.classList.remove("motion-ready");
      });

    // Accordions and lazy-loaded images change the positions of later sections.
    document.addEventListener("toggle", scheduleRefresh, true);
    document.addEventListener("load", scheduleRefresh, true);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      media.removeEventListener("change", updatePreference);
      document.removeEventListener("toggle", scheduleRefresh, true);
      document.removeEventListener("load", scheduleRefresh, true);
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  return <ParallaxProvider isDisabled={reduceMotion}>{children}</ParallaxProvider>;
}
