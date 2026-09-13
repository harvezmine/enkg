import type { ReactNode } from "react";

type Tone = "cream" | "navy";

/** Label kecil di atas judul: huruf biasa + garis aksen, bukan ALL CAPS. */
export function Eyebrow({ children, tone = "cream", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <p
      className={`inline-flex items-center gap-3 text-sm font-semibold ${
        tone === "navy" ? "text-sun-400" : "text-navy-700"
      } ${className}`}
    >
      <span aria-hidden="true" className={`h-px w-8 ${tone === "navy" ? "bg-sun-400" : "bg-navy-700"}`} />
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
