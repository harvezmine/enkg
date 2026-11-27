"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { signOut } from "@/app/actions/auth";
import logo from "@/assets/brand/logo-light.png";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

import { Assistant } from "./assistant/assistant";
import { SearchPalette, SearchTrigger } from "./quick-search";
import { Toaster } from "./toast";

/** Ikon tanda tanya dalam lingkaran (Tabler "help-circle"), khusus menu Panduan. */
function HelpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      <path d="M12 16v.01" />
      <path d="M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />
    </svg>
  );
}

type NavItem = { href: string; label: string; short: string; icon: (props: { className?: string }) => ReactNode };

/** Sidebar dikelompokkan: kotak masuk, data jemaat (internal), isi situs, lalu bantuan. */
const NAV_GROUPS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/admin", label: "Ringkasan", short: "Ringkasan", icon: Icon.layout },
      { href: "/admin/kontak", label: "Contact Us", short: "Kontak", icon: Icon.inbox },
    ],
  },
  {
    title: "Jemaat",
    items: [
      { href: "/admin/jemaat", label: "Data jemaat", short: "Jemaat", icon: Icon.addressBook },
      { href: "/admin/life-group", label: "Life Group", short: "Life Group", icon: Icon.home },
      { href: "/admin/pelayanan", label: "Pelayanan", short: "Pelayanan", icon: Icon.heartHandshake },
      { href: "/admin/materi", label: "Materi LG", short: "Materi", icon: Icon.news },
    ],
  },
  {
    title: "Situs",
    items: [
      { href: "/admin/kalender", label: "Kalender", short: "Kalender", icon: Icon.calendar },
      { href: "/admin/news", label: "News", short: "News", icon: Icon.edit },
      { href: "/admin/event", label: "Event & ProCon", short: "Event", icon: Icon.users },
    ],
  },
  {
    title: "Lainnya",
    items: [
      { href: "/admin/pengguna", label: "Pengguna & akses", short: "Pengguna", icon: Icon.lock },
      { href: "/admin/telegram", label: "Bot Telegram", short: "Telegram", icon: Icon.message },
      { href: "/admin/panduan", label: "Panduan", short: "Panduan", icon: HelpIcon },
    ],
  },
];

const NAV = NAV_GROUPS.flatMap((group) => group.items);
/** Tab bar HP hanya muat empat; sisanya ada di menu "Lainnya". */
const MOBILE_TABS = ["/admin", "/admin/kontak", "/admin/jemaat", "/admin/life-group"];

export type ShellUser = {
  name: string;
  email: string;
  /** Nama Life Group kalau admin ini juga leader: tampil jalan ke portal LG-nya. */
  leaderOf: string | null;
};

export function AdminShell({ newSubmissions, user, children }: { newSubmissions: number; user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const badge = (href: string) => href === "/admin/kontak" && newSubmissions > 0;
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const inMore = NAV.some((item) => !MOBILE_TABS.includes(item.href) && isActive(item.href));
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const current = NAV.find((item) => isActive(item.href));

  // Menu "Lainnya" tertutup sendiri setelah pindah halaman.
  useEffect(() => setMoreOpen(false), [pathname]);

  return (
    <div className="min-h-dvh lg:flex">
      {/* ── Sidebar (desktop) ─────────────────────────────────────────────── */}
      <aside className="bg-navy-deep hidden w-64 shrink-0 flex-col text-cream-100 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="px-6 pt-7 pb-5">
          <Link href="/admin" aria-label="Ke Ringkasan">
            <Image src={logo} alt="Every Nation Kelapa Gading" className="h-9 w-auto" />
          </Link>
          <p className="mt-3 text-xs font-semibold tracking-wide text-sun-400">Panel Pengurus</p>
        </div>

        <div className="px-3 pb-4">
          <SearchTrigger variant="sidebar" onOpen={openSearch} />
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Navigasi admin">
          {NAV_GROUPS.map((group, index) => (
            <div key={group.title ?? index}>
              {group.title && <p className="px-3 pb-1.5 text-xs font-semibold text-cream-100/45">{group.title}</p>}
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: NavIcon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
                        active
                          ? "bg-cream-100 font-semibold text-navy-900 shadow-soft"
                          : "font-medium text-cream-100/70 hover:bg-white/8 hover:text-cream-100",
                      )}
                    >
                      <NavIcon className={cn("h-[18px] w-[18px] shrink-0", active && "text-navy-700")} />
                      <span className="flex-1">{label}</span>
                      {badge(href) && (
                        <span
                          className="grid h-5 min-w-5 place-items-center rounded-full bg-sun-500 px-1.5 text-[11px] font-bold text-ink"
                          aria-label={`${newSubmissions} kiriman baru`}
                        >
                          {newSubmissions}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          {user.leaderOf && (
            <Link
              href="/portal"
              className="mb-2 flex items-center gap-3 rounded-xl bg-sun-500 px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-sun-400"
            >
              <Icon.home className="h-[18px] w-[18px] shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block">Portal Life Group</span>
                <span className="block truncate text-xs font-medium text-ink/70">{user.leaderOf}</span>
              </span>
              <Icon.arrowRight className="h-4 w-4 shrink-0" />
            </Link>
          )}
          <Link
            href="/admin/akun"
            className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/8"
            title="Akun saya"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-sun-400">
              <Icon.user className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-cream-100">{user.name}</span>
              <span className="block truncate text-xs text-cream-100/55">{user.email}</span>
            </span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-100/70 transition-colors hover:bg-white/8 hover:text-cream-100"
          >
            <Icon.arrowUpRight className="h-[18px] w-[18px]" />
            Lihat situs
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-100/70 transition-colors hover:bg-white/8 hover:text-cream-100"
            >
              <Icon.logout className="h-[18px] w-[18px]" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* ── Konten ────────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-navy-deep sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-2.5 text-cream-100 lg:hidden">
          <Link href="/admin" className="flex min-w-0 items-center gap-3" aria-label="Ke Ringkasan">
            <Image src={logo} alt="Every Nation Kelapa Gading" className="h-7 w-auto shrink-0" />
            <span className="truncate text-xs font-semibold text-sun-400">{current?.label ?? "Panel Pengurus"}</span>
          </Link>
          <div className="flex shrink-0 items-center">
            <SearchTrigger variant="icon" onOpen={openSearch} />
            <Link href="/admin/panduan" aria-label="Panduan" className="grid h-10 w-10 place-items-center rounded-full text-cream-100/80">
              <HelpIcon className="h-5 w-5" />
            </Link>
            <form action={signOut}>
              <button type="submit" aria-label="Keluar" className="grid h-10 w-10 place-items-center rounded-full text-cream-100/80">
                <Icon.logout className="h-5 w-5" />
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-10 lg:pb-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>

        {/* Tab bar mobile: mudah dijangkau jempol, menggantikan sidebar */}
        {moreOpen && (
          <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu lainnya">
            <button type="button" aria-label="Tutup menu" onClick={() => setMoreOpen(false)} className="animate-fade absolute inset-0 bg-ink/40" />
            <div className="animate-sheet absolute inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] rounded-3xl bg-cream-50 p-2 shadow-deep">
              <div className="grid grid-cols-3 gap-1">
                {[
                  ...(user.leaderOf ? [{ href: "/portal", short: "Portal LG", icon: Icon.home }] : []),
                  ...NAV.filter((item) => !MOBILE_TABS.includes(item.href)),
                  { href: "/admin/akun", short: "Akun saya", icon: Icon.user },
                ].map(({ href, short, icon: NavIcon }) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive(href) ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3.5 text-xs font-semibold transition-colors",
                      isActive(href) ? "bg-navy-700 text-cream-100" : "text-ink-soft hover:bg-cream-100",
                    )}
                  >
                    <NavIcon className="h-5 w-5" />
                    {short}
                  </Link>
                ))}
              </div>
              <a
                href="/"
                target="_blank"
                className="mt-1 flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-semibold text-ink-soft hover:bg-cream-100"
              >
                <Icon.arrowUpRight className="h-4 w-4" />
                Lihat situs
              </a>
            </div>
          </div>
        )}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-cream-50/95 backdrop-blur-xl lg:hidden" aria-label="Navigasi admin mobile">
          <div className="grid grid-cols-5">
            {NAV.filter((item) => MOBILE_TABS.includes(item.href)).map(({ href, short, icon: NavIcon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold transition-colors",
                    active ? "text-navy-800" : "text-ink-soft",
                  )}
                >
                  <span className={cn("relative grid h-8 w-12 place-items-center rounded-full transition-colors", active && "bg-navy-100")}>
                    <NavIcon className="h-5 w-5" />
                    {badge(href) && (
                      <span className="absolute -top-1 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-sun-500 px-1 text-[9px] font-bold text-ink">
                        {newSubmissions}
                      </span>
                    )}
                  </span>
                  <span className="truncate">{short}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={moreOpen}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold transition-colors",
                moreOpen || inMore ? "text-navy-800" : "text-ink-soft",
              )}
            >
              <span className={cn("grid h-8 w-12 place-items-center rounded-full transition-colors", (moreOpen || inMore) && "bg-navy-100")}>
                <Icon.menu className="h-5 w-5" />
              </span>
              <span>Lainnya</span>
            </button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      </div>

      <SearchPalette open={searchOpen} onOpen={openSearch} onClose={closeSearch} />
      <Toaster />
      <Assistant />
    </div>
  );
}
