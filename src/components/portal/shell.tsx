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
  { href: "/portal", label: "Beranda", icon: Icon.layout },
  { href: "/portal/anggota", label: "Anggota", icon: Icon.users },
  { href: "/portal/pertemuan", label: "Pertemuan", icon: Icon.calendar },
  { href: "/portal/materi", label: "Materi", icon: Icon.news },
  { href: "/portal/akun", label: "Akun", icon: Icon.user },
] as const;

/**
 * Kerangka portal leader. Di HP navigasinya tab bar bawah (mudah dijangkau
 * jempol); di layar lebar pindah ke header. Saat password sementara masih
 * dipakai, navigasi disembunyikan karena semua halaman lain dialihkan dulu.
 */
export function PortalShell({
  groupName,
  leaderName,
  locked,
  isAdmin = false,
  children,
}: {
  groupName: string;
  leaderName: string;
  locked: boolean;
  /** Leader ini juga admin: tampilkan jalan balik ke admin panel. */
  isAdmin?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/portal" ? pathname === "/portal" : pathname.startsWith(href));

  return (
    <div className="min-h-dvh">
      <header className="bg-navy-deep sticky top-0 z-30 text-cream-100">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:py-4">
          <Link href="/portal" className="flex min-w-0 items-center gap-3">
            <Image src={logo} alt="Every Nation Kelapa Gading" className="h-7 w-auto shrink-0 lg:h-8" priority />
            <span className="min-w-0 border-l border-white/15 pl-3">
              <span className="block truncate text-sm font-semibold">{groupName}</span>
              <span className="block truncate text-xs text-cream-100/60">{leaderName}</span>
            </span>
          </Link>

          {!locked && (
            <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Navigasi portal">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive(href) ? "bg-white/12 text-cream-100" : "text-cream-100/65 hover:text-cream-100",
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {isAdmin && !locked && (
            <Link
              href="/admin"
              className="ml-auto inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-sun-500 px-3.5 text-xs font-semibold text-ink transition hover:bg-sun-400 lg:ml-2"
            >
              <Icon.layout className="h-4 w-4" />
              Admin panel
            </Link>
          )}
          <form action={signOut} className={cn(locked || isAdmin ? "ml-1" : "ml-auto lg:ml-2", locked && "ml-auto")}>
            <button
              type="submit"
              aria-label="Keluar"
              className="grid h-10 w-10 place-items-center rounded-full text-cream-100/70 transition hover:bg-white/8 hover:text-cream-100"
            >
              <Icon.logout className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 lg:py-10 lg:pb-12">{children}</main>

      {!locked && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-cream-50/95 backdrop-blur-xl lg:hidden"
          aria-label="Navigasi portal mobile"
        >
          <div className="grid grid-cols-5">
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
                <NavIcon className="h-5 w-5" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      )}
    </div>
  );
}
