import Image from "next/image";

import { mission, pastor, stats, story, vision } from "@/content/about";

import { Icon } from "../icons";
import { Parallax } from "../parallax";
import { Reveal } from "../reveal";
import { Eyebrow, Grain } from "../ui";

export function About() {
  return (
    <section id="siapa-kita" className="bg-paper relative isolate overflow-hidden px-5 pt-24 pb-24 sm:px-8 lg:pt-32 lg:pb-32">
      <Grain className="opacity-5" />

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          {/* Cerita + angka */}
          <div className="lg:col-span-6">
            <Reveal>
              <Eyebrow>Siapa Kita</Eyebrow>
              <h2 className="text-headline mt-5 font-bold">{story.title}</h2>
            </Reveal>
            <Reveal delay={100} className="mt-7 max-w-xl space-y-4">
              {story.body.map((paragraph) => (
                <p key={paragraph} className="text-lead text-ink-soft">
                  {paragraph}
                </p>
              ))}
            </Reveal>

            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink/10 ring-1 ring-ink/10">
              {stats.map((stat, index) => (
                <Reveal key={stat.label} delay={index * 80} className="bg-cream-50 p-5 sm:p-7">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="font-display tabular block text-4xl font-bold tracking-tight text-navy-700 sm:text-5xl xl:text-6xl">
                      {stat.value}
                    </span>
                    <span className="mt-2 block text-sm leading-snug text-ink-soft">{stat.label}</span>
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>

          {/* Komposisi foto: di layar ≥ xl kutipan & gembala menumpuk di kolase, di bawahnya tersusun di bawah kolase. */}
          <div className="relative lg:col-span-6 lg:self-center">
            <div className="relative xl:pt-12 xl:pb-16">
              <Parallax speed={-3}>
                <Reveal
                  variant="curtain"
                  className="relative ml-auto aspect-4/3 w-full overflow-hidden rounded-[2rem] shadow-lift xl:w-[92%]"
                >
                  <Image
                    src="/images/photos/community-collage.jpg"
                    alt="Kolase foto jemaat Every Nation Kelapa Gading dari tahun ke tahun"
                    fill
                    sizes="(min-width: 1024px) 36rem, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-navy-950/55 via-transparent to-transparent" />
                </Reveal>
              </Parallax>

              <Parallax
                speed={6}
                className="relative z-10 mx-4 -mt-12 sm:mr-6 sm:ml-auto sm:max-w-sm xl:absolute xl:top-0 xl:-right-3 xl:mx-0 xl:mt-0 xl:w-72"
              >
                <Reveal variant="scale" delay={250} className="rounded-3xl bg-sun-500 p-6 text-ink shadow-lift">
                  <p className="font-serif text-2xl leading-snug italic">
                    “Iman tidak bisa dijalani sendirian. Kita butuh komunitas gereja untuk menghidupkan dan
                    mempertajam iman kita.”
                  </p>
                  <p className="mt-3 text-sm text-ink/70">Dari khotbah “Bersama Menjaga Api Iman”</p>
                </Reveal>
              </Parallax>

              <Parallax
                speed={3}
                className="relative z-10 mx-4 mt-4 sm:mx-6 xl:absolute xl:bottom-0 xl:left-0 xl:mx-0 xl:mt-0 xl:w-92"
              >
                <Reveal delay={150} className="flex items-center gap-5 rounded-3xl bg-navy-800 p-4 pr-6 text-cream-100 shadow-deep">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-sun-400 sm:h-28 sm:w-28">
                    <Image
                      src={pastor.photo.src}
                      alt={`${pastor.name} berkhotbah dalam Ibadah Minggu`}
                      fill
                      sizes="7rem"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-sun-400">{pastor.role}</p>
                    <p className="font-display mt-1 text-xl leading-tight font-bold">{pastor.name}</p>
                    <p className="text-sm text-cream-100/70">& {pastor.partner}</p>
                  </div>
                </Reveal>
              </Parallax>
            </div>
          </div>
        </div>

        {/* Visi & misi: bertumpuk sampai layar lebar supaya kolom fokus tidak sempit. */}
        <div className="mt-20 grid gap-5 lg:mt-28 xl:grid-cols-12">
          <Reveal className="bg-navy-deep relative isolate overflow-hidden rounded-[2rem] p-7 text-cream-100 sm:p-10 xl:col-span-7">
            <Grain className="opacity-10" />
            <p className="text-sm font-semibold text-sun-400">Visi</p>
            <p className="text-headline mt-4 font-bold">{vision.tagline}</p>
            <p className="font-serif mt-3 text-2xl text-cream-100/80 italic">{vision.taglineId}</p>
            <ul className="mt-10 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-3">
              {vision.focus.map((item, index) => (
                <li key={item.title}>
                  <span className="tabular text-sm text-sun-400">0{index + 1}</span>
                  <p className="font-display mt-2 text-lg font-semibold">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-cream-100/65">{item.body}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            delay={120}
            className="flex flex-col justify-between rounded-[2rem] bg-cream-50 p-7 shadow-soft ring-1 ring-ink/5 sm:p-10 xl:col-span-5"
          >
            <div>
              <p className="text-sm font-semibold text-navy-700">Misi</p>
              <p className="font-display mt-4 text-2xl leading-snug font-semibold text-pretty sm:text-[1.75rem]">
                {mission.id}
              </p>
            </div>
            <p lang="en" className="font-serif mt-8 border-t border-ink/10 pt-6 text-lg leading-relaxed text-ink-soft italic">
              {mission.en}
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-8 flex justify-end">
          <a href="#iman" className="group inline-flex items-center gap-2 font-semibold text-navy-700">
            <span className="link-sweep">Nilai & pernyataan iman kami</span>
            <Icon.arrowRight className="h-4 w-4 rotate-90 transition-transform group-hover:translate-y-0.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
