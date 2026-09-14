import type { ReactNode } from "react";

import { Reveal } from "./reveal";
import { Eyebrow, Grain } from "./ui";

type Tone = "cream" | "navy";

const BACKGROUND = {
  cream: "bg-paper text-ink edge-top-soft",
  light: "bg-cream-50 text-ink edge-top-soft",
  navy: "bg-navy-deep text-cream-100 edge-top",
} as const;

export function Section({
  id,
  tone = "cream",
  className = "",
  children,
}: {
  id: string;
  /** "light" = krem lebih terang, untuk membedakan dua section krem yang bersebelahan. */
  tone?: keyof typeof BACKGROUND;
  className?: string;
  children: ReactNode;
}) {
  const toneClass = BACKGROUND[tone];
  return (
    <section
      id={id}
      className={`relative isolate overflow-hidden px-5 pt-24 pb-28 sm:px-8 lg:pt-32 lg:pb-36 ${toneClass} ${className}`}
    >
      <Grain className={tone === "navy" ? "opacity-9" : "opacity-5"} />
      <div className="relative mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = "cream",
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: Tone;
  align?: "left" | "center";
}) {
  // Bertahap: label, judul, lalu intro. Jeda pendek supaya terasa satu gerakan.
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <Reveal>
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      </Reveal>
      <Reveal delay={50}>
        <h2 className="text-headline mt-5 font-bold">{title}</h2>
      </Reveal>
      {intro && (
        <Reveal delay={100}>
          <p className={`text-lead mt-5 ${tone === "navy" ? "text-cream-100/70" : "text-ink-soft"}`}>{intro}</p>
        </Reveal>
      )}
    </div>
  );
}
