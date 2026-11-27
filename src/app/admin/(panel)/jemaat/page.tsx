import type { Metadata } from "next";
import Link from "next/link";

import { DbError } from "@/components/admin/db-error";
import { DirectoryFilters, type DirectoryFilterValues } from "@/components/admin/people/directory-filters";
import { PersonCard } from "@/components/admin/people/person-card";
import { AdminPageHeader, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { PERSON_STATUS_LABEL } from "@/lib/db-types";
import { birthMonth, familyOf, familySummary, matchesQuery, monthName, todayWib } from "@/lib/people";
import { indexDirectory, loadDirectory, signPhotos, teamChips } from "@/lib/people-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Data jemaat" };
export const dynamic = "force-dynamic";

type Params = Partial<Record<keyof DirectoryFilterValues | "saved" | "deleted", string>>;

export default async function JemaatPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const month = Number(params.bulan);
  const values: DirectoryFilterValues = {
    q: (params.q ?? "").slice(0, 80),
    status: params.status && params.status in PERSON_STATUS_LABEL ? params.status : "",
    tim: (params.tim ?? "").slice(0, 60),
    lg: (params.lg ?? "").slice(0, 60),
    bulan: Number.isInteger(month) && month >= 1 && month <= 12 ? String(month) : "",
  };

  const supabase = await adminDb();
  const dir = await loadDirectory(supabase);
  const index = indexDirectory(dir);
  const today = todayWib();

  let people = dir.people.filter((person) =>
    matchesQuery(person, values.q, person.life_group_id ? index.groupsById.get(person.life_group_id)?.name : null),
  );
  if (values.status) people = people.filter((person) => person.status === values.status);
  if (values.tim) {
    const serving = (id: string) => index.membershipsByPerson.has(id);
    people = people.filter((person) =>
      values.tim === "pelayan"
        ? serving(person.id)
        : values.tim === "bukan"
          ? !serving(person.id)
          : index.membershipsByPerson.get(person.id)?.some((member) => member.team_id === values.tim),
    );
  }
  if (values.lg) {
    people = people.filter((person) => (values.lg === "belum" ? !person.life_group_id : person.life_group_id === values.lg));
  }
  if (values.bulan) {
    // Urut tanggal supaya langsung terbaca sebagai daftar ulang tahun bulan itu.
    people = people
      .filter((person) => birthMonth(person.birth_date) === month)
      .sort((a, b) => a.birth_date!.slice(8).localeCompare(b.birth_date!.slice(8)));
  }

  const photos = await signPhotos(supabase, people.map((person) => person.photo_path));
  const servingCount = dir.people.filter((person) => index.membershipsByPerson.has(person.id)).length;
  const filtered = Object.values(values).some(Boolean);

  const newButton = (
    <Link href="/admin/jemaat/baru" className="btn btn-navy px-4 py-2.5 text-sm">
      <Icon.plus className="h-4 w-4" /> Jemaat baru
    </Link>
  );
  const thisMonth = Number(today.slice(5, 7));
  const shortcuts = [
    { label: "Jemaat baru", count: dir.people.filter((p) => p.status === "baru").length, href: "?status=baru", active: values.status === "baru" },
    { label: "Belum punya Life Group", count: dir.people.filter((p) => !p.life_group_id).length, href: "?lg=belum", active: values.lg === "belum" },
    { label: "Pelayan", count: servingCount, href: "?tim=pelayan", active: values.tim === "pelayan" },
    {
      label: `Lahir bulan ${monthName(thisMonth)}`,
      count: dir.people.filter((p) => birthMonth(p.birth_date) === thisMonth).length,
      href: `?bulan=${thisMonth}`,
      active: values.bulan === String(thisMonth),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Data jemaat"
        description={
          dir.people.length ? `${dir.people.length} orang · ${servingCount} melayani` : undefined
        }
        action={
          <div className="flex flex-wrap gap-2">
            {newButton}
            <Link href="/admin/jemaat/impor" className="btn btn-outline px-4 py-2.5 text-sm">
              Impor Excel
            </Link>
            {dir.people.length > 0 && (
              <a href="/admin/jemaat-excel/ekspor" className="btn btn-outline px-4 py-2.5 text-sm">
                Ekspor
              </a>
            )}
          </div>
        }
      />

      <DbError error={dir.error} />

      {dir.people.length > 0 && (
        <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Pintasan">
          {shortcuts.map((item) => (
            <Link
              key={item.label}
              href={item.active ? "/admin/jemaat" : `/admin/jemaat${item.href}`}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-1.5 pl-3.5 text-sm font-semibold ring-1 transition",
                item.active ? "bg-navy-700 text-cream-100 ring-navy-700" : "bg-white text-ink ring-ink/10 hover:ring-ink/25",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "tabular grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs",
                  item.active ? "bg-white/15 text-cream-100" : "bg-cream-100 text-ink-soft",
                )}
              >
                {item.count}
              </span>
            </Link>
          ))}
        </nav>
      )}

      {dir.people.length > 0 && (
        // Remount saat pintasan dipakai supaya pilihan filter ikut berubah; tidak
        // memakai `q` di key, karena mengetik di kotak cari tidak boleh kehilangan fokus.
        <DirectoryFilters
          key={[values.status, values.tim, values.lg, values.bulan].join("|")}
          values={values}
          teams={dir.teams.map(({ id, name }) => ({ id, name }))}
          lifeGroups={dir.lifeGroups.map(({ id, name }) => ({ id, name }))}
        />
      )}

      {filtered && dir.people.length > 0 && (
        <p className="mb-4 text-sm text-ink-soft" aria-live="polite">
          {people.length ? `${people.length} orang cocok` : "Tidak ada yang cocok"}
        </p>
      )}

      {people.length ? (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {people.map((person) => (
            <li key={person.id}>
              <PersonCard
                person={person}
                photoUrl={person.photo_path ? photos.get(person.photo_path) : null}
                today={today}
                chips={teamChips(person.id, index)}
                family={familySummary(familyOf(person, dir.relationships, index.peopleById))}
              />
            </li>
          ))}
        </ul>
      ) : (
        !dir.error &&
        !filtered && (
          <EmptyState title="Belum ada data jemaat" />
        )
      )}
    </>
  );
}
