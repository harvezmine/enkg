import Image from "next/image";

import { mission, pastor, story, vision } from "@/content/about";

import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Eyebrow } from "../ui";

export function About() {
  return (
    <section id="siapa-kita" className="relative overflow-hidden bg-cream-50 px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-6">
            <Reveal>
              <Eyebrow>Siapa kita</Eyebrow>
              <h2 className="text-headline mt-5 font-semibold">
                Sebuah gereja.
                <br />
                Sebuah <span className="font-serif font-normal text-navy-700 italic">keluarga.</span>
              </h2>
            </Reveal>
            <Reveal delay={100} className="mt-6 max-w-lg space-y-4">
              {story.body.map((paragraph) => (
                <p key={paragraph} className="text-base leading-7 text-ink-soft">
                  {paragraph}
                </p>
              ))}
            </Reveal>
            <Reveal delay={150} className="mt-7">
              <a
                href="#gabung-life-group"
                className="group inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-navy-700"
              >
                <span className="link-sweep">Temukan Life Group-mu</span>
                <Icon.arrowRight className="h-4 w-4" />
              </a>
            </Reveal>
          </div>
          <Reveal variant="curtain" className="lg:col-span-6">
            <figure>
              <div className="relative aspect-[26/15] overflow-hidden rounded-2xl bg-navy-100">
                <Image
                  src="/images/photos/gathering.jpg"
                  alt="Ps. Raswan Gautama menyampaikan firman dalam ibadah Every Nation Kelapa Gading"
                  fill
                  sizes="(min-width: 1280px) 550px, (min-width: 1024px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-5 flex items-center gap-4 border-b border-ink/10 pb-5">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-navy-100">
                  <Image src={pastor.photo.src} alt="" fill sizes="48px" className="object-cover object-top" />
                </div>
                <div>
                  <p className="text-xs text-navy-700">Gembala ENKG</p>
                  <p className="mt-1 text-sm font-semibold">
                    {pastor.name} &amp; {pastor.partner}
                  </p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        </div>
        <Reveal className="mt-16 grid gap-7 border-t border-ink/15 pt-10 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-700">Tujuan kami</p>
            <h3 className="mt-4 text-3xl leading-tight font-semibold sm:text-4xl">
              Honor God.
              <br />
              <span className="font-serif font-normal text-navy-700 italic">Make Disciples.</span>
            </h3>
            <p className="mt-3 text-sm text-ink-soft">{vision.taglineId}</p>
          </div>
          <div className="lg:col-span-7">
            <p className="max-w-xl text-base leading-7 text-ink-soft">{mission.id}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {vision.focus.map((item) => (
                <li
                  key={item.title}
                  className="rounded-full border border-navy-700/20 px-4 py-2 text-xs font-medium text-navy-700"
                >
                  {item.title}
                </li>
              ))}
            </ul>
            <a
              href="#iman"
              className="group mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy-700"
            >
              <span className="link-sweep">Nilai & iman kami</span>
              <Icon.arrowRight className="h-4 w-4 rotate-90" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
