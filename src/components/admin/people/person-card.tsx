import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/icons";
import { PERSON_STATUS_LABEL, type Person } from "@/lib/db-types";
import { ageOn, birthdayPhrase, nextBirthday } from "@/lib/people";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

import { PersonAvatar } from "./avatar";

/** Lencana ulang tahun muncul di kartu bila tinggal seminggu atau kurang. */
const BIRTHDAY_SOON_DAYS = 7;

export type CardChip = { label: string; lead?: boolean };

/**
 * Kartu jemaat untuk grid. Seluruh kartu bisa diklik (tautan nama
 * direntangkan menutupi kartu), sementara tombol WhatsApp dan isi `footer`
 * diangkat di atasnya supaya tetap bisa ditekan sendiri.
 */
export function PersonCard({
  person,
  photoUrl,
  today,
  chips = [],
  family,
  footer,
}: {
  person: Person;
  photoUrl?: string | null;
  today: string;
  chips?: CardChip[];
  family?: string;
  footer?: ReactNode;
}) {
  const age = person.birth_date ? ageOn(person.birth_date, today) : null;
  const birthday = person.birth_date ? nextBirthday(person.birth_date, today) : null;
  const soon = birthday && birthday.daysUntil <= BIRTHDAY_SOON_DAYS;
  // Hanya yang sudah tidak beribadah di sini yang diredupkan; jemaat baru justru perlu menonjol.
  const inactive = person.status === "tidak_aktif" || person.status === "pindah";
  const shown = chips.slice(0, 3);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-ink/8 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-square overflow-hidden bg-cream-100">
        <PersonAvatar
          person={person}
          photoUrl={photoUrl}
          className={cn(
            "h-full w-full text-4xl transition duration-500 group-hover:scale-[1.03] sm:text-5xl",
            inactive && "opacity-60 grayscale",
          )}
        />
        {soon && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-sun-500 px-2.5 py-1 text-[11px] font-bold text-ink shadow-soft">
            <Icon.cake className="h-3.5 w-3.5" />
            {birthdayPhrase(birthday.daysUntil)}
          </span>
        )}
        {person.status !== "aktif" && (
          <span
            className={cn(
              "absolute right-2.5 bottom-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur",
              person.status === "baru" ? "bg-navy-700 text-cream-100" : "bg-white/90 text-ink-soft",
            )}
          >
            {PERSON_STATUS_LABEL[person.status]}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="font-display text-[15px] leading-snug font-bold text-ink sm:text-base">
          <Link
            href={`/admin/jemaat/${person.id}`}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-navy-700"
          >
            {person.full_name}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs text-ink-soft">
          {[person.nickname, age !== null ? `${age} tahun` : null].filter(Boolean).join(" · ") || " "}
        </p>

        {person.area && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-soft">
            <Icon.mapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{person.area}</span>
          </p>
        )}

        {shown.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1" aria-label="Pelayanan">
            {shown.map((chip) => (
              <li
                key={chip.label}
                className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-700"
              >
                {chip.lead && <Icon.star className="h-3 w-3 fill-sun-500 text-sun-600" aria-label="Koordinator" />}
                {chip.label}
              </li>
            ))}
            {chips.length > shown.length && (
              <li className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft">+{chips.length - shown.length}</li>
            )}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="min-w-0 text-[11px] leading-snug text-ink-soft">{family}</p>
          {person.phone && (
            <a
              href={whatsappLink(person.phone)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${person.full_name}`}
              className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
            >
              <Icon.whatsapp className="h-4 w-4" />
            </a>
          )}
        </div>
        {footer && <div className="relative z-10 mt-3 border-t border-ink/8 pt-2">{footer}</div>}
      </div>
    </article>
  );
}
