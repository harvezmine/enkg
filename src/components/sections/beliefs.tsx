import { beliefs, beliefsSource, creeds, oneBody, values } from "@/content/about";

import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Eyebrow, Grain } from "../ui";

const beliefGroups = [
  {
    title: "Allah & firman-Nya",
    subtitle: "Dasar iman kita",
    items: [0, 1, 2],
  },
  {
    title: "Kristus & keselamatan",
    subtitle: "Anugerah yang memulihkan",
    items: [3, 4, 5],
  },
  {
    title: "Hidup dalam Roh",
    subtitle: "Bertumbuh dan diutus",
    items: [6, 10, 7],
  },
  {
    title: "Gereja & pengharapan",
    subtitle: "Bersama sebagai tubuh Kristus",
    items: [8, 9, 11],
  },
] as const;

export function Beliefs() {
  return (
    <section
      id="iman"
      className="edge-top relative isolate overflow-hidden bg-navy-950 px-5 py-20 text-cream-100 sm:px-8 lg:py-28"
    >
      <Grain className="opacity-5" />
      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <Eyebrow tone="navy">Nilai kami</Eyebrow>
          <h2 className="text-headline mt-5 max-w-2xl font-semibold">Iman yang dihidupi.</h2>
        </Reveal>
        {/* Kalimat yang menjadi dasar seluruh nada situs, dulu terkubur di accordion. */}
        <Reveal delay={100} className="mt-10 grid gap-8 border-t border-white/15 pt-10 lg:grid-cols-12 lg:gap-16">
          <p className="font-serif text-2xl leading-snug text-cream-100/90 italic sm:text-3xl lg:col-span-7">
            {oneBody}
          </p>
          <p className="leading-relaxed text-cream-100/65 lg:col-span-5 lg:pt-2">
            Lima nilai di bawah menuntun cara kami mengasihi, melayani, dan bertumbuh.
          </p>
        </Reveal>
        <Reveal delay={100} className="mt-10">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-5">
            {values.map((value, index) => (
              <details key={value.name} className="value-card group bg-navy-950 p-5 sm:p-6">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between">
                    <span className="tabular text-xs text-sun-300">0{index + 1}</span>
                    <span className="disclosure-plus text-cream-100/60" aria-hidden="true" />
                  </span>
                  <h3 className="mt-8 text-xl font-medium">{value.title}</h3>
                  <span lang="en" className="mt-1 block text-sm text-cream-100/55">
                    {value.name}
                  </span>
                  <span className="mt-4 block text-sm text-sun-300">{value.verse}</span>
                </summary>
                <div className="disclosure-body">
                  <p className="mt-4 text-sm leading-relaxed text-cream-100/75">{value.body}</p>
                </div>
              </details>
            ))}
          </div>
        </Reveal>

        <div className="mt-16 grid gap-10 border-t border-white/15 pt-14 lg:mt-20 lg:grid-cols-12 lg:gap-16 lg:pt-16">
          <Reveal className="lg:col-span-5 lg:self-start">
            <Eyebrow tone="navy">Statement of Faith</Eyebrow>
            <h2 className="text-headline mt-5 font-semibold">
              Berakar dalam
              <br />
              <span className="font-serif font-normal text-sun-300 italic">kebenaran.</span>
            </h2>
            <p className="mt-6 max-w-sm leading-relaxed text-cream-100/70">
              Kenali pokok iman yang menjadi dasar kehidupan dan pelayanan kami.
            </p>
            <a
              href={beliefsSource}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sun-300"
            >
              <span className="link-sweep">Baca pernyataan iman lengkap</span>
              <Icon.arrowUpRight className="h-4 w-4" />
            </a>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-7">
            <p className="mb-5 text-xs text-cream-100/55">Pilih topik untuk membaca ringkasannya</p>
            <div className="border-t border-white/20">
              {beliefGroups.map((group, index) => (
                <details
                  key={group.title}
                  name="statement-of-faith"
                  className="faith-disclosure group border-b border-white/20"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-4 py-6 sm:gap-6 [&::-webkit-details-marker]:hidden">
                    <span className="tabular self-start pt-1 text-xs text-sun-300">0{index + 1}</span>
                    <span className="flex-1">
                      <h3 className="text-xl font-medium sm:text-2xl">{group.title}</h3>
                      <span className="mt-1 block text-sm text-cream-100/55">{group.subtitle}</span>
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 transition-colors group-hover:border-sun-300 group-hover:text-sun-300">
                      <span className="disclosure-plus" aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="disclosure-body pb-7 pl-8 sm:pl-10">
                    <ul className="space-y-6">
                      {group.items.map((index) => (
                        <li key={beliefs[index].title}>
                          <h4 className="text-base font-semibold text-sun-300">{beliefs[index].title}</h4>
                          <p className="mt-2 max-w-xl text-sm leading-7 text-cream-100/75">{beliefs[index].body}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
            <p className="mt-6 max-w-xl text-xs leading-relaxed text-cream-100/55">{creeds}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
