import { schedule } from "@/content/schedule";
import { site } from "@/content/site";
import { formatJakartaDate, formatJakartaTime, nextOccurrence } from "@/lib/schedule";

import { Icon } from "../icons";
import { Parallax } from "../parallax";
import { Grain } from "../ui";

/** Vector artwork stays crisp at every screen size. */
function LightWindow() {
  return (
    <div className="hero-window relative mx-auto w-full max-w-[25rem]" aria-hidden="true">
      <svg viewBox="0 0 440 510" fill="none" className="h-auto w-full">
        <defs>
          <linearGradient id="window-light" x1="220" y1="40" x2="220" y2="490" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff5d6" />
            <stop offset="0.52" stopColor="#e9bc68" />
            <stop offset="1" stopColor="#c98749" />
          </linearGradient>
          <linearGradient id="window-floor" x1="220" y1="340" x2="220" y2="510" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f4ce8c" stopOpacity="0.25" />
            <stop offset="1" stopColor="#f4ce8c" stopOpacity="0" />
          </linearGradient>
          <clipPath id="window-arch">
            <path d="M80 350V185a140 140 0 0 1 280 0v165Z" />
          </clipPath>
        </defs>
        <path
          d="M49 355V185a171 171 0 0 1 342 0v170M25 355V185a195 195 0 0 1 390 0v170"
          stroke="#fcf4e4"
          strokeOpacity=".15"
        />
        <g clipPath="url(#window-arch)">
          <path d="M80 45h280v305H80z" fill="url(#window-light)" />
          <circle cx="290" cy="132" r="66" fill="#fff8e3" fillOpacity=".55" />
          <path d="M65 319c78-64 141-65 310-17v70H65Z" fill="#be844b" fillOpacity=".45" />
          <path d="M72 345c92-49 180-49 296-12v35H72Z" fill="#956939" fillOpacity=".35" />
          <path d="M212 40h16v312h-16z" fill="#142f50" />
          <path d="M76 175h290v14H76z" fill="#142f50" />
        </g>
        <path d="M80 355h132l-23 150H5L80 355Zm148 0h132l75 150H251l-23-150Z" fill="url(#window-floor)" />
        <path d="M65 355h310" stroke="#fcf4e4" strokeOpacity=".4" />
        <path d="M5 405h430M5 455h430" stroke="#fcf4e4" strokeOpacity=".06" />
      </svg>
      <p className="absolute inset-x-0 bottom-2 hidden text-center font-serif text-xl md:block italic text-cream-100/70">
        Honor God. Make Disciples.
      </p>
    </div>
  );
}

export function Hero({ now }: { now: Date }) {
  const service = schedule.find((item) => item.id === "sunday-service")!;
  const next = nextOccurrence(service.recurrence, service.start, now);

  return (
    <section id="beranda" className="hero-surface relative isolate overflow-hidden text-cream-100">
      <Grain className="opacity-5" />
      <div className="relative mx-auto max-w-7xl px-5 pt-32 sm:px-8 sm:pt-40 lg:pt-44">
        <div className="grid items-center gap-6 pb-10 md:grid-cols-12 md:gap-6 lg:pb-20">
          <div className="relative z-10 md:col-span-7">
            <h1 className="hero-heading animate-rise font-semibold">
              Bertumbuh
              <br />
              bersama
              <br />
              <span className="font-serif font-normal tracking-normal text-sun-300 italic">dalam iman.</span>
            </h1>
            <p className="animate-rise mt-7 max-w-[27rem] text-base leading-relaxed text-cream-100/75 [animation-delay:100ms] sm:text-lg">
              Mengenal Kristus. Menemukan keluarga.
              <br className="hidden sm:block" /> Menjalani kehidupan bersama.
            </p>
            <div className="animate-rise mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 [animation-delay:200ms]">
              <a href="#pelayanan" className="btn btn-sun">
                Jadwal ibadah <Icon.arrowRight className="shift h-4 w-4" />
              </a>
              <a href="#news" className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                <Icon.play className="h-4 w-4 text-sun-300" />
                <span className="link-sweep">Tonton khotbah</span>
              </a>
            </div>
          </div>
          <Parallax speed={-5} className="mx-auto w-full max-w-[10rem] md:col-span-5 md:max-w-none">
            <div className="animate-rise [animation-delay:150ms]">
              <LightWindow />
            </div>
          </Parallax>
        </div>
        <div className="relative grid gap-6 border-t border-cream-100/20 py-7 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_auto] lg:items-center lg:gap-10">
          <div className="flex items-start gap-4">
            <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20">
              <Icon.calendar className="h-4 w-4 text-sun-300" />
            </span>
            <div>
              <p className="text-xs text-cream-100/60">Ibadah Minggu berikutnya</p>
              <p className="mt-1 text-base font-semibold">
                {formatJakartaDate(next)}{" "}
                <span className="whitespace-nowrap text-sun-300">· {formatJakartaTime(next)}</span>
              </p>
            </div>
          </div>
          <a href={site.maps.link} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4">
            <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20">
              <Icon.mapPin className="h-4 w-4 text-sun-300" />
            </span>
            <div>
              <p className="text-xs text-cream-100/60">{site.address.building}</p>
              <p className="mt-1 flex items-center gap-2 text-base font-semibold">
                {site.address.venue}{" "}
                <Icon.arrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </p>
            </div>
          </a>
          <a href="#siapa-kita" className="group hidden min-h-11 items-center gap-3 text-sm text-cream-100/70 lg:flex">
            Kenali kami <Icon.arrowRight className="h-4 w-4 rotate-90 transition-transform group-hover:translate-y-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
