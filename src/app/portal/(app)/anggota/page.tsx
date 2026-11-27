import type { Metadata } from "next";

import { DbError } from "@/components/admin/db-error";
import { AdminPageHeader, EmptyState, Notice } from "@/components/admin/ui";
import { MemberCard } from "@/components/portal/member-card";
import { groupMembers, requireLeader } from "@/lib/leader-auth";
import { birthMonth, todayWib } from "@/lib/people";
import { signPhotos } from "@/lib/people-data";
import { missingEssentials } from "@/lib/person-fields";

export const metadata: Metadata = { title: "Anggota" };
export const dynamic = "force-dynamic";

function Stat({ value, label, tone = "navy" }: { value: number; label: string; tone?: "navy" | "sun" }) {
  return (
    <div className={tone === "sun" ? "rounded-2xl bg-sun-400/15 p-3.5 ring-1 ring-sun-500/30" : "rounded-2xl bg-white p-3.5 ring-1 ring-ink/8"}>
      <p className="font-display tabular text-2xl leading-none font-bold text-ink">{value}</p>
      <p className="mt-1.5 text-xs leading-snug text-ink-soft">{label}</p>
    </div>
  );
}

export default async function PortalMembersPage({ searchParams }: { searchParams: Promise<{ diubah?: string }> }) {
  const { diubah } = await searchParams;
  const context = await requireLeader();
  const { members, error } = await groupMembers(context);
  const photos = await signPhotos(context.supabase, members.map((member) => member.photo_path));
  const today = todayWib();
  const thisMonth = Number(today.slice(5, 7));

  // Jemaat baru dulu supaya cepat disapa, lalu urut nama.
  const sorted = [...members].sort((a, b) => Number(b.status === "baru") - Number(a.status === "baru"));
  const newcomers = members.filter((member) => member.status === "baru").length;
  const birthdaysThisMonth = members.filter((member) => birthMonth(member.birth_date) === thisMonth).length;
  const incomplete = members.filter((member) => missingEssentials(member).length > 0).length;
  const updated = diubah ? members.find((member) => member.id === diubah) : undefined;

  return (
    <>
      <AdminPageHeader
        title="Anggota"
        description={`${members.length} orang di ${context.lifeGroup.name}. Kalau ada data yang berubah, ketuk tombol ubah di kartunya.`}
      />

      {updated && (
        <div className="mb-6">
          <Notice tone="success">Data {updated.nickname || updated.full_name} tersimpan.</Notice>
        </div>
      )}
      <DbError error={error} />

      {members.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3 lg:max-w-xl">
          <Stat value={newcomers} label="jemaat baru" tone={newcomers ? "sun" : "navy"} />
          <Stat value={birthdaysThisMonth} label="ulang tahun bulan ini" />
          <Stat value={incomplete} label="datanya belum lengkap" tone={incomplete ? "sun" : "navy"} />
        </div>
      )}

      {sorted.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map((member) => (
            <li key={member.id} className="min-w-0">
              <MemberCard
                member={member}
                photoUrl={member.photo_path ? photos.get(member.photo_path) : null}
                today={today}
                groupName={context.lifeGroup.name}
                highlight={member.id === diubah}
              />
            </li>
          ))}
        </ul>
      ) : (
        !error && <EmptyState title="Belum ada anggota" description="Admin gereja yang menambahkan anggota ke grup kamu." />
      )}
    </>
  );
}
