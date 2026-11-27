"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

import { showToast } from "./toast";

export type StartStep = {
  key: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
  /** Langkah yang tidak bisa dicek otomatis: pengurus menandainya sendiri. */
  confirmable?: boolean;
};

const DISMISSED = "enkg-admin-mulai-disembunyikan";
const COLLAPSED = "enkg-admin-mulai-diciutkan";
const confirmedKey = (key: string) => `enkg-admin-mulai-cek-${key}`;

/**
 * Daftar "Mulai dari sini" di Ringkasan: langkah awal menyiapkan panel,
 * kemajuannya dibaca dari database. Hilang sendiri kalau semua selesai,
 * dan bisa disembunyikan (disimpan di browser ini).
 */
export function GettingStarted({ steps }: { steps: StartStep[] }) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED) === "1");
    setCollapsed(localStorage.getItem(COLLAPSED) === "1");
    setConfirmed(Object.fromEntries(steps.map((step) => [step.key, localStorage.getItem(confirmedKey(step.key)) === "1"])));
    setMounted(true);
  }, [steps]);

  if (!mounted || dismissed) return null;

  const list = steps.map((step) => ({ ...step, done: step.done || Boolean(confirmed[step.key]) }));
  const doneCount = list.filter((step) => step.done).length;
  if (doneCount === list.length) return null;
  const next = list.find((step) => !step.done);

  const toggle = () => {
    localStorage.setItem(COLLAPSED, collapsed ? "0" : "1");
    setCollapsed(!collapsed);
  };

  return (
    <section aria-labelledby="mulai-title" className="mb-8 overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-sun-500/40">
      <div className="flex flex-col gap-4 bg-sun-400/15 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <h2 id="mulai-title" className="font-display text-xl font-bold text-ink">
            Mulai dari sini
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {doneCount} dari {list.length} langkah selesai. Kerjakan berurutan dari atas.
          </p>
          <div
            className="mt-3 h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-white"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={list.length}
            aria-valuenow={doneCount}
            aria-label="Kemajuan langkah awal"
          >
            <div className="h-full rounded-full bg-navy-700 transition-all" style={{ width: `${(doneCount / list.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={toggle} aria-expanded={!collapsed} className="btn btn-outline bg-white px-4 py-2 text-sm">
            {collapsed ? "Tampilkan langkah" : "Ciutkan"}
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(DISMISSED, "1");
              setDismissed(true);
              showToast("Daftar disembunyikan. Bisa ditampilkan lagi dari halaman Panduan.", "info");
            }}
            className="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            Sembunyikan
          </button>
        </div>
      </div>

      {!collapsed && (
        <ol className="divide-y divide-ink/8">
          {list.map((step, index) => {
            const isNext = step.key === next?.key;
            return (
              <li key={step.key} className={cn("flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6", isNext && "bg-cream-50")}>
                <div className="flex min-w-0 flex-1 items-start gap-3.5">
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                      step.done ? "bg-emerald-100 text-emerald-700" : isNext ? "bg-navy-700 text-cream-100" : "bg-cream-100 text-ink-soft",
                    )}
                    aria-hidden="true"
                  >
                    {step.done ? <Icon.check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block text-[15px] font-semibold", step.done ? "text-ink-soft" : "text-ink")}>
                      {step.title}
                      {step.done && <span className="sr-only"> (selesai)</span>}
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">{step.description}</span>
                  </span>
                </div>
                {step.done ? (
                  <span className="shrink-0 pl-12 text-sm font-semibold text-emerald-700 sm:pl-0">Selesai</span>
                ) : (
                  <div className="flex shrink-0 flex-wrap gap-2 pl-12 sm:pl-0">
                    <Link href={step.href} className={cn("btn px-4 py-2 text-sm", isNext ? "btn-navy" : "btn-outline")}>
                      {step.cta}
                      <Icon.arrowRight className="h-4 w-4" />
                    </Link>
                    {step.confirmable && (
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem(confirmedKey(step.key), "1");
                          setConfirmed((current) => ({ ...current, [step.key]: true }));
                        }}
                        className="rounded-full px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50"
                      >
                        Sudah benar
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/** Tombol di halaman Panduan untuk memunculkan lagi daftar "Mulai dari sini". */
export function ShowGettingStarted() {
  return (
    <button
      type="button"
      onClick={() => {
        localStorage.removeItem(DISMISSED);
        localStorage.removeItem(COLLAPSED);
        showToast("Daftar “Mulai dari sini” tampil lagi di Ringkasan.");
      }}
      className="btn btn-outline px-4 py-2.5 text-sm"
    >
      Tampilkan lagi &ldquo;Mulai dari sini&rdquo;
    </button>
  );
}
