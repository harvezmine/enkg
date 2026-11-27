import Link from "next/link";

import { PersonAvatar } from "@/components/admin/people/avatar";
import { Badge } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { PERSON_STATUS_LABEL } from "@/lib/db-types";
import type { PortalMember } from "@/lib/leader-auth";
import { ageOn, birthdayPhrase, formatDayMonth, nextBirthday } from "@/lib/people";
import { missingEssentials } from "@/lib/person-fields";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

const iconButton =
  "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-700 transition hover:bg-navy-700 hover:text-cream-100";

/**
 * Kartu anggota untuk leader: cukup untuk menyapa, mengingat ulang tahun,
 * dan berkunjung. Data diri bisa diperbarui leader lewat tombol Ubah.
 */
export function MemberCard({
  member,
  photoUrl,
  today,
  groupName,
  highlight = false,
}: {
  member: PortalMember;
  photoUrl?: string | null;
  today: string;
  groupName: string;
  /** Baru saja diubah: kartunya ditandai supaya mudah ditemukan. */
  highlight?: boolean;
}) {
  const age = member.birth_date ? ageOn(member.birth_date, today) : null;
  const birthday = member.birth_date ? nextBirthday(member.birth_date, today) : null;
  const firstName = member.nickname || member.full_name.split(" ")[0];
  const greeting = `Halo ${firstName}, ini dari Life Group ${groupName}.`;
  const missing = missingEssentials(member);
  const editHref = `/portal/anggota/${member.id}/ubah`;
  const mapUrl = member.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([member.address, member.area].filter(Boolean).join(", "))}`
    : null;

  return (
    <article
      id={`anggota-${member.id}`}
      className={cn(
        "flex h-full scroll-mt-24 flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 transition",
        highlight ? "ring-2 ring-navy-700" : "ring-ink/8",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-cream-100">
        <PersonAvatar person={member} photoUrl={photoUrl} className="h-full w-full text-4xl sm:text-5xl" />
        {birthday && birthday.daysUntil <= 7 && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-sun-500 px-2.5 py-1 text-[11px] font-bold text-ink shadow-soft">
            <Icon.cake className="h-3.5 w-3.5" />
            {birthdayPhrase(birthday.daysUntil)}
          </span>
        )}
        {highlight && (
          <span className="absolute right-2.5 bottom-2.5 rounded-full bg-navy-700 px-2.5 py-1 text-[11px] font-semibold text-cream-100 shadow-soft">
            Baru diperbarui
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {(member.life_group_role === "leader" || member.status !== "aktif") && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {member.life_group_role === "leader" && <Badge tone="navy">Leader</Badge>}
            {member.status === "baru" && <Badge tone="sun">{PERSON_STATUS_LABEL.baru}</Badge>}
            {member.status !== "baru" && member.status !== "aktif" && <Badge tone="gray">{PERSON_STATUS_LABEL[member.status]}</Badge>}
          </div>
        )}
        <h3 className="font-display text-[15px] leading-snug font-bold text-ink sm:text-base">{member.full_name}</h3>
        <p className="mt-0.5 text-xs text-ink-soft">
          {[member.nickname, age !== null ? `${age} tahun` : null].filter(Boolean).join(" · ") || " "}
        </p>
        {member.birth_date && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-soft">
            <Icon.cake className="h-3.5 w-3.5 shrink-0" />
            {formatDayMonth(member.birth_date)}
          </p>
        )}
        {(member.address || member.area) && (
          <p className="mt-1.5 flex items-start gap-1 text-xs leading-snug text-ink-soft">
            <Icon.mapPin className="mt-px h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{[member.address, member.area].filter(Boolean).join(", ")}</span>
          </p>
        )}

        {missing.length > 0 && (
          <Link
            href={editHref}
            className="mt-2.5 rounded-lg bg-sun-400/15 px-2.5 py-1.5 text-[11px] leading-snug text-ink ring-1 ring-sun-500/30 transition hover:bg-sun-400/25"
          >
            Belum ada {missing.join(", ")}. <span className="font-semibold text-navy-700">Lengkapi</span>
          </Link>
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-3">
          {member.phone && (
            <a
              href={whatsappLink(member.phone, greeting)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat WhatsApp ${member.full_name}`}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white sm:px-3"
            >
              <Icon.whatsapp className="h-4 w-4" />
              {/* Di HP dua kolom kartunya sempit: cukup ikon. */}
              <span className="hidden sm:inline">Chat</span>
            </a>
          )}
          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`Peta alamat ${member.full_name}`} className={iconButton}>
              <Icon.mapPin className="h-4 w-4" />
            </a>
          )}
          {member.email && (
            <a href={`mailto:${member.email}`} aria-label={`Email ${member.full_name}`} className={cn(iconButton, "hidden sm:grid")}>
              <Icon.mail className="h-4 w-4" />
            </a>
          )}
          <Link href={editHref} aria-label={`Ubah data ${member.full_name}`} className={cn(iconButton, "ml-auto")}>
            <Icon.edit className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
