import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/* Primitif tampilan admin panel, satu gaya dengan situs (navy · krem · kuning). */

export function AdminPageHeader({
  title,
  description,
  backHref,
  action,
}: {
  title: string;
  description?: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-navy-700"
        >
          <Icon.arrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl bg-white shadow-soft ring-1 ring-ink/8", className)}>{children}</div>;
}

const BADGE_TONES = {
  navy: "bg-navy-50 text-navy-700 ring-navy-200",
  sun: "bg-sun-400/20 text-[#7a5a00] ring-sun-500/40",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  gray: "bg-cream-100 text-ink-soft ring-ink/10",
  red: "bg-red-50 text-red-700 ring-red-200",
} as const;

export function Badge({ tone = "navy", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/15 bg-white/60 px-6 py-14 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy-50 text-navy-700">
        <Icon.inbox className="h-5 w-5" />
      </div>
      <p className="font-display mt-4 text-lg font-bold text-ink">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl p-3 text-sm ring-1",
        tone === "error" ? "bg-red-50 text-red-800 ring-red-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200",
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
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="flex items-baseline gap-2 text-sm font-semibold text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-ink-soft">opsional</span>}
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

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select {...props} className={cn(control, "cursor-pointer pr-10", className)}>
      {children}
    </select>
  );
}
