import Link from "next/link";

import { DbError } from "@/components/admin/db-error";
import { AdminPageHeader, Badge, Card, EmptyState } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { SUBMISSION_FORM_LABEL, SUBMISSION_STATUS_LABEL, TABLES, type ContactSubmission } from "@/lib/db-types";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await adminDb();
  const head = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });
  const now = new Date().toISOString();

  const [baru, drafts, posts, upcoming, procon, recent] = await Promise.all([
    head(TABLES.submissions).eq("status", "baru"),
    head(TABLES.posts).eq("published", false),
    head(TABLES.posts).eq("published", true),
    head(TABLES.events).eq("category", "gereja").eq("published", true).gte("starts_at", now),
    head(TABLES.events).eq("category", "procon").eq("published", true),
    supabase.from(TABLES.submissions).select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const error = [baru, drafts, posts, upcoming, procon, recent].find((result) => result.error)?.error;
  const submissions = (recent.data ?? []) as ContactSubmission[];
  const newCount = baru.count ?? 0;

  const cards = [
    { label: "Kiriman baru", value: newCount, href: "/admin/kontak?status=baru", icon: Icon.inbox, urgent: newCount > 0 },
    { label: "News terbit", value: posts.count ?? 0, href: "/admin/news", icon: Icon.news },
    { label: "Draf News", value: drafts.count ?? 0, href: "/admin/news", icon: Icon.edit },
    { label: "Event mendatang", value: upcoming.count ?? 0, href: "/admin/event?kategori=gereja", icon: Icon.calendar },
    { label: "ProCon terbit", value: procon.count ?? 0, href: "/admin/event?kategori=procon", icon: Icon.users },
  ];

  return (
    <>
      <AdminPageHeader
        title="Ringkasan"
        description="Tanggapi kiriman yang masuk dulu, lalu perbarui News dan event."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/news/baru" className="btn btn-navy px-4 py-2.5 text-sm">
              <Icon.plus className="h-4 w-4" /> News
            </Link>
            <Link href="/admin/event/baru" className="btn btn-outline px-4 py-2.5 text-sm">
              <Icon.plus className="h-4 w-4" /> Event
            </Link>
          </div>
        }
      />

      <DbError error={error} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {cards.map(({ label, value, href, icon: CardIcon, urgent }) => (
          <Link key={label} href={href} className="group">
            <Card className={`h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lift ${urgent ? "bg-sun-400/15 ring-sun-500/40" : ""}`}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-50 text-navy-700 transition-colors group-hover:bg-navy-700 group-hover:text-cream-100">
                <CardIcon className="h-5 w-5" />
              </span>
              <p className="font-display tabular mt-4 text-3xl font-bold text-ink">{value}</p>
              <p className="mt-1 text-xs font-medium text-ink-soft">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-ink">Kiriman Contact Us terbaru</h2>
          <Link href="/admin/kontak" className="shrink-0 text-sm font-semibold text-navy-700">
            Lihat semua
          </Link>
        </div>

        {submissions.length ? (
          <ul className="space-y-3">
            {submissions.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/kontak?status=${item.status}`}>
                  <Card className="p-4 transition hover:shadow-lift sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={item.status === "baru" ? "sun" : item.status === "selesai" ? "green" : "gray"}>
                        {SUBMISSION_STATUS_LABEL[item.status]}
                      </Badge>
                      <Badge tone="navy">{SUBMISSION_FORM_LABEL[item.form]}</Badge>
                      <span className="text-xs text-ink-soft">{formatDateTime(item.created_at)}</span>
                    </div>
                    <p className="mt-2 font-semibold text-ink">{item.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">
                      {item.form === "prayer"
                        ? item.request
                        : [item.life_group, item.age_range, item.domicile].filter(Boolean).join(" · ")}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          !error && (
            <EmptyState
              title="Belum ada kiriman"
              description="Pendaftaran Life Group dan permohonan doa dari situs akan muncul di sini."
            />
          )
        )}
      </section>
    </>
  );
}
