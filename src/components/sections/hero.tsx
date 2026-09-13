import Image from "next/image";
import type { SVGProps } from "react";

import { schedule } from "@/content/schedule";
import { site } from "@/content/site";
import { formatJakartaDate, formatJakartaTime, nextOccurrence } from "@/lib/schedule";

import { Icon } from "../icons";
import { Grain } from "../ui";

/** Garis lintang-bujur bergaya globe pada logo Every Nation. */
function GlobeLines(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 800 520" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden="true" {...props}>
      <ellipse cx="400" cy="260" rx="390" ry="250" />
      <ellipse cx="400" cy="260" rx="290" ry="250" />
      <ellipse cx="400" cy="260" rx="170" ry="250" />
      <ellipse cx="400" cy="260" rx="55" ry="250" />
      <path d="M10 260h780M62 135h676M62 385h676M166 60h468M166 460h468" />
    </svg>
  );
}

/** Lencana melingkar berputar pelan. */
function RotatingBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`grid h-28 w-28 place-items-center rounded-full bg-sun-500 text-ink shadow-lift ${className}`}>
      <svg viewBox="0 0 120 120" className="absolute h-full w-full animate-[spin_24s_linear_infinite]" aria-hidden="true">
        <defs>
          <path id="badge-circle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        <text className="fill-ink text-[10.5px] font-semibold tracking-[0.18em] uppercase">
          <textPath href="#badge-circle">Honor God · Make Disciples ·</textPath>
        </text>
      </svg>
      <Icon.arrowUpRight className="h-7 w-7 rotate-90" />
    </div>
  );
}

const MARQUEE = [
  "Honor God",
  "Make Disciples",
  "Ibadah Minggu 10.00 WIB",
  "Kids Church 10.30",
  "Life Group",
  "Prayer Meeting",
  "ProCon",
  "Stream Hall · Mahaka Square",
];

function Marquee() {
  const row = (hidden: boolean) =>
    MARQUEE.map((item, index) => (
      <li key={`${hidden}-${index}`} aria-hidden={hidden || undefined} className="flex items-center gap-8 pr-8">
        <span className="font-display text-xl font-semibold tracking-tight whitespace-nowrap sm:text-2xl">{item}</span>
        <span aria-hidden="true" className="text-lg text-navy-700">✦</span>
      </li>
    ));

  return (
    <div className="marquee relative overflow-hidden bg-sun-500 py-4 text-ink sm:py-5">
      <ul className="animate-marquee flex w-max">
        {row(false)}
        {row(true)}
      </ul>
    </div>
  );
}

export function Hero({ now }: { now: Date }) {
  const service = schedule.find((item) => item.id === "sunday-service")!;
  const prayer = schedule.find((item) => item.id === "sunday-prayer")!;
  const next = nextOccurrence(service.recurrence, service.start, now);

  const split = site.headline.lastIndexOf(" dalam");
  const [lead, tail] = [site.headline.slice(0, split), site.headline.slice(split + 1)];

  return (
    <section id="beranda" className="bg-navy-deep relative isolate overflow-hidden text-cream-100">
      <Grain className="opacity-9" />
      <GlobeLines className="pointer-events-none absolute top-24 -left-64 -z-10 w-[64rem] max-w-none text-white/5" />
      <div aria-hidden="true" className="animate-breathe pointer-events-none absolute -top-48 right-[-10%] -z-10 h-[40rem] w-[40rem] rounded-full bg-navy-500/40 blur-3xl" />

      <div className="mx-auto grid max-w-7xl gap-16 px-5 pt-32 pb-20 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:pt-40 lg:pb-28">
        <div className="lg:col-span-7 lg:pt-6">
          <h1 className="text-hero animate-rise font-bold">
            {lead}{" "}
            <span className="font-serif font-normal tracking-normal text-sun-400 italic">{tail}</span>
          </h1>

          <p className="text-lead animate-rise mt-7 max-w-xl text-cream-100/75 [animation-delay:120ms]">
            Every Nation Kelapa Gading adalah keluarga yang ada untuk menghormati Tuhan dan menjadikan murid. Datang apa
            adanya, kami senang menyambutmu hari Minggu.
          </p>

          <div className="animate-rise mt-10 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <a href="#kontak" className="btn btn-sun">
              Rencanakan kunjungan <Icon.arrowRight className="shift h-5 w-5" />
            </a>
            <a href="#news" className="btn btn-light">
              <Icon.play className="h-4 w-4" /> Tonton khotbah terbaru
            </a>
          </div>

          <dl className="animate-rise mt-12 grid max-w-xl grid-cols-2 gap-6 border-t border-white/10 pt-8 [animation-delay:320ms] sm:grid-cols-3">
            {[
              { label: "Ibadah Minggu", value: "10.00 WIB" },
              { label: "Kids Church", value: "10.30 WIB" },
              { label: "Doa Rabu (Zoom)", value: "20.00 WIB" },
            ].map((fact) => (
              <div key={fact.label}>
                <dt className="text-sm text-cream-100/55">{fact.label}</dt>
                <dd className="font-display tabular mt-1 text-2xl font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div className="animate-rise relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-navy-700 shadow-deep lg:aspect-square ring-1 ring-white/10 [animation-delay:200ms]">
            <Image
              src="/images/photos/preaching-worship.jpg"
              alt="Ps. Raswan Gautama berkhotbah dengan tangan terangkat dalam Ibadah Minggu di Stream Hall"
              fill
              priority
              sizes="(min-width: 1024px) 34rem, 90vw"
              className="object-cover object-[45%_45%] opacity-90 mix-blend-luminosity contrast-125 grayscale"
            />
            <div className="absolute inset-0 bg-navy-700/30 mix-blend-multiply" />
            <div className="absolute inset-x-0 top-0 h-3/5 bg-linear-to-b from-navy-950/90 via-navy-950/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-navy-950/90 via-navy-950/30 to-transparent" />
            <p className="absolute right-6 bottom-6 left-6 text-sm text-cream-100/80 lg:left-auto lg:max-w-[14rem] lg:text-right">
              Ibadah Minggu di {site.address.venue}, Mahaka Square
            </p>
          </div>

          <RotatingBadge className="absolute -top-8 -right-3 hidden sm:grid lg:-left-10 lg:right-auto" />

          <div className="animate-rise relative mx-4 -mt-20 rounded-3xl bg-cream-50 p-6 text-ink shadow-deep [animation-delay:380ms] sm:mx-8 lg:absolute lg:-bottom-10 lg:-left-16 lg:mx-0 lg:mt-0 lg:w-[19rem]">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sun-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sun-500" />
              </span>
              Ibadah berikutnya
            </p>
            <p className="font-display mt-3 text-2xl leading-tight font-bold">{formatJakartaDate(next)}</p>
            <p className="tabular mt-0.5 font-semibold text-navy-700">{formatJakartaTime(next)}</p>
            <div className="mt-4 space-y-2.5 border-t border-ink/10 pt-4 text-sm text-ink-soft">
              <p className="flex gap-2.5">
                <Icon.mapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" />
                <span>
                  <span className="font-semibold text-ink">{site.address.venue}</span> · {site.address.building}
                </span>
              </p>
              <p className="flex gap-2.5">
                <Icon.clock className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" />
                Doa bersama {prayer.start.replace(":", ".")} WIB
              </p>
            </div>
          </div>
        </div>
      </div>

      <Marquee />
    </section>
  );
}
