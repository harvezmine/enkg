import { site, whatsappMessages, whatsappUrl } from "@/content/site";

import { CopyButton } from "../copy-button";
import { Icon } from "../icons";
import { QrisDialog } from "../qris-dialog";
import { Reveal } from "../reveal";
import { Eyebrow, Grain } from "../ui";

/** "7660400189" → "7660 400 189", persis seperti yang tercetak di buku tabungan. */
const formatAccount = (value: string) => value.replace(/^(\d{4})(\d{3})(\d+)$/, "$1 $2 $3");

export function Give() {
  const { give } = site;
  const ready = Boolean(give.bank && give.accounts.length);

  return (
    <section id="give" className="bg-paper edge-top-soft relative isolate overflow-hidden px-5 pt-24 pb-28 sm:px-8 lg:pt-32 lg:pb-36">
      <Grain className="opacity-5" />

      <div className="mx-auto grid max-w-7xl gap-20 lg:grid-cols-12 lg:items-center lg:gap-12">
        <Reveal className="lg:col-span-6">
          <Eyebrow>Give</Eyebrow>
          <h2 className="text-display mt-5 font-bold">
            Memberi dengan{" "}
            <span className="font-serif font-normal tracking-normal text-navy-700 italic">sukacita.</span>
          </h2>
          <blockquote className="mt-8 border-l-2 border-sun-500 pl-5 sm:mt-10 sm:pl-6">
            <p className="font-serif text-xl leading-snug italic sm:text-2xl lg:text-[1.75rem]">
              “Hendaklah masing-masing memberikan menurut kerelaan hatinya, jangan dengan sedih hati atau karena
              paksaan, sebab Allah mengasihi orang yang memberi dengan sukacita.”
            </p>
            <footer className="mt-3 text-sm text-ink-soft">2 Korintus 9:7</footer>
          </blockquote>
        </Reveal>

        <div className="relative mx-auto w-full max-w-xl lg:col-span-6 lg:max-w-none">
          <Reveal className="bg-navy-deep relative isolate overflow-hidden rounded-[2rem] p-7 text-cream-100 shadow-lit sm:p-9">
            <Grain className="opacity-10" />

            {ready ? (
              <div className="relative">
                {/* Nama penerima yang paling dulu dibesarkan: itu yang dicocokkan
                    orang di layar m-banking sebelum menekan kirim. */}
                <Eyebrow tone="navy">{give.bank}</Eyebrow>
                <p className="font-display mt-4 text-2xl leading-tight font-bold sm:text-3xl">{give.accountName}</p>

                {/* Dua rekening dengan peruntukan berbeda, jadi labelnya dibaca lebih
                    dulu daripada nomornya. Salah pos merepotkan bendahara, bukan pemberi. */}
                <ul className="mt-7 border-t border-white/10">
                  {give.accounts.map((account) => (
                    <li
                      key={account.id}
                      className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-white/10 py-5"
                    >
                      <div>
                        <p className="text-sm text-cream-100/60">{account.label}</p>
                        <p className="font-display tabular mt-1 text-2xl font-semibold tracking-wide sm:text-3xl">
                          {formatAccount(account.number)}
                        </p>
                      </div>
                      <CopyButton value={account.number} label="Salin" name={account.label} />
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <QrisDialog />
                </div>
              </div>
            ) : (
              <div className="relative">
                <Eyebrow tone="navy">Rekening persembahan</Eyebrow>
                <p className="font-display mt-4 text-2xl leading-tight font-bold sm:text-3xl">{give.accountName}</p>
                <p className="mt-5 leading-relaxed text-cream-100/75">
                  Hubungi tim gereja melalui WhatsApp untuk informasi rekening persembahan.
                </p>
                <a
                  href={whatsappUrl(whatsappMessages.give)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sun mt-7 w-full sm:w-auto"
                >
                  <Icon.whatsapp className="h-5 w-5" /> Tanya info rekening
                </a>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
