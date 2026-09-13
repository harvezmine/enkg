import Image from "next/image";

import logo from "@/assets/brand/logo-light.png";
import { schedule } from "@/content/schedule";
import { navigation, site, whatsappMessages, whatsappUrl } from "@/content/site";
import { formatJakartaDate, formatJakartaTime, nextOccurrence } from "@/lib/schedule";

import { Icon } from "./icons";
import { Parallax } from "./parallax";
import { Grain } from "./ui";

const socials = [
  { href: site.socials.instagram, label: "Instagram", icon: Icon.instagram },
  { href: site.socials.facebook, label: "Facebook", icon: Icon.facebook },
  { href: site.socials.youtube, label: "YouTube", icon: Icon.youtube },
];

export function SiteFooter({ now }: { now: Date }) {
  const service = schedule.find((item) => item.id === "sunday-service")!;
  const next = nextOccurrence(service.recurrence, service.start, now);

  return (
    <footer className="relative isolate overflow-hidden bg-navy-950 text-cream-100">
      <Grain className="opacity-8" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-120 w-200 max-w-none -translate-x-1/2 rounded-full bg-navy-600/25 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-5 pt-20 sm:px-8 lg:pt-28">
        {/* Ajakan penutup */}
        <div className="flex flex-col gap-8 border-b border-white/10 pb-14 lg:flex-row lg:items-end lg:justify-between lg:pb-20">
          <div>
            <p className="tabular text-sm text-sun-400">
              {formatJakartaDate(next)} · {formatJakartaTime(next)} · {site.address.venue}
            </p>
            <h2 className="text-display mt-4 font-bold">
              Sampai jumpa{" "}
              <span className="font-serif font-normal tracking-normal text-sun-400 italic">hari Minggu.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="#kontak" className="btn btn-sun">
              Hubungi kami <Icon.arrowRight className="shift h-5 w-5" />
            </a>
            <a
              href={whatsappUrl(whatsappMessages.contact)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-light"
            >
              <Icon.whatsapp className="h-5 w-5" /> WhatsApp
            </a>
          </div>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_0.8fr] lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Image src={logo} alt={site.name} className="h-11 w-auto" />
            <p className="font-serif mt-5 text-2xl text-cream-100/85 italic">{site.tagline}</p>
            <ul className="mt-6 flex gap-2.5">
              {socials.map(({ href, label, icon: SocialIcon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/6 text-cream-100/80 ring-1 ring-white/10 transition hover:bg-sun-500 hover:text-ink hover:ring-sun-500"
                  >
                    <SocialIcon className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sun-400">Lokasi</h3>
            <address className="mt-4 leading-relaxed text-cream-100/70 not-italic">
              <span className="font-semibold text-cream-100">{site.address.venue}</span>
              <br />
              {site.address.building}
              <br />
              {site.address.street}, {site.address.city}
            </address>
            <a
              href={site.maps.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
            >
              <span className="link-sweep">Petunjuk arah</span> <Icon.arrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <nav aria-label="Navigasi footer">
            <h3 className="text-sm font-semibold text-sun-400">Jelajahi</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 lg:grid-cols-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="group text-cream-100/70 transition-colors hover:text-cream-100">
                    <span className="link-sweep">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <Parallax speed={-5}>
        <p
          aria-hidden="true"
          className="font-display pointer-events-none mb-[-0.2em] text-center text-[12.5vw] leading-none font-bold tracking-tighter whitespace-nowrap text-white/4 select-none"
        >
          Every Nation
        </p>
      </Parallax>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 pt-6 pb-24 text-sm text-cream-100/50 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pb-6">
          <p>
            © {now.getFullYear()} {site.name}. Bagian dari Every Nation Churches &amp; Ministries.
          </p>
          <a href="#beranda" className="inline-flex items-center gap-1.5 transition-colors hover:text-cream-100">
            Kembali ke atas <Icon.arrowRight className="h-4 w-4 -rotate-90" />
          </a>
        </div>
      </div>
    </footer>
  );
}
