import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/icons";
import { PERSON_STATUS_LABEL, type Person } from "@/lib/db-types";
import { ageOn, birthdayPhrase, nextBirthday } from "@/lib/people";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

import { Badge } from "../ui";
import { PersonAvatar } from "./avatar";

/** Lencana ulang tahun muncul di kartu bila tinggal seminggu atau kurang. */
const BIRTHDAY_SOON_DAYS = 7;

export type CardChip = { label: string; lead?: boolean };

/**
 * Kartu jemaat ringkas: foto bulat, nama, satu baris keterangan, lencana.
 * Seluruh kartu bisa diklik (tautan nama direntangkan menutupi kartu),
 * sementara tombol WhatsApp dan isi `footer` diangkat di atasnya supaya tetap
 * bisa ditekan sendiri.
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
  const meta = [person.nickname, age !== null ? `${age} tahun` : null, person.area].filter(Boolean).join(" · ");
  const hasBadges = person.status !== "aktif" || soon || shown.length > 0;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl bg-white shadow-hair ring-1 ring-ink/[0.07] transition hover:shadow-soft hover:ring-ink/15">
      <div className="flex flex-1 items-start gap-3.5 p-4">
        <PersonAvatar
          person={person}
          photoUrl={photoUrl}
          className={cn("h-14 w-14 shrink-0 rounded-full text-base", inactive && "opacity-60 grayscale")}
        />

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] leading-snug font-bold text-ink">
            <Link
              href={`/admin/jemaat/${person.id}`}
              className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-navy-700"
            >
              {person.full_name}
            </Link>
          </h3>
          {meta && <p className="mt-0.5 truncate text-xs text-ink-soft">{meta}</p>}
          {family && <p className="mt-0.5 truncate text-xs text-ink-soft/80">{family}</p>}

          {hasBadges && (
            <ul className="mt-2 flex flex-wrap gap-1" aria-label="Keterangan">
              {person.status !== "aktif" && (
                <li>
                  <Badge tone={person.status === "baru" ? "sun" : "gray"}>{PERSON_STATUS_LABEL[person.status]}</Badge>
                </li>
              )}
              {soon && (
                <li>
                  <Badge tone="sun">
                    <Icon.cake className="h-3 w-3" />
                    {birthdayPhrase(birthday.daysUntil)}
                  </Badge>
                </li>
              )}
              {shown.map((chip) => (
                <li key={chip.label}>
                  <Badge tone="navy">
                    {chip.lead && <Icon.star className="h-3 w-3 fill-sun-500 text-sun-600" aria-label="Koordinator" />}
                    {chip.label}
                  </Badge>
                </li>
              ))}
              {chips.length > shown.length && (
                <li className="px-1 py-0.5 text-[11px] font-semibold text-ink-soft">+{chips.length - shown.length}</li>
              )}
            </ul>
          )}
        </div>

        {person.phone && (
          <a
            href={whatsappLink(person.phone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${person.full_name}`}
            className="relative z-10 -mt-0.5 -mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-emerald-700 transition hover:bg-emerald-50"
          >
            <Icon.whatsapp className="h-[18px] w-[18px]" />
          </a>
        )}
      </div>
      {footer && <div className="relative z-10 border-t border-ink/[0.06] px-4 py-2">{footer}</div>}
    </article>
  );
}
