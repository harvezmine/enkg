import { beliefs, beliefsSource, creeds, values } from "@/content/about";

import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Eyebrow, Grain } from "../ui";

type Belief = (typeof beliefs)[number];

function BeliefGrid({ items, offset }: { items: readonly Belief[]; offset: number }) {
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((belief, index) => (
        <Reveal
          as="li"
          key={belief.title}
          delay={(index % 3) * 80}
          className="rounded-3xl bg-white/4 p-6 ring-1 ring-white/10 transition duration-300 hover:bg-white/7 hover:ring-white/20 sm:p-7"
        >
          <span className="tabular text-sm text-sun-400">{String(offset + index + 1).padStart(2, "0")}</span>
          <h3 className="font-display mt-3 text-xl font-semibold">{belief.title}</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-cream-100/70">{belief.body}</p>
        </Reveal>
      ))}
    </ul>
  );
}

export function Beliefs() {
  const shown = beliefs.slice(0, 6);
  const more = beliefs.slice(6);

  return (
    <section id="iman" className="bg-navy-deep relative isolate overflow-hidden px-5 pt-24 pb-28 text-cream-100 sm:px-8 lg:pt-32 lg:pb-36">
      <Grain className="opacity-9" />

      <div className="mx-auto max-w-7xl">
        {/* Nilai */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start xl:col-span-4">
            <Eyebrow tone="navy">Nilai kami</Eyebrow>
            <h2 className="text-headline mt-5 font-bold">Lima nilai yang membentuk kami.</h2>
            <p className="text-lead mt-5 max-w-md text-cream-100/70">
              Dasar dari setiap pelayanan, dari kelompok kecil sampai Ibadah Minggu.
            </p>
          </Reveal>

          <ol className="border-t border-white/10 lg:col-span-7 xl:col-span-8">
            {values.map((value, index) => (
              <Reveal
                as="li"
                key={value.name}
                delay={index * 50}
                className="group grid grid-cols-[3.5rem_1fr] gap-x-4 gap-y-2 border-b border-white/10 py-7 sm:grid-cols-[5rem_1fr] sm:gap-x-6 xl:grid-cols-[5rem_1fr_11rem]"
              >
                <span className="font-display tabular row-span-2 text-4xl leading-none font-bold text-white/15 transition-colors duration-500 group-hover:text-sun-400 sm:text-5xl xl:row-span-1">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold sm:text-[1.75rem]">
                    {value.title}
                    <span lang="en" className="ml-3 align-middle text-sm font-normal text-cream-100/45">
                      {value.name}
                    </span>
                  </h3>
                  <p className="mt-2 max-w-xl leading-relaxed text-cream-100/70">{value.body}</p>
                </div>
                <p className="font-serif col-start-2 text-lg text-sun-300 italic xl:col-start-auto xl:pt-1.5 xl:text-right">
                  {value.verse}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* Statement of Faith */}
        <div className="mt-24 lg:mt-36">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <Reveal className="max-w-2xl">
              <Eyebrow tone="navy">Statement of Faith</Eyebrow>
              <h2 className="text-headline mt-5 font-bold">Apa yang kami percaya.</h2>
              <p className="text-lead mt-5 text-cream-100/70">Ringkasan pernyataan iman Every Nation. {creeds}</p>
            </Reveal>
            <a
              href={beliefsSource}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-light shrink-0 self-start md:self-auto"
            >
              Baca versi lengkap <Icon.arrowUpRight className="lift h-4 w-4" />
            </a>
          </div>

          <BeliefGrid items={shown} offset={0} />

          {more.length > 0 && (
            <details className="group/more">
              <summary className="btn btn-light mx-auto mt-8 flex w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="group-open/more:hidden">Tampilkan {more.length} pokok iman lainnya</span>
                <span className="hidden group-open/more:inline">Sembunyikan</span>
                <Icon.arrowRight className="h-4 w-4 rotate-90 transition-transform group-open/more:-rotate-90" />
              </summary>
              <BeliefGrid items={more} offset={shown.length} />
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
