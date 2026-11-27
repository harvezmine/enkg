import type { Metadata } from "next";
import Link from "next/link";

import { DbError } from "@/components/admin/db-error";
import { PersonAvatar } from "@/components/admin/people/avatar";
import { TeamForm } from "@/components/admin/people/forms";
import { AdminPageHeader, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import type { Person } from "@/lib/db-types";
import { indexDirectory, loadDirectory, signPhotos } from "@/lib/people-data";

export const metadata: Metadata = { title: "Pelayanan" };
export const dynamic = "force-dynamic";

const firstName = (p: Person) => p.nickname || p.full_name.split(" ")[0]!;

export default async function PelayananPage({ searchParams }: { searchParams: Promise<{ baru?: string; deleted?: string }> }) {
  const params = await searchParams;
  const supabase = await adminDb();
  const dir = await loadDirectory(supabase);
  const index = indexDirectory(dir);

  const teams = dir.teams.map((team) => {
    const members = dir.members
      .filter((m) => m.team_id === team.id)
      .flatMap((m) => {
        const person = index.peopleById.get(m.person_id);
        return person ? [{ member: m, person }] : [];
      })
      .sort((a, b) => Number(b.member.is_lead) - Number(a.member.is_lead));
    return { team, members };
  });

  const photos = await signPhotos(supabase, teams.flatMap(({ members }) => members.slice(0, 6).map(({ person }) => person.photo_path)));
  const serving = new Set(dir.members.map((m) => m.person_id)).size;

  return (
    <>
      <AdminPageHeader
        title="Pelayanan"
        description={`${serving} orang melayani di ${dir.teams.length} tim. Satu orang boleh ada di beberapa tim.`}
        action={
          !params.baru && (
            <Link href="/admin/pelayanan?baru=1" className="btn btn-navy px-4 py-2.5 text-sm">
              <Icon.plus className="h-4 w-4" /> Tim baru
            </Link>
          )
        }
      />
      <DbError error={dir.error} />
      {params.deleted && (
        <div className="mb-6">
          <Notice tone="success">Tim sudah dihapus. Data jemaatnya tetap aman.</Notice>
        </div>
      )}

      {params.baru && (
        <Card className="mb-8 p-4 sm:p-6">
          <h2 className="font-display mb-5 text-lg font-bold text-ink">Tim baru</h2>
          <TeamForm cancelHref="/admin/pelayanan" />
        </Card>
      )}

      {teams.length ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map(({ team, members }) => {
            const leads = members.filter(({ member }) => member.is_lead);
            return (
              <li key={team.id}>
                <Link href={`/admin/pelayanan/${team.id}`} className="block h-full">
                  <Card className="flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-display text-lg leading-snug font-bold text-ink">{team.name}</h2>
                        {team.description && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{team.description}</p>}
                      </div>
                      <p className="font-display tabular shrink-0 text-right text-3xl leading-none font-bold text-navy-700">
                        {members.length}
                        <span className="mt-1 block text-[11px] font-medium text-ink-soft">orang</span>
                      </p>
                    </div>
                    <div className="mt-auto flex items-center gap-3 pt-5">
                      {members.length > 0 ? (
                        <>
                          <div className="flex -space-x-2.5">
                            {members.slice(0, 6).map(({ person }) => (
                              <PersonAvatar
                                key={person.id}
                                person={person}
                                photoUrl={person.photo_path ? photos.get(person.photo_path) : null}
                                className="h-9 w-9 rounded-full text-[11px] ring-2 ring-white"
                              />
                            ))}
                          </div>
                          {leads.length > 0 && (
                            <p className="min-w-0 text-xs leading-snug text-ink-soft">
                              Koordinator: <span className="font-semibold text-ink">{leads.map(({ person }) => firstName(person)).join(", ")}</span>
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-ink-soft">Belum ada anggota</p>
                      )}
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        !dir.error && (
          <EmptyState
            title="Belum ada tim pelayanan"
            description="Buat tim seperti Musisi, Usher, atau Multimedia, lalu masukkan para pelayannya."
          />
        )
      )}
    </>
  );
}
