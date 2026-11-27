import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Icon } from "@/components/icons";
import { HelpTip } from "./help-tip";
import { cn } from "@/lib/utils";

/* Primitif tampilan admin panel, satu gaya dengan situs (navy · krem · kuning). */

export function AdminPageHeader({
  title,
  description,
  backHref,
  action,
}: {
  title: string;
  /** Satu baris pendek saja, biasanya hitungan ("12 orang · 3 tim"). */
  description?: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {backHref && (
        <Link
          href={backHref}
          className="-ml-2 mb-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-ink-soft transition-colors hover:text-navy-700"
        >
          <Icon.arrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight font-bold tracking-tight text-ink sm:text-[1.75rem]">{title}</h1>
          {description && <p className="tabular mt-1 max-w-2xl text-sm text-ink-soft">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/** Judul bagian di dalam halaman, opsional dengan tautan kecil di kanan. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex min-h-10 items-center justify-between gap-4">
      <h2 className="font-display text-lg font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl bg-white shadow-hair ring-1 ring-ink/[0.07]", className)}>{children}</div>;
}

const BADGE_TONES = {
  navy: "bg-navy-50 text-navy-700",
  sun: "bg-sun-400/25 text-[#6b4f00]",
  green: "bg-emerald-50 text-emerald-700",
  gray: "bg-cream-100 text-ink-soft",
  red: "bg-red-50 text-red-700",
} as const;

export function Badge({ tone = "navy", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/60 px-6 py-12 text-center">
      <p className="font-semibold text-ink-soft">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm",
        tone === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800",
      )}
    >
      {tone === "error" ? <Icon.alert className="mt-0.5 h-4 w-4 shrink-0" /> : <Icon.check className="mt-0.5 h-4 w-4 shrink-0" />}
      {children}
    </p>
  );
}

/* ── Form ─────────────────────────────────────────────────────────────────── */

const control =
  "w-full rounded-xl border border-ink/12 bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-soft/50 hover:border-ink/25 focus:border-navy-700 focus:ring-4 focus:ring-navy-700/10 disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  optional,
  help,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  optional?: boolean;
  /** Penjelasan lebih panjang di balik tombol "?" di samping label. */
  help?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-semibold text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-ink-soft">opsional</span>}
        {help && <HelpTip label={`Penjelasan ${label.toLowerCase()}`}>{help}</HelpTip>}
      </label>
      {hint && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(control, className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(control, "min-h-36 resize-y leading-relaxed", className)} />;
}

/** Bagian yang jarang perlu diubah, dilipat supaya form utama tetap sederhana. */
export function Advanced({ title = "Pengaturan lanjutan", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl bg-cream-100/70 open:p-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-ink-soft group-open:mb-3 group-open:min-h-0 group-open:p-0 hover:text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <Icon.chevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4">{children}</div>
    </details>
  );
}

/** Kontrol custom (dropdown, tanggal, jam, angka) pengganti kontrol bawaan browser. */
export { Select } from "./controls/select";
export { DateInput, DateTimeInput, NumberInput, TimeInput } from "./controls/date-time";
export { RichEditor } from "./controls/rich-editor";
