import Image from "next/image";

import { mission, oneBody, pastor, stats, story, vision } from "@/content/about";

import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Eyebrow, Grain } from "../ui";

/**
 * Siapa Kita disusun sebagai satu section yang padu, bukan tumpukan band bergaris.
 * Urutannya: identitas (Honor God. Make Disciples.), lalu misi dan angka di dalam
 * satu kartu navy yang jadi jangkar gelap di tengah section krem, lalu cerita dan
 * gembala, lalu fokus pelayanan. Pergantian terang, gelap, foto, terang itulah yang
 * membuat section ini punya kedalaman tanpa perlu garis pemisah di mana-mana.
 */
export function About() {
  return (
    <section
      id="siapa-kita"
      className="edge-top-soft relative overflow-hidden bg-cream-50 px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-3xl">
          <Eyebrow>Siapa kita</Eyebrow>
          <h2 className="text-display mt-6 font-bold">
            Honor God.
            <br />
            <span className="font-serif font-normal tracking-normal text-navy-700 italic">Make Disciples.</span>
          </h2>
          <p className="text-lead mt-6 text-ink-soft">{vision.taglineId}</p>
        </Reveal>

        {/* Kartu navy: misi dan angka jadi satu, karena "setiap bangsa" di misi dan
            "80+ bangsa" di angka itu pernyataan yang sama dari dua sisi. */}
        <Reveal delay={100} className="mt-12 lg:mt-16">
          <div className="bg-navy-deep relative isolate overflow-hidden rounded-[2rem] p-7 text-cream-100 shadow-lit sm:p-10 lg:p-12">
            <Grain className="opacity-10" />
            <div className="relative grid gap-8 lg:grid-cols-12 lg:gap-14">
              <p className="text-lead lg:col-span-7">{mission.id}</p>
              <p lang="en" className="border-l-2 border-sun-400 pl-5 leading-relaxed text-cream-100/60 italic lg:col-span-5">
                {mission.en}
              </p>
            </div>
            <dl className="relative mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/15 pt-9 lg:mt-12 lg:grid-cols-4 lg:pt-10">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display tabular text-4xl leading-none font-bold tracking-tight text-sun-400 sm:text-5xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-3 max-w-52 text-sm leading-relaxed text-cream-100/65">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        {/* Cerita gereja, dibuka oleh kalimat tubuh Kristus. */}
        <div className="mt-16 grid items-start gap-12 lg:mt-24 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <p className="font-serif text-2xl leading-snug text-navy-700 italic sm:text-3xl">{oneBody}</p>
            </Reveal>
            <Reveal delay={100} className="mt-8 max-w-lg space-y-4">
              {story.body.map((paragraph) => (
                <p key={paragraph} className="text-base leading-7 text-ink-soft">
                  {paragraph}
                </p>
              ))}
            </Reveal>
            <Reveal delay={150} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              <a href="#life-group" className="group inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-navy-700">
                <span className="link-sweep">Temukan Life Group-mu</span>
                <Icon.arrowRight className="h-4 w-4" />
              </a>
              <a href="#iman" className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy-700">
                <span className="link-sweep">Nilai &amp; iman kami</span>
                <Icon.arrowRight className="h-4 w-4 rotate-90" />
              </a>
            </Reveal>
          </div>

          <Reveal variant="curtain" className="lg:col-span-6">
            <figure className="relative">
              <div className="relative aspect-[26/15] overflow-hidden rounded-[1.75rem] bg-navy-100 shadow-lit-soft">
                <Image
                  src="/images/photos/jemaat-paskah.jpg"
                  alt="Jemaat Every Nation Kelapa Gading pada ibadah Paskah di Stream Hall, anak-anak duduk di depan"
                  fill
                  sizes="(min-width: 1280px) 600px, (min-width: 1024px) 48vw, 92vw"
                  className="object-cover"
                />
              </div>
              {/* Kartu gembala menumpuk di atas foto supaya dua lapis ini terbaca
                  bertumpuk, bukan dua kotak yang berdiri sendiri-sendiri. */}
              <figcaption className="relative mr-auto ml-4 -mt-10 flex max-w-sm items-center gap-4 rounded-2xl bg-cream-50/95 p-4 shadow-lift ring-1 ring-ink/5 backdrop-blur sm:ml-6 sm:-mt-12 sm:p-5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-navy-100 ring-1 ring-ink/10">
                  <Image src={pastor.photo.src} alt="" fill sizes="56px" className="object-cover object-top" />
                </div>
                <div>
                  <p className="text-xs text-navy-700">{pastor.role}</p>
                  <p className="mt-1 font-semibold">
                    {pastor.name} &amp; {pastor.partner}
                  </p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        </div>

        {/* Tiga fokus pelayanan Every Nation. */}
        <Reveal delay={100} className="mt-16 lg:mt-20">
          <ul className="grid gap-px overflow-hidden rounded-2xl bg-ink/10 shadow-lit-soft ring-1 ring-ink/5 sm:grid-cols-3">
            {vision.focus.map((item, index) => (
              <li key={item.title} className="bg-cream-100 p-6 sm:p-7">
                <span className="tabular text-xs text-navy-700">0{index + 1}</span>
                <h3 className="font-display mt-6 text-xl font-bold">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{item.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
