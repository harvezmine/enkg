import type { Metadata } from "next";
import Link from "next/link";

import { DbError } from "@/components/admin/db-error";
import { AdminPageHeader, Badge, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { TABLES, type LgMeeting } from "@/lib/db-types";
import { requireLeader } from "@/lib/leader-auth";
import { formatLongDate } from "@/lib/portal-format";
import { formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Pertemuan" };
export const dynamic = "force-dynamic";

type Row = Pick<LgMeeting, "id" | "starts_at" | "place" | "topic" | "reported_at" | "attendee_ids" | "guest_count">;

function MeetingCard({ meeting, past }: { meeting: Row; past: boolean }) {
  const present = meeting.attendee_ids.length + meeting.guest_count;
  return (
    <Link href={`/portal/pertemuan/${meeting.id}`} className="block">
      <Card className="p-4 transition hover:shadow-lift sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {past ? (
            meeting.reported_at ? (
              <Badge tone="green">Laporan terisi</Badge>
            ) : (
              <Badge tone="sun">Belum ada laporan</Badge>
            )
          ) : (
            <Badge tone="navy">Akan datang</Badge>
          )}
          {meeting.reported_at && <span className="text-xs text-ink-soft">{present} hadir</span>}
        </div>
        <p className="font-display mt-2 text-lg leading-snug font-bold text-ink">{formatLongDate(meeting.starts_at)}</p>
        <p className="mt-0.5 text-sm text-ink-soft">{[formatTime(meeting.starts_at), meeting.place].filter(Boolean).join(" · ")}</p>
        {meeting.topic && <p className="mt-2 text-sm font-medium text-ink">{meeting.topic}</p>}
      </Card>
    </Link>
  );
}

export default async function PortalMeetingsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const { supabase, lifeGroup } = await requireLeader();
  const { data, error } = await supabase
    .from(TABLES.lgMeetings)
    .select("id, starts_at, place, topic, reported_at, attendee_ids, guest_count")
    .eq("life_group_id", lifeGroup.id)
    .order("starts_at", { ascending: false })
    .limit(120);

  const meetings = (data ?? []) as Row[];
  const now = Date.now();
  const upcoming = meetings.filter((meeting) => new Date(meeting.starts_at).getTime() >= now).reverse();
  const past = meetings.filter((meeting) => new Date(meeting.starts_at).getTime() < now);

  const newButton = (
    <Link href="/portal/pertemuan/baru" className="btn btn-navy px-4 py-2.5 text-sm">
      <Icon.plus className="h-4 w-4" /> Jadwalkan
    </Link>
  );

  return (
    <>
      <AdminPageHeader
        title="Pertemuan"
        description={
          lifeGroup.show_on_calendar
            ? "Tampil di kalender gereja: nama grup, jam, dan wilayah saja."
            : "Hanya terlihat oleh kamu dan admin."
        }
        action={newButton}
      />
      {deleted && (
        <div className="mb-6">
          <Notice tone="success">Pertemuan dihapus.</Notice>
        </div>
      )}
      <DbError error={error} />

      {meetings.length ? (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="font-display mb-3 text-xl font-bold text-ink">Akan datang</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {upcoming.map((meeting) => (
                  <li key={meeting.id}>
                    <MeetingCard meeting={meeting} past={false} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="font-display mb-3 text-xl font-bold text-ink">Sudah lewat</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {past.map((meeting) => (
                  <li key={meeting.id}>
                    <MeetingCard meeting={meeting} past />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        !error && (
          <EmptyState
            title="Belum ada pertemuan"
            action={newButton}
          />
        )
      )}
    </>
  );
}
