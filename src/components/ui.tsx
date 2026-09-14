import type { ReactNode } from "react";

type Tone = "cream" | "navy";

/**
 * Label kecil di atas judul. Tanpa ornamen apa pun: garis aksen pendek sebelum
 * label itu pola template yang terlalu umum. Di sini yang membedakannya huruf
 * kapital berjarak lebar, jadi tiga suara tipografi tetap terpisah jelas:
 * label kapital kecil, judul display, dan aksen serif italic.
 */
export function Eyebrow({ children, tone = "cream", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.2em] ${
        tone === "navy" ? "text-sun-400" : "text-navy-700"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/** Overlay butiran halus untuk section bertekstur. Taruh sebagai anak pertama elemen `relative`. */
export function Grain({ className = "opacity-7" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`bg-grain pointer-events-none absolute inset-0 mix-blend-overlay ${className}`} />
  );
}
