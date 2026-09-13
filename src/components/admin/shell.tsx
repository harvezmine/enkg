"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { signOut } from "@/app/actions/auth";
import logo from "@/assets/brand/logo-light.png";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Ringkasan", icon: Icon.layout },
  { href: "/admin/kontak", label: "Contact Us", icon: Icon.inbox },
  { href: "/admin/news", label: "News", icon: Icon.news },
  { href: "/admin/event", label: "Event & ProCon", icon: Icon.calendar },
] as const;

export function AdminShell({ newSubmissions, children }: { newSubmissions: number; children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const badge = (href: string) => href === "/admin/kontak" && newSubmissions > 0;

  return (
    <div className="min-h-dvh lg:flex">
      {/* ── Sidebar (desktop) ─────────────────────────────────────────────── */}
      <aside className="bg-navy-deep hidden w-64 shrink-0 flex-col text-cream-100 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="px-6 pt-7 pb-6">
          <Image src={logo} alt="Every Nation Kelapa Gading" className="h-9 w-auto" />
          <p className="mt-3 text-xs font-semibold tracking-wide text-sun-400">Panel Pengurus</p>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Navigasi admin">
          {NAV.map(({ href, label, icon: NavIcon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(href) ? "bg-white/12 text-cream-100" : "text-cream-100/65 hover:bg-white/6 hover:text-cream-100",
              )}
            >
              <NavIcon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{label}</span>
              {badge(href) && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sun-500 px-1.5 text-[11px] font-bold text-ink">
                  {newSubmissions}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-100/65 transition-colors hover:text-cream-100"
          >
            <Icon.arrowUpRight className="h-[18px] w-[18px]" />
            Lihat situs
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-100/65 transition-colors hover:bg-white/6 hover:text-cream-100"
            >
              <Icon.logout className="h-[18px] w-[18px]" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* ── Konten ────────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-navy-deep sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 text-cream-100 lg:hidden">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="Every Nation Kelapa Gading" className="h-7 w-auto" />
            <span className="text-xs font-semibold text-sun-400">Panel Pengurus</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/" target="_blank" aria-label="Lihat situs" className="grid h-10 w-10 place-items-center rounded-full text-cream-100/70">
              <Icon.arrowUpRight className="h-5 w-5" />
            </Link>
            <form action={signOut}>
              <button type="submit" aria-label="Keluar" className="grid h-10 w-10 place-items-center rounded-full text-cream-100/70">
                <Icon.logout className="h-5 w-5" />
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-10 lg:pb-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>

        {/* Tab bar mobile: mudah dijangkau jempol, menggantikan sidebar */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-cream-50/95 backdrop-blur-xl lg:hidden" aria-label="Navigasi admin mobile">
          <div className="grid grid-cols-4">
            {NAV.map(({ href, label, icon: NavIcon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-semibold transition-colors",
                  isActive(href) ? "text-navy-700" : "text-ink-soft",
                )}
              >
                <span className="relative">
                  <NavIcon className="h-5 w-5" />
                  {badge(href) && (
                    <span className="absolute -top-1.5 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-sun-500 px-1 text-[9px] font-bold text-ink">
                      {newSubmissions}
                    </span>
                  )}
                </span>
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      </div>
    </div>
  );
}
