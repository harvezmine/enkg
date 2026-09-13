import Image from "next/image";
import type { SVGProps } from "react";

import { schedule } from "@/content/schedule";
import { site } from "@/content/site";
import { formatJakartaDate, formatJakartaTime, nextOccurrence } from "@/lib/schedule";

import { Icon } from "../icons";
import { Parallax } from "../parallax";
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
function RotatingBadge() {
  return (
    <div className="relative grid h-24 w-24 place-items-center rounded-full bg-sun-500 text-ink shadow-lift sm:h-28 sm:w-28">
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
        <span className="font-display text-lg font-semibold tracking-tight whitespace-nowrap sm:text-2xl">{item}</span>
        <span aria-hidden="true" className="text-lg text-navy-700">
          ✦
        </span>
      </li>
    ));

  return (
    <div className="marquee relative overflow-hidden bg-sun-500 py-3.5 text-ink sm:py-5">
      <ul className="animate-marquee flex w-max">
        {row(false)}
        {row(true)}
      </ul>
    </div>
  );
}

export function Hero({ now }: { now: Date }) {
  const service = schedule.find((item) => item.id === "sunday-service")!;
  const next = nextOccurrence(service.recurrence, service.start, now);

  const split = site.headline.lastIndexOf(" dalam");
  const [lead, tail] = [site.headline.slice(0, split), site.headline.slice(split + 1)];

  return (
    <section id="beranda" className="bg-navy-deep relative isolate overflow-hidden text-cream-100">
      <Grain className="opacity-9" />
      <Parallax speed={-14} className="pointer-events-none absolute top-24 -left-64 -z-10 w-[64rem] max-w-none">
        <GlobeLines className="w-full text-white/5" />
      </Parallax>
      <div
        aria-hidden="true"
        className="animate-breathe pointer-events-none absolute -top-48 right-[-10%] -z-10 h-[40rem] w-[40rem] rounded-full bg-navy-500/40 blur-3xl"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pt-32 pb-24 sm:px-8 md:grid-cols-12 md:gap-8 md:pt-36 lg:gap-10 lg:pt-40 lg:pb-32">
        <div className="md:col-span-6 xl:col-span-7">
          <h1 className="text-hero animate-rise font-bold">
            {lead}{" "}
            <span className="font-serif font-normal tracking-normal text-sun-400 italic">{tail}</span>
          </h1>
          <p className="text-lead animate-rise mt-6 text-cream-100/75 [animation-delay:120ms]">{site.taglineId}</p>
          <div className="animate-rise mt-10 flex flex-col gap-3 [animation-delay:220ms] sm:flex-row md:flex-col md:items-start lg:flex-row">
            <a href="#pelayanan" className="btn btn-sun">
              Jadwal ibadah <Icon.arrowRight className="shift h-5 w-5" />
            </a>
            <a href="#news" className="btn btn-light">
              <Icon.play className="h-4 w-4" /> Tonton khotbah
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm sm:max-w-md md:col-span-6 md:max-w-none xl:col-span-5">
          <Parallax speed={-4}>
            <div className="animate-rise relative aspect-4/5 overflow-hidden rounded-[2rem] bg-navy-700 shadow-deep ring-1 ring-white/10 [animation-delay:160ms] lg:aspect-square">
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
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-navy-950/80 to-transparent" />
            </div>
          </Parallax>

          <Parallax speed={8} className="absolute -top-8 -right-3 hidden sm:block xl:-left-10 xl:right-auto">
            <RotatingBadge />
          </Parallax>

          {/* Di layar ≥ xl kartu menumpuk di sudut foto; di bawahnya menempel di bawah foto. */}
          <Parallax speed={4} className="relative z-10 mx-5 -mt-14 sm:mx-10 md:mx-4 lg:mx-8 xl:absolute xl:-bottom-8 xl:-left-14 xl:mx-0 xl:mt-0">
            <div className="animate-rise rounded-3xl bg-cream-50 p-5 text-ink shadow-deep [animation-delay:320ms] sm:p-6 xl:w-72">
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sun-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sun-500" />
                </span>
                Ibadah berikutnya
              </p>
              <p className="font-display mt-2 text-2xl leading-tight font-bold">{formatJakartaDate(next)}</p>
              <p className="mt-1 text-ink-soft">
                <span className="tabular font-semibold text-navy-700">{formatJakartaTime(next)}</span> ·{" "}
                {site.address.venue}
              </p>
            </div>
          </Parallax>
        </div>
      </div>

      <Marquee />
    </section>
  );
}
