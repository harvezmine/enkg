import type { ElementType, ReactNode } from "react";

/** Nama animasi AOS untuk tiap varian. Jarak geraknya disetel di globals.css. */
const ANIMATION = {
  up: "fade-up",
  left: "fade-right",
  right: "fade-left",
  scale: "zoom-in-up",
  fade: "fade",
  curtain: "curtain",
} as const;

type RevealProps = {
  children: ReactNode;
  variant?: keyof typeof ANIMATION;
  /** Jeda dalam milidetik, untuk efek berurutan pada grid. Dibulatkan ke kelipatan 50 (batas AOS). */
  delay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Animasi masuk saat scroll lewat AOS (dijalankan components/motion.tsx).
 * Jangan dipakai di hero: konten di atas lipatan harus langsung terlihat.
 */
export function Reveal({ children, variant = "up", delay = 0, as: Tag = "div", className }: RevealProps) {
  const aosDelay = delay > 0 ? Math.min(Math.round(delay / 50) * 50, 3000) : undefined;
  return (
    <Tag data-aos={ANIMATION[variant]} data-aos-delay={aosDelay} className={className}>
      {children}
    </Tag>
  );
}
