"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition, type ReactNode } from "react";

import { Icon } from "@/components/icons";

/*
 * Tampilan bersama untuk halaman yang sedang dimuat, gagal dimuat, atau tidak
 * ditemukan, di admin panel maupun portal leader. Bahasanya sengaja sederhana:
 * yang membaca pengurus gereja, bukan programmer.
 */

function Bar({ className }: { className: string }) {
  return <div className={`rounded-full bg-ink/8 ${className}`} />;
}

/** Kerangka halaman selama data dimuat, supaya klik terasa langsung ditanggapi. */
export function PageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Sedang memuat halaman…</span>
      <Bar className="h-8 w-52" />
      <Bar className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="rounded-2xl bg-white p-5 ring-1 ring-ink/8">
            <div className="h-10 w-10 rounded-xl bg-ink/8" />
            <Bar className="mt-4 h-7 w-12" />
            <Bar className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/8">
            <div className="h-12 w-12 shrink-0 rounded-full bg-ink/8" />
            <div className="flex-1">
              <Bar className="h-4 w-48 max-w-full" />
              <Bar className="mt-2 h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StateCard({
  title,
  text,
  icon,
  children,
}: {
  title: string;
  text: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-white px-6 py-10 text-center shadow-hair ring-1 ring-ink/[0.07] sm:px-10">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sun-400/25 text-navy-800">{icon}</span>
      <h1 className="font-display mt-5 text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{text}</p>
      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">{children}</div>
    </div>
  );
}

/** Dipakai error.tsx: pesan ramah dan tombol coba lagi. */
export function PageError({
  error,
  reset,
  homeHref,
  homeLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StateCard
      title="Halaman ini belum bisa dibuka"
      text="Coba lagi sebentar. Data kamu aman."
      icon={<Icon.alert className="h-7 w-7" />}
    >
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
        className="btn btn-navy px-5 py-3 text-sm"
      >
        {pending ? "Mencoba…" : "Coba lagi"}
      </button>
      <Link href={homeHref} className="btn btn-outline px-5 py-3 text-sm">
        {homeLabel}
      </Link>
      {error.digest && <p className="mt-3 w-full text-xs text-ink-soft/70 sm:hidden">Kode: {error.digest}</p>}
    </StateCard>
  );
}

/** Dipakai not-found.tsx. */
export function PageNotFound({ homeHref, homeLabel, text }: { homeHref: string; homeLabel: string; text?: string }) {
  return (
    <StateCard
      title="Halaman tidak ditemukan"
      text={text ?? "Mungkin datanya sudah dihapus atau tautannya salah."}
      icon={<Icon.search className="h-7 w-7" />}
    >
      <Link href={homeHref} className="btn btn-navy px-5 py-3 text-sm">
        {homeLabel}
      </Link>
    </StateCard>
  );
}
