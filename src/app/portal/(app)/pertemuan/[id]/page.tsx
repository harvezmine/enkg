import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteMeeting } from "@/app/actions/portal";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader, Badge, Card, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { MeetingForm, ReportForm } from "@/components/portal/forms";
import { TABLES, type LgMeeting } from "@/lib/db-types";
import { groupMembers, requireLeader } from "@/lib/leader-auth";
import { signPhotos } from "@/lib/people-data";
import { groupMaterial, groupMaterials } from "@/lib/portal-data";
import { formatLongDate } from "@/lib/portal-format";
import { formatDateTime, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Pertemuan" };
export const dynamic = "force-dynamic";

/** Sama dengan REPORT_EARLY_MS di actions/portal.ts. */
const REPORT_EARLY_MS = 60 * 60 * 1000;

export default async function PortalMeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; laporan?: string }>;
}) {
  const [{ id }, { saved, laporan }] = await Promise.all([params, searchParams]);
  const context = await requireLeader();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await context.supabase
    .from(TABLES.lgMeetings)
    .select("*")
    .eq("id", id)
    .eq("life_group_id", context.lifeGroup.id)
    .maybeSingle();
  if (!data) notFound();
  const meeting = data as LgMeeting;

  const [{ members }, { materials }, material] = await Promise.all([
    groupMembers(context),
    groupMaterials(context),
    meeting.material_id ? groupMaterial(context, meeting.material_id) : Promise.resolve(null),
  ]);
  const photos = await signPhotos(context.supabase, members.map((member) => member.photo_path));

  const canReport = new Date(meeting.starts_at).getTime() - REPORT_EARLY_MS <= Date.now();
  const memberIds = new Set(members.map((member) => member.id));
  // Anggota yang sudah keluar grup tetap terhitung di laporan lama, tapi tidak bisa dicentang ulang.
  const formerAttendees = meeting.attendee_ids.filter((attendee) => !memberIds.has(attendee)).length;

  return (
    <>
      <AdminPageHeader
        title={formatLongDate(meeting.starts_at)}
        description={[formatTime(meeting.starts_at), meeting.place].filter(Boolean).join(" · ")}
        backHref="/portal/pertemuan"
      />

      {saved && (
        <div className="mb-6">
          <Notice tone="success">Jadwal pertemuan tersimpan.</Notice>
        </div>
      )}
      {laporan && (
        <div className="mb-6">
          <Notice tone="success">Laporan terkirim. Terima kasih sudah melayani!</Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <section id="laporan" className="scroll-mt-24 lg:col-span-7">
          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-ink">Laporan</h2>
              {meeting.reported_at ? (
                <Badge tone="green">Dikirim {formatDateTime(meeting.reported_at)}</Badge>
              ) : (
                <Badge tone={canReport ? "sun" : "gray"}>{canReport ? "Belum diisi" : "Setelah pertemuan"}</Badge>
              )}
            </div>
            {canReport ? (
              <>
                {formerAttendees > 0 && (
                  <p className="mb-4 text-xs text-ink-soft">
                    {formerAttendees} orang yang tercatat hadir sudah tidak lagi di grup ini.
                  </p>
                )}
                <ReportForm
                  meetingId={meeting.id}
                  members={members.map((member) => ({
                    id: member.id,
                    full_name: member.full_name,
                    nickname: member.nickname,
                    photoUrl: member.photo_path ? (photos.get(member.photo_path) ?? null) : null,
                  }))}
                  defaults={{
                    attendee_ids: meeting.attendee_ids.filter((attendee) => memberIds.has(attendee)),
                    guest_count: meeting.guest_count,
                    report: meeting.report,
                    prayer_requests: meeting.prayer_requests,
                    reported: Boolean(meeting.reported_at),
                  }}
                />
              </>
            ) : (
              <p className="text-sm leading-relaxed text-ink-soft">
                Laporan bisa diisi mulai satu jam sebelum pertemuan. Sampai ketemu di pertemuannya!
              </p>
            )}
          </Card>
        </section>

        <aside className="space-y-4 lg:col-span-5">
          {material && (
            <Card className="p-5">
              <h2 className="font-display text-lg font-bold text-ink">Materi</h2>
              <p className="mt-1 text-sm text-ink">{material.title}</p>
              <Link href={`/portal/materi/${material.id}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700">
                Buka materi <Icon.arrowRight className="h-4 w-4" />
              </Link>
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <h2 className="font-display mb-4 text-lg font-bold text-ink">Ubah jadwal</h2>
            <MeetingForm
              meeting={{
                id: meeting.id,
                starts_at: meeting.starts_at,
                place: meeting.place,
                topic: meeting.topic,
                material_id: meeting.material_id,
              }}
              materials={materials.map(({ id: materialId, title }) => ({ id: materialId, title }))}
            />
          </Card>

          <div className="flex justify-end">
            <DeleteButton action={deleteMeeting} id={meeting.id} label="Hapus pertemuan" />
          </div>
        </aside>
      </div>
    </>
  );
}
