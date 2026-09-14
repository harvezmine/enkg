import { schedule } from "@/content/schedule";
import { site } from "@/content/site";
import { formatJakartaDate, formatJakartaTime, nextOccurrence } from "@/lib/schedule";

import { Icon } from "../icons";
import { Grain } from "../ui";
import { HeroBackdrop } from "./hero-backdrop";

export function Hero({ now }: { now: Date }) {
  const service = schedule.find((item) => item.id === "sunday-service")!;
  const next = nextOccurrence(service.recurrence, service.start, now);

  return (
    <section id="beranda" className="hero-surface relative isolate overflow-hidden text-cream-100">
      <Grain className="opacity-5" />
      <HeroBackdrop />

      <div className="relative mx-auto max-w-7xl px-5 pt-36 pb-16 sm:px-8 sm:pt-44 lg:pt-52 lg:pb-24">
        <h1 className="hero-heading animate-rise font-semibold">
          Satu gereja,
          <br />
          satu keluarga
          <br />
          <span className="font-serif font-normal tracking-normal text-sun-300 italic">dari setiap bangsa.</span>
        </h1>
        <p className="animate-rise mt-8 max-w-xl text-lead text-cream-100/75 [animation-delay:100ms]">
          Kami datang dari banyak latar dan cerita. Di sini tidak ada yang berjalan sendirian.
        </p>
        <div className="animate-rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 [animation-delay:200ms]">
          <a href="#pelayanan" className="btn btn-sun">
            Datang hari Minggu <Icon.arrowRight className="shift h-4 w-4" />
          </a>
          <a href="#gabung-life-group" className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
            <Icon.users className="h-4 w-4 text-sun-300" />
            <span className="link-sweep">Gabung Life Group</span>
          </a>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-6 border-t border-cream-100/20 py-7 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_auto] lg:items-center lg:gap-10">
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
