import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import logo from "@/assets/brand/logo-navy.png";
import { site, whatsappMessages, whatsappUrl } from "@/content/site";

import { Icon } from "./icons";
import { Grain } from "./ui";

/**
 * Kerangka halaman detail News dan event. Header situs utama memakai tautan
 * #section yang hanya berlaku di beranda, jadi halaman detail punya header ringkas.
 */
export function ArticleShell({ backHref = "/#news", children }: { backHref?: string; children: ReactNode }) {
  return (
    <>
      <a
        href="#konten"
        className="sr-only z-60 rounded-full bg-sun-500 px-5 py-3 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Lewati ke konten
      </a>
      <header className="sticky top-0 z-40 border-b border-ink/8 bg-cream-100/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link href="/" aria-label={`${site.name}, ke beranda`}>
            <Image src={logo} alt="" className="h-8 w-auto sm:h-9" priority />
          </Link>
          <Link
            href={backHref}
            className="group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
          >
            <Icon.arrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Kembali ke beranda
          </Link>
        </div>
      </header>

      <main id="konten">{children}</main>

      <footer className="bg-navy-deep relative isolate overflow-hidden px-5 py-14 text-cream-100 sm:px-8">
        <Grain className="opacity-8" />
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-2xl font-bold text-balance sm:text-3xl">Mari bertumbuh bersama di ENKG.</p>
            <p className="mt-2 text-cream-100/65">Ibadah setiap Minggu di {site.address.building}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/#kontak" className="btn btn-sun">
              Hubungi kami
            </Link>
            <a href={whatsappUrl(whatsappMessages.contact)} target="_blank" rel="noopener noreferrer" className="btn btn-light">
              <Icon.whatsapp className="h-5 w-5" /> WhatsApp
            </a>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-sm text-cream-100/50">
          © {new Date().getFullYear()} {site.name}
        </p>
      </footer>
    </>
  );
}
