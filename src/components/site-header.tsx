"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import logo from "@/assets/brand/logo-light.png";
import { navigation, site, whatsappMessages, whatsappUrl } from "@/content/site";

import { Icon } from "./icons";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      if (window.scrollY < 200) setActive("");
      // Halaman ini panjang, jadi pembaca perlu tahu posisinya.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Penanda section aktif: section yang melewati garis tengah layar.
  useEffect(() => {
    const sections = navigation
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const floating = scrolled && !open;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <span
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-0.5 origin-left bg-sun-400 transition-opacity duration-300"
        style={{ transform: `scaleX(${progress})`, opacity: floating ? 1 : 0 }}
      />
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between rounded-full py-2 pr-2 pl-5 transition-all duration-500 ease-out-soft sm:pl-6 ${
          floating
            ? "bg-navy-950/80 shadow-deep ring-1 ring-white/10 backdrop-blur-xl"
            : "bg-transparent ring-1 ring-transparent"
        }`}
      >
        <a href="#beranda" onClick={close} aria-label="Every Nation Kelapa Gading, kembali ke atas" className="relative z-10">
          <Image src={logo} alt="" priority className="h-8 w-auto lg:h-9" />
        </a>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => {
            const isActive = active === item.href.slice(1);
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? "true" : undefined}
                className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors xl:px-4 ${
                  isActive ? "text-cream-100" : "text-cream-100/65 hover:text-cream-100"
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sun-400 transition-all duration-300 ${
                    isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a href="#pelayanan" className="btn btn-sun hidden px-5 py-2.5 text-sm lg:inline-flex">
            Ibadah Minggu
          </a>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="relative z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-cream-100 ring-1 ring-white/15 backdrop-blur lg:hidden"
          >
            {open ? <Icon.close className="h-5 w-5" /> : <Icon.menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="menu-mobile" className="bg-navy-deep animate-rise fixed inset-0 -z-10 flex flex-col px-6 pt-24 pb-8 text-cream-100 [animation-duration:0.45s] lg:hidden">
          <nav aria-label="Navigasi utama" className="flex-1">
            <ol className="space-y-1">
              {navigation.map((item, index) => (
                <li key={item.href}>
                  <a href={item.href} onClick={close} className="group flex items-baseline gap-4 py-2.5">
                    <span className="tabular w-6 text-sm text-sun-400">0{index + 1}</span>
                    <span className="font-display text-4xl font-semibold tracking-tight transition-colors group-hover:text-sun-400">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="space-y-3 border-t border-white/10 pt-6">
            <p className="text-sm text-cream-100/60">
              Ibadah Minggu 10.00 WIB · {site.address.venue}, Mahaka Square
            </p>
            <a
              href={whatsappUrl(whatsappMessages.contact)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa w-full"
            >
              <Icon.whatsapp className="h-5 w-5" /> Chat WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
