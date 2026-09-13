"use client";

import { useState, type ReactNode } from "react";

import { Icon } from "./icons";

/**
 * Pemutar YouTube ringan: yang dirender awalnya hanya "poster" (children),
 * iframe YouTube (~1 MB JavaScript) baru dimuat saat pengunjung menekan putar.
 */
export function LiteYouTube({ src, title, children }: { src: string; title: string; children: ReactNode }) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-ink">
        <iframe
          src={`${src}${src.includes("?") ? "&" : "?"}autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Putar video: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-3xl bg-navy-900 text-left"
    >
      {children}
      <span className="absolute bottom-5 left-5 grid h-14 w-14 place-items-center rounded-full bg-sun-500 text-ink shadow-xl shadow-ink/30 transition duration-300 ease-out-soft group-hover:scale-110 sm:bottom-8 sm:left-8 sm:h-20 sm:w-20">
        <Icon.play className="ml-1 h-6 w-6 sm:h-8 sm:w-8" />
      </span>
    </button>
  );
}
