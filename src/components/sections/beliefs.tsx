import { beliefs, beliefsSource, creeds, values } from "@/content/about";

import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Eyebrow, Grain } from "../ui";

type Belief = (typeof beliefs)[number];

function BeliefGrid({ items, offset }: { items: readonly Belief[]; offset: number }) {
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((belief, index) => (
        <li
          key={belief.title}
          className="rounded-3xl bg-white/4 p-7 ring-1 ring-white/10 transition duration-300 hover:bg-white/7 hover:ring-white/20"
        >
          <span className="tabular text-sm text-sun-400">{String(offset + index + 1).padStart(2, "0")}</span>
          <h3 className="font-display mt-3 text-xl font-semibold">{belief.title}</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-cream-100/70">{belief.body}</p>
        </li>
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
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
            <Eyebrow tone="navy">Nilai kami</Eyebrow>
            <h2 className="text-headline mt-5 font-bold">Lima hal yang membentuk cara kami membangun gereja.</h2>
            <p className="text-lead mt-5 text-cream-100/70">
              Dari kelompok pemuridan sampai Ibadah Minggu, nilai ini jadi dasar setiap pelayanan kami.
            </p>
          </Reveal>

          <ol className="border-t border-white/10 lg:col-span-8">
            {values.map((value, index) => (
              <Reveal
                as="li"
                key={value.name}
                delay={index * 60}
                className="group grid gap-3 border-b border-white/10 py-8 sm:grid-cols-[5rem_1fr] sm:gap-6 lg:grid-cols-[5rem_1fr_11rem]"
              >
                <span className="font-display tabular text-5xl leading-none font-bold text-white/15 transition-colors duration-500 group-hover:text-sun-400">
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
                <p className="font-serif text-lg text-sun-300 italic sm:col-start-2 lg:col-start-auto lg:pt-1.5 lg:text-right">
                  {value.verse}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* Statement of Faith */}
        <div className="mt-28 lg:mt-36">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <Reveal className="max-w-2xl">
              <Eyebrow tone="navy">Statement of Faith</Eyebrow>
              <h2 className="text-headline mt-5 font-bold">Apa yang kami percaya.</h2>
              <p className="text-lead mt-5 text-cream-100/70">
                Ringkasan pernyataan iman Every Nation. {creeds}
              </p>
            </Reveal>
            <a href={beliefsSource} target="_blank" rel="noopener noreferrer" className="btn btn-light self-start lg:self-auto">
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
