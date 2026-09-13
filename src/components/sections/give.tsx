import Image from "next/image";

import { site, whatsappMessages, whatsappUrl } from "@/content/site";

import { CopyButton } from "../copy-button";
import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Eyebrow, Grain } from "../ui";

/** "0000000000" → "000 000 0000", supaya nomor rekening mudah dibaca. */
const formatAccount = (value: string) => value.replace(/^(\d{3})(\d{3})(\d+)$/, "$1 $2 $3");

export function Give() {
  const { give } = site;
  const ready = Boolean(give.bank && give.accountNumber);

  return (
    <section id="give" className="bg-paper relative isolate overflow-hidden px-5 pt-24 pb-28 sm:px-8 lg:pt-32 lg:pb-36">
      <Grain className="opacity-5" />

      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-12 lg:items-center lg:gap-12">
        <Reveal className="lg:col-span-6">
          <Eyebrow>Give</Eyebrow>
          <h2 className="text-display mt-5 font-bold">
            Memberi dengan <span className="font-serif font-normal tracking-normal text-navy-700 italic">sukacita.</span>
          </h2>
          <blockquote className="mt-10 border-l-2 border-sun-500 pl-6">
            <p className="font-serif text-2xl leading-snug italic sm:text-[1.75rem]">
              “Hendaklah masing-masing memberikan menurut kerelaan hatinya, jangan dengan sedih hati atau karena paksaan,
              sebab Allah mengasihi orang yang memberi dengan sukacita.”
            </p>
            <footer className="mt-3 text-sm text-ink-soft">2 Korintus 9:7</footer>
          </blockquote>
          <p className="text-lead mt-10 max-w-lg text-ink-soft">
            Persembahan dan persepuluhanmu mendukung ibadah, pemuridan, dan pelayanan Every Nation Kelapa Gading.
          </p>
        </Reveal>

        <div className="relative lg:col-span-6">
          <Reveal variant="curtain" className="relative aspect-[5/4] overflow-hidden rounded-[2rem] shadow-lift">
            <Image
              src="/images/photos/gathering.jpg"
              alt="Ps. Raswan Gautama membuka tangan di depan slide Berkumpul Bersekutu dalam Ibadah Minggu"
              fill
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-cover grayscale-[25%]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-navy-950/60 via-transparent to-transparent" />
          </Reveal>

          <Reveal
            delay={180}
            className="bg-navy-deep relative isolate mx-4 -mt-28 overflow-hidden rounded-[1.75rem] p-7 text-cream-100 shadow-deep sm:mx-12 sm:p-8"
          >
            <Grain className="opacity-10" />
            <p className="flex items-center gap-2 text-sm text-cream-100/65">
              <Icon.check className="h-4 w-4 text-sun-400" /> Rekening persembahan
            </p>
            <p className="font-display mt-2 text-2xl font-bold sm:text-3xl">{give.accountName}</p>

            {ready ? (
              <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-6">
                <div>
                  <p className="text-sm text-cream-100/65">{give.bank}</p>
                  <p className="font-display tabular mt-1 text-3xl font-semibold tracking-wide sm:text-4xl">
                    {formatAccount(give.accountNumber)}
                  </p>
                </div>
                <CopyButton value={give.accountNumber} />
              </div>
            ) : (
              <p className="mt-6 border-t border-white/10 pt-6 leading-relaxed text-cream-100/75">
                Nomor rekening sedang kami perbarui. Hubungi kami lewat WhatsApp untuk info persembahan.
              </p>
            )}

            <a
              href={whatsappUrl(whatsappMessages.give)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sun mt-7 w-full sm:w-auto"
            >
              <Icon.whatsapp className="h-5 w-5" /> {ready ? "Konfirmasi lewat WhatsApp" : "Tanya info rekening"}
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
