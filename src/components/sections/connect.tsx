import { site, whatsappMessages, whatsappUrl } from "@/content/site";

import { ConnectForm } from "../connect-form";
import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";
import { Grain } from "../ui";

/** Target anchor dari kartu pelayanan (#gabung-life-group, #permohonan-doa, …). */
const ANCHORS = [
  "gabung-life-group",
  "gabung-family",
  "gabung-young-professional",
  "gabung-youth",
  "permohonan-doa",
  "kirim-pesan",
];

const socials = [
  { href: site.socials.instagram, label: "Instagram", icon: Icon.instagram },
  { href: site.socials.facebook, label: "Facebook", icon: Icon.facebook },
  { href: site.socials.youtube, label: "YouTube", icon: Icon.youtube },
];

export function Connect() {
  return (
    <Section id="kontak">
      {ANCHORS.map((anchor) => (
        <span key={anchor} id={anchor} className="absolute top-0" aria-hidden="true" />
      ))}

      <SectionHeading
        eyebrow="Terhubung"
        title="Mari berkenalan."
        intro="Mau datang, mau didoakan, atau mau tanya-tanya dulu? Semuanya boleh."
      />

      <Reveal className="mt-12 sm:mt-14">
        <ConnectForm />
      </Reveal>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        {/* Peta dengan kartu alamat yang menumpuk di atasnya */}
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-cream-200 shadow-lit-soft ring-1 ring-ink/5 lg:col-span-7 xl:col-span-8">
          <div className="h-72 sm:h-96 lg:h-full lg:min-h-112">
            <iframe
              src={site.maps.embed}
              title="Peta lokasi Every Nation Kelapa Gading di Mahaka Square, Kelapa Gading"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
          <div className="relative m-3 -mt-12 rounded-3xl bg-cream-50/95 p-5 shadow-lift ring-1 ring-ink/5 backdrop-blur sm:m-4 sm:-mt-14 sm:p-6 md:absolute md:bottom-5 md:left-5 md:m-0 md:w-88">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-700">
              <Icon.mapPin className="h-4 w-4" /> Lokasi ibadah
            </p>
            <address className="mt-2 leading-relaxed text-ink-soft not-italic">
              <span className="font-display text-xl font-bold text-ink">{site.address.venue}</span>
              <br />
              {site.address.building}
              <br />
              {site.address.street}, {site.address.city}
            </address>
            <a
              href={site.maps.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-navy mt-4 px-5 py-2.5 text-sm"
            >
              Petunjuk arah <Icon.arrowUpRight className="lift h-4 w-4" />
            </a>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 lg:col-span-5 lg:grid-cols-1 xl:col-span-4">
          <Reveal
            delay={100}
            className="bg-navy-deep relative isolate flex flex-col overflow-hidden rounded-[2rem] p-7 text-cream-100 shadow-lit"
          >
            <Grain className="opacity-10" />
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#25d366] text-ink">
              <Icon.whatsapp className="h-6 w-6" />
            </span>
            <p className="mt-6 text-sm text-cream-100/60">WhatsApp gereja</p>
            <p className="font-display tabular mt-1 text-2xl font-bold">{site.whatsapp.display}</p>
            <p className="mt-2 flex-1 leading-relaxed text-cream-100/70">Ada pertanyaan? Chat langsung dengan kami.</p>
            <a
              href={whatsappUrl(whatsappMessages.contact)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa mt-6 w-full"
            >
              Chat WhatsApp
            </a>
          </Reveal>

          <Reveal delay={180} className="rounded-[2rem] bg-cream-50 p-7 shadow-lit-soft ring-1 ring-ink/5">
            <p className="text-sm font-semibold text-navy-700">Ikuti kami</p>
            <ul className="mt-4 space-y-1">
              {socials.map(({ href, label, icon: SocialIcon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group -mx-3 flex items-center justify-between rounded-2xl px-3 py-2.5 transition hover:bg-cream-100"
                  >
                    <span className="flex items-center gap-3 font-semibold">
                      <SocialIcon className="h-5 w-5 text-navy-700" /> {label}
                    </span>
                    <Icon.arrowUpRight className="h-4 w-4 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
