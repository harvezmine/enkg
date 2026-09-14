import Image from "next/image";

import { lifeGroup } from "@/content/life-group";

import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

/**
 * Inti Life Group: gereja yang dijaga setiap hari, bukan cuma hari Minggu. Jadi
 * fotonya sengaja momen di luar ibadah, dan tiap kartu kelompok diberi ikon supaya
 * ketiganya terbaca sebagai pilihan yang konkret, bukan kotak teks yang kosong.
 *
 * Ketiga kartu dirakit dengan `gap-px` supaya sisinya bersentuhan dan terbaca
 * sebagai satu blok, meneruskan gagasan "satu tubuh" dari hero.
 */
const ICONS = { home: Icon.home, briefcase: Icon.briefcase, school: Icon.school } as const;

export function LifeGroup() {
  return (
    <Section id="life-group" tone="navy">
      <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <SectionHeading eyebrow="Life Group" title={lifeGroup.title} intro={lifeGroup.intro} tone="navy" />
          <Reveal delay={150} className="mt-10">
            <blockquote className="border-l-2 border-sun-400 pl-5 sm:pl-6">
              <p className="font-serif text-xl leading-snug text-cream-100/90 italic sm:text-2xl">{lifeGroup.quote}</p>
            </blockquote>
          </Reveal>
        </div>

        <Reveal variant="curtain" delay={100} className="lg:col-span-6">
          <figure className="relative">
            <div className="relative aspect-[3/2] overflow-hidden rounded-[1.75rem] shadow-deep">
              <Image
                src={lifeGroup.photo.src}
                alt={lifeGroup.photo.alt}
                fill
                sizes="(min-width: 1280px) 600px, (min-width: 1024px) 48vw, 92vw"
                className="object-cover"
              />
              {/* Gradasi harus pekat di dasar foto: captionnya jatuh di area terang
                  (meja dan kue), jadi kalau terlalu tipis tulisannya tidak terbaca. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950 from-6% via-navy-950/75 via-30% to-transparent to-62%"
              />
            </div>
            <figcaption className="absolute inset-x-6 bottom-5 text-sm leading-relaxed text-cream-100/90 sm:inset-x-8 sm:bottom-6">
              Bukan cuma hari Minggu. Kami juga bertemu di hari-hari biasa.
            </figcaption>
          </figure>
        </Reveal>
      </div>

      <Reveal delay={100} className="relative mt-14 sm:mt-16">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-8 -top-16 -bottom-10 -z-10 rounded-[50%] bg-navy-500/20 blur-3xl"
        />
        <ul className="relative grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 shadow-deep sm:grid-cols-3">
          {lifeGroup.groups.map((group) => {
            const GroupIcon = ICONS[group.icon];
            return (
              <li key={group.name}>
                <a
                  href={group.anchor}
                  className="bg-navy-deep group flex h-full flex-col p-6 transition-colors hover:bg-navy-900 sm:p-7"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sun-400/12 text-sun-300 ring-1 ring-sun-300/25 transition-colors group-hover:bg-sun-400/20">
                    <GroupIcon className="h-6 w-6" strokeWidth={1.5} />
                  </span>
                  <h3 className="font-display mt-6 text-xl font-bold sm:text-2xl">{group.name}</h3>
                  <p className="mt-2 flex-1 leading-relaxed text-cream-100/70">{group.forWhom}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sun-300">
                    Gabung {group.name}
                    <Icon.arrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </Reveal>

      <Reveal
        delay={150}
        className="mt-10 flex flex-col gap-6 border-t border-white/15 pt-10 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="max-w-md leading-relaxed text-cream-100/70">{lifeGroup.reassurance}</p>
        <a href={lifeGroup.cta.href} className="btn btn-sun shrink-0 self-start sm:self-auto">
          {lifeGroup.cta.label} <Icon.arrowRight className="shift h-4 w-4" />
        </a>
      </Reveal>
    </Section>
  );
}
