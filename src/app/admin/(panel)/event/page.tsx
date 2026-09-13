import type { Metadata } from "next";
import Link from "next/link";

import { deleteEvent, toggleEvent } from "@/app/actions/admin";
import { DbError } from "@/components/admin/db-error";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader, Badge, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { EVENT_CATEGORY_LABEL, TABLES, type ChurchEvent, type EventCategory } from "@/lib/db-types";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Event & ProCon" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "gereja", label: "Event gereja" },
  { key: "procon", label: "ProCon" },
] as const;

export default async function AdminEventPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; kategori?: string }>;
}) {
  const { saved, kategori } = await searchParams;
  const active = kategori === "gereja" || kategori === "procon" ? (kategori as EventCategory) : null;

  const supabase = await adminDb();
  let query = supabase.from(TABLES.events).select("*").order("starts_at", { ascending: false, nullsFirst: true });
  if (active) query = query.eq("category", active);
  const { data, error } = await query;
  const events = (data ?? []) as ChurchEvent[];
  const now = Date.now();

  const newButton = (
    <Link href={`/admin/event/baru${active === "procon" ? "?kategori=procon" : ""}`} className="btn btn-navy px-4 py-2.5 text-sm">
      <Icon.plus className="h-4 w-4" /> {active === "procon" ? "ProCon baru" : "Event baru"}
    </Link>
  );

  return (
    <>
      <AdminPageHeader
        title="Event & ProCon"
        description="Event gereja tampil di section News; ProCon tampil di section ProCon News."
        action={newButton}
      />

      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-ink/8 sm:w-fit" aria-label="Filter jenis event">
        {FILTERS.map((filter) => {
          const selected = (active ?? "semua") === filter.key;
          return (
            <Link
              key={filter.key}
              href={filter.key === "semua" ? "/admin/event" : `/admin/event?kategori=${filter.key}`}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition",
                selected ? "bg-navy-700 text-cream-100" : "text-ink-soft hover:text-ink",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {saved && (
        <div className="mb-6">
          <Notice tone="success">Tersimpan. Halaman utama sudah diperbarui.</Notice>
        </div>
      )}
      <DbError error={error} />

      {events.length ? (
        <ul className="space-y-3">
          {events.map((event) => {
            const past = event.starts_at ? new Date(event.ends_at ?? event.starts_at).getTime() < now : false;
            return (
              <li key={event.id}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={event.published ? "green" : "gray"}>{event.published ? "Terbit" : "Draf"}</Badge>
                    <Badge tone={event.category === "procon" ? "sun" : "navy"}>{EVENT_CATEGORY_LABEL[event.category]}</Badge>
                    {event.topic && <Badge tone="gray">{event.topic}</Badge>}
                    {past && <Badge tone="gray">Sudah lewat</Badge>}
                  </div>
                  <h2 className="font-display mt-2.5 text-lg leading-snug font-bold text-ink">{event.title}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon.calendar className="h-4 w-4" />
                      {event.starts_at ? formatDateTime(event.starts_at) : "Segera hadir"}
                    </span>
                    {event.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <Icon.mapPin className="h-4 w-4" />
                        {event.location}
                      </span>
                    )}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-ink/8 pt-3">
                    <Link href={`/admin/event/${event.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-navy-50 px-3 text-xs font-semibold text-navy-700">
                      <Icon.edit className="h-4 w-4" /> Ubah
                    </Link>
                    <form action={toggleEvent}>
                      <input type="hidden" name="id" value={event.id} />
                      <input type="hidden" name="next" value={event.published ? "false" : "true"} />
                      <button type="submit" className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-ink-soft transition hover:bg-cream-100">
                        {event.published ? "Jadikan draf" : "Terbitkan"}
                      </button>
                    </form>
                    {event.published && (
                      <Link href={`/event/${event.slug}`} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-ink-soft transition hover:bg-cream-100">
                        <Icon.eye className="h-4 w-4" /> Lihat
                      </Link>
                    )}
                    <span className="ml-auto">
                      <DeleteButton action={deleteEvent} id={event.id} />
                    </span>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        !error && (
          <EmptyState
            title={active === "procon" ? "Belum ada ProCon" : "Belum ada event"}
            description="Selama kosong, halaman utama memakai konten bawaan."
            action={newButton}
          />
        )
      )}
    </>
  );
}
