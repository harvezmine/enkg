import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { removeFromLifeGroup } from "@/app/actions/life-groups";
import { deletePerson, removeMembership, removeRelative, setMarriedOn } from "@/app/actions/people";
import { DbError } from "@/components/admin/db-error";
import { DeleteButton } from "@/components/admin/delete-button";
import { AssignLifeGroupForm } from "@/components/admin/life-group/forms";
import { AccountPanel, type AccountView } from "@/components/admin/people/account-panel";
import { PersonAvatar } from "@/components/admin/people/avatar";
import { FamilyTree } from "@/components/admin/people/family-tree";
import { FamilyForm, MembershipForm } from "@/components/admin/people/forms";
import { AdminPageHeader, Badge, Card, DateInput, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { getSession } from "@/lib/auth";
import {
  GENDER_LABEL,
  LIFE_GROUP_SEGMENT_LABEL,
  PERSON_STATUS_LABEL,
  TABLES,
  type ContactSubmission,
  type Person,
} from "@/lib/db-types";
import { ageOn, birthdayPhrase, familyOf, formatCalendarDate, formatDayMonth, nextBirthday, todayWib } from "@/lib/people";
import { indexDirectory, loadDirectory, signPhotos } from "@/lib/people-data";
import { scheduleLabel } from "@/lib/life-groups";
import { pickerOption, segmentFromLabel } from "@/lib/people-options";
import { cn, formatDate, formatDateShort } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Data jemaat" };
export const dynamic = "force-dynamic";

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className="mt-0.5 text-[15px] break-words text-ink">{children || <span className="text-ink-soft/60">Belum diisi</span>}</dd>
    </div>
  );
}

/** Formulir tambah yang terlipat, terbuka sendiri bila bagiannya masih kosong. */
function AddDisclosure({ label, open, children }: { label: string; open: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group mt-4 rounded-xl open:bg-cream-50 open:p-4">
      <summary className="-mx-1 flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl px-1 text-sm font-semibold text-navy-700 group-open:mx-0 group-open:mb-3 group-open:min-h-0 group-open:px-0 [&::-webkit-details-marker]:hidden">
        <Icon.plus className="h-4 w-4 transition group-open:rotate-45" />
        {label}
      </summary>
      {children}
    </details>
  );
}

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const supabase = await adminDb();
  const dir = await loadDirectory(supabase);

  if (dir.error) {
    return (
      <>
        <AdminPageHeader title="Data jemaat" backHref="/admin/jemaat" />
        <DbError error={dir.error} />
      </>
    );
  }

  const index = indexDirectory(dir);
  const person = index.peopleById.get(id);
  if (!person) notFound();

  const today = todayWib();
  const family = familyOf(person, dir.relationships, index.peopleById);
  const group = person.life_group_id ? index.groupsById.get(person.life_group_id) : undefined;
  const leaders = group
    ? dir.people.filter((p) => p.life_group_id === group.id && p.life_group_role === "leader" && p.id !== person.id)
    : [];
  const memberships = (index.membershipsByPerson.get(person.id) ?? [])
    .map((member) => ({ member, team: index.teamsById.get(member.team_id)! }))
    .filter(({ team }) => team)
    .sort((a, b) => a.team.sort_order - b.team.sort_order);

  const isLeader = person.life_group_role === "leader" && Boolean(group);
  const [photos, submission, account, session] = await Promise.all([
    signPhotos(supabase, [person.photo_path, ...family.map((m) => m.person.photo_path), ...leaders.map((l) => l.photo_path)]),
    person.submission_id
      ? supabase.from(TABLES.submissions).select("*").eq("id", person.submission_id).maybeSingle()
      : Promise.resolve({ data: null }),
    // password_hash tidak pernah diambil.
    supabase
      .from(TABLES.accounts)
      .select("id, email, name, person_id, is_admin, is_active, must_change_password, last_login_at, created_at, updated_at")
      .eq("person_id", person.id)
      .maybeSingle(),
    getSession(),
  ]);
  const linkedAccount = account.data as AccountView | null;
  const photo = (p: Person) => (p.photo_path ? photos.get(p.photo_path) : null);
  const from = submission.data as ContactSubmission | null;

  const age = person.birth_date ? ageOn(person.birth_date, today) : null;
  const birthday = person.birth_date ? nextBirthday(person.birth_date, today) : null;
  const firstName = person.nickname || person.full_name.split(" ")[0]!;
  const spouses = family
    .filter((m) => m.as === "pasangan")
    .map((member) => ({ member, marriedOn: dir.relationships.find((r) => r.id === member.relationshipId)?.married_on ?? null }));
  const relatedIds = new Set([person.id, ...family.map((m) => m.person.id)]);
  const familyOptions = dir.people.filter((p) => !relatedIds.has(p.id)).map((p) => pickerOption(p, today, index.groupsById));
  const joinedTeams = new Set(memberships.map(({ team }) => team.id));
  const groupOptions = dir.lifeGroups
    .filter((g) => g.is_active)
    .map((g) => ({
      id: g.id,
      name: g.name,
      segment: g.segment,
      leaders: dir.people
        .filter((p) => p.life_group_id === g.id && p.life_group_role === "leader")
        .map((p) => p.nickname || p.full_name.split(" ")[0])
        .join(", "),
    }));

  return (
    <>
      <AdminPageHeader
        title={person.full_name}
        backHref="/admin/jemaat"
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/jemaat/${person.id}/ubah`} className="btn btn-navy px-4 py-2.5 text-sm">
              <Icon.edit className="h-4 w-4" /> Ubah data
            </Link>
            {person.phone && (
              <a href={whatsappLink(person.phone)} target="_blank" rel="noopener noreferrer" className="btn btn-wa px-4 py-2.5 text-sm">
                <Icon.whatsapp className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        }
      />


      <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:gap-8">
        {/* ── Profil ─────────────────────────────────────────────────────── */}
        <aside className="space-y-4">
          <Card className="space-y-4 p-4 sm:p-5">
            {/* HP: foto kecil di samping lencana. Layar lebar: foto besar kalau ada. */}
            <div className="flex items-center gap-4 lg:flex-col lg:items-start">
              <PersonAvatar
                person={person}
                photoUrl={photo(person)}
                className={cn(
                  "h-20 w-20 shrink-0 rounded-2xl text-2xl",
                  photo(person) ? "lg:aspect-4/5 lg:h-auto lg:w-full" : "lg:h-24 lg:w-24 lg:rounded-full lg:text-3xl",
                )}
              />
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={person.status === "aktif" ? "green" : person.status === "baru" ? "sun" : "gray"}>
                  {PERSON_STATUS_LABEL[person.status]}
                </Badge>
                {memberships.length > 0 && <Badge tone="navy">Pelayan</Badge>}
                {person.life_group_role === "leader" && group && <Badge tone="navy">Leader LG</Badge>}
              </div>
            </div>

            {birthday && (
              <div className={cn("rounded-xl p-3.5", birthday.daysUntil <= 7 ? "bg-sun-400/20" : "bg-cream-100")}>
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Icon.cake className="h-4 w-4 text-navy-700" />
                  {formatDayMonth(person.birth_date!)}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {birthday.daysUntil === 0
                    ? `Hari ini ulang tahun ke-${birthday.turning}`
                    : `Ulang tahun ke-${birthday.turning}, ${birthdayPhrase(birthday.daysUntil).toLowerCase()}`}
                </p>
              </div>
            )}

            {from && (
              <p className="text-xs leading-relaxed text-ink-soft">
                Terdaftar dari kiriman Gabung Life Group, {formatDate(from.created_at)}.
              </p>
            )}
            {person.edited_by && (
              <p className="text-xs leading-relaxed text-ink-soft">
                Terakhir diubah oleh {person.edited_by}, {formatDateShort(person.updated_at)}.
              </p>
            )}
          </Card>
        </aside>

        <div className="min-w-0 space-y-6">
          {/* ── Data diri ───────────────────────────────────────────────── */}
          <Section title="Data diri">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Detail label="Nama panggilan">{person.nickname}</Detail>
              <Detail label="Jenis kelamin">{person.gender ? GENDER_LABEL[person.gender] : null}</Detail>
              <div className="col-span-2 sm:col-span-1">
                <Detail label="Tempat, tanggal lahir">
                  {[person.birth_place, formatCalendarDate(person.birth_date)].filter(Boolean).join(", ")}
                </Detail>
              </div>
              <Detail label="Umur">{age !== null ? `${age} tahun` : null}</Detail>
              <Detail label="WhatsApp">
                {person.phone && (
                  <a href={whatsappLink(person.phone)} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-700 hover:underline">
                    {person.phone}
                  </a>
                )}
              </Detail>
              <div className="col-span-2 sm:col-span-1">
                <Detail label="Email">
                  {person.email && (
                    <a href={`mailto:${person.email}`} className="font-semibold text-navy-700 hover:underline">
                      {person.email}
                    </a>
                  )}
                </Detail>
              </div>
              <div className="col-span-2">
                <Detail label="Alamat">{person.address && <span className="whitespace-pre-line">{person.address}</span>}</Detail>
              </div>
              <Detail label="Wilayah">{person.area}</Detail>
              <Detail label="Pekerjaan atau sekolah">{person.occupation}</Detail>
              <Detail label="Mulai beribadah di ENKG">{formatCalendarDate(person.joined_on)}</Detail>
              <Detail label="Baptis">{formatCalendarDate(person.baptized_on)}</Detail>
            </dl>
          </Section>

          {/* ── Life Group ──────────────────────────────────────────────── */}
          <Section
            title="Life Group"
            action={
              group && (
                <form action={removeFromLifeGroup}>
                  <input type="hidden" name="person_id" value={person.id} />
                  <input type="hidden" name="life_group_id" value={group.id} />
                  <button type="submit" className="-mr-2 inline-flex h-10 items-center rounded-full px-3 text-xs font-semibold text-ink-soft transition hover:text-red-700">
                    Keluarkan dari grup
                  </button>
                </form>
              )
            }
          >
            {group ? (
              <div className="space-y-4">
                <Link
                  href={`/admin/life-group/${group.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-navy-50 p-4 transition hover:bg-navy-100"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{group.name}</span>
                    <span className="mt-0.5 block text-xs text-ink-soft">
                      {[
                        person.life_group_role === "leader" ? "Leader" : "Anggota",
                        group.segment ? LIFE_GROUP_SEGMENT_LABEL[group.segment] : null,
                        scheduleLabel(group),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <Icon.arrowRight className="h-4 w-4 shrink-0 text-navy-700" />
                </Link>
                {leaders.length > 0 && (
                  <ul className="space-y-2">
                    {leaders.map((leader) => (
                      <li key={leader.id} className="flex items-center gap-3">
                        <PersonAvatar person={leader} photoUrl={photo(leader)} className="h-9 w-9 shrink-0 rounded-full text-xs" />
                        <Link href={`/admin/jemaat/${leader.id}`} className="min-w-0 flex-1 text-sm hover:underline">
                          <span className="block truncate font-semibold text-ink">{leader.full_name}</span>
                          <span className="block text-xs text-ink-soft">Leader</span>
                        </Link>
                        {leader.phone && (
                          <a
                            href={whatsappLink(
                              leader.phone,
                              `Halo ${leader.nickname || leader.full_name.split(" ")[0]}, ada anggota ${group.name}: ${person.full_name}${person.phone ? ` (WA ${person.phone})` : ""}. Tolong disapa ya. Terima kasih!`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                          >
                            <Icon.whatsapp className="h-4 w-4" />
                            Kabari
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-ink-soft">
                  {firstName} belum masuk Life Group
                  {from?.life_group ? `. Di form Contact Us memilih ${from.life_group}.` : "."}
                </p>
                <AssignLifeGroupForm personId={person.id} groups={groupOptions} suggested={segmentFromLabel(from?.life_group)} />
              </div>
            )}
          </Section>

          {(isLeader || linkedAccount) && (
            <div id="akun-portal" className="scroll-mt-24">
              <Section title="Akun login">
                <AccountPanel
                  person={person}
                  account={linkedAccount}
                  leaderOf={isLeader ? group!.name : null}
                  isSelf={linkedAccount?.id === session?.account.id}
                />
              </Section>
            </div>
          )}

          {/* ── Keluarga ────────────────────────────────────────────────── */}
          <Section title="Keluarga">
            {family.length ? (
              <>
                <FamilyTree viewer={person} members={family} photos={photos} />
                {spouses.length > 0 && (
                  <ul className="mt-5 space-y-2">
                    {spouses.map(({ member, marriedOn }) => {
                      const next = marriedOn ? nextBirthday(marriedOn, today) : null;
                      return (
                        <li key={member.relationshipId} className="rounded-xl bg-cream-50 p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="flex items-center gap-2 text-sm text-ink">
                              <Icon.heart className="h-4 w-4 shrink-0 text-navy-700" />
                              {marriedOn ? (
                                <span>
                                  Menikah dengan {member.person.nickname || member.person.full_name}, {formatCalendarDate(marriedOn)}
                                  <span className="block text-xs text-ink-soft">
                                    {next!.daysUntil === 0
                                      ? `Hari ini anniversary ke-${next!.turning}`
                                      : `Anniversary ke-${next!.turning}, ${birthdayPhrase(next!.daysUntil).toLowerCase()}`}
                                  </span>
                                </span>
                              ) : (
                                <span>Tanggal menikah dengan {member.person.nickname || member.person.full_name} belum diisi</span>
                              )}
                            </p>
                            <details className="group">
                              <summary className="cursor-pointer list-none rounded-full px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-white [&::-webkit-details-marker]:hidden">
                                {marriedOn ? "Ubah" : "Isi tanggal"}
                              </summary>
                              <form action={setMarriedOn} className="mt-2 flex w-72 max-w-full items-center gap-2">
                                <input type="hidden" name="id" value={member.relationshipId} />
                                <DateInput name="married_on" defaultValue={marriedOn} max={today} startView="year" aria-label="Tanggal menikah" />
                                <button type="submit" className="btn btn-navy px-3 py-1.5 text-xs">
                                  Simpan
                                </button>
                              </form>
                            </details>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <details className="group mt-5">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
                    Hapus hubungan keluarga
                  </summary>
                  <ul className="mt-3 divide-y divide-ink/8 rounded-xl ring-1 ring-ink/8">
                    {family.map((member) => (
                      <li key={member.relationshipId} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="min-w-0 truncate text-sm text-ink">
                          <span className="text-ink-soft">{member.label}:</span> {member.person.full_name}
                        </span>
                        <form action={removeRelative}>
                          <input type="hidden" name="id" value={member.relationshipId} />
                          <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                            Hapus
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <p className="text-sm text-ink-soft">Belum ada keluarga yang tercatat.</p>
            )}

            <AddDisclosure label="Tambah anggota keluarga" open={family.length === 0}>
              <FamilyForm
                personId={person.id}
                firstName={firstName}
                options={familyOptions}
                spouses={family.filter((m) => m.as === "pasangan").map((m) => ({ id: m.person.id, name: m.person.full_name }))}
              />
            </AddDisclosure>
          </Section>

          {/* ── Pelayanan ───────────────────────────────────────────────── */}
          <Section title="Pelayanan">
            {memberships.length ? (
              <ul className="flex flex-wrap gap-2">
                {memberships.map(({ member, team }) => (
                  <li key={member.id} className="inline-flex items-center gap-1 rounded-full bg-navy-50 py-1 pr-1 pl-3 text-sm ring-1 ring-navy-200/60">
                    <Link href={`/admin/pelayanan/${team.id}`} className="inline-flex items-center gap-1.5 font-semibold text-navy-800 hover:underline">
                      {member.is_lead && <Icon.star className="h-3.5 w-3.5 fill-sun-500 text-sun-600" aria-label="Koordinator" />}
                      {team.name}
                    </Link>
                    {member.role && <span className="text-navy-700/70">· {member.role}</span>}
                    <form action={removeMembership}>
                      <input type="hidden" name="id" value={member.id} />
                      <button
                        type="submit"
                        aria-label={`Keluarkan dari ${team.name}`}
                        className="grid h-7 w-7 place-items-center rounded-full text-navy-700/60 transition hover:bg-white hover:text-red-700"
                      >
                        <Icon.close className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">{firstName} belum tercatat di tim pelayanan mana pun.</p>
            )}

            <AddDisclosure label="Tambah pelayanan" open={memberships.length === 0}>
              <MembershipForm personId={person.id} teams={dir.teams.map((t) => ({ id: t.id, name: t.name, joined: joinedTeams.has(t.id) }))} />
            </AddDisclosure>
          </Section>

          {person.notes && (
            <Section title="Catatan pengurus">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-ink">{person.notes}</p>
            </Section>
          )}

          <div className="flex justify-end">
            <DeleteButton action={deletePerson} id={person.id} label="Hapus data jemaat" />
          </div>
        </div>
      </div>
    </>
  );
}

