import type { Metadata } from "next";
import Link from "next/link";

import { deleteSubmission, updateSubmission } from "@/app/actions/admin";
import { DbError } from "@/components/admin/db-error";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader, Badge, Card, EmptyState, Select, Textarea } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import {
  SUBMISSION_FORM_LABEL,
  SUBMISSION_STATUS_LABEL,
  TABLES,
  type ContactSubmission,
  type SubmissionForm,
  type SubmissionStatus,
} from "@/lib/db-types";
import { cn, formatDateTime } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Contact Us" };
export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["semua", "baru", "dihubungi", "selesai"] as const;
const FORM_FILTERS = ["semua", "lifeGroup", "prayer"] as const;

function filterHref(status: string, form: string) {
  const params = new URLSearchParams();
  if (status !== "semua") params.set("status", status);
  if (form !== "semua") params.set("form", form);
  const query = params.toString();
  return `/admin/kontak${query ? `?${query}` : ""}`;
}

function greeting(item: ContactSubmission) {
  return item.form === "lifeGroup"
    ? `Halo ${item.name}, kami dari Every Nation Kelapa Gading. Terima kasih sudah mendaftar Life Group ${item.life_group ?? ""}.`
    : `Halo ${item.name}, kami dari Every Nation Kelapa Gading. Kami sudah menerima permohonan doamu.`;
}

export default async function AdminKontakPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; form?: string }>;
}) {
  const params = await searchParams;
  const status = (STATUS_FILTERS as readonly string[]).includes(params.status ?? "") ? params.status! : "semua";
  const form = (FORM_FILTERS as readonly string[]).includes(params.form ?? "") ? params.form! : "semua";

  const supabase = await adminDb();
  let query = supabase.from(TABLES.submissions).select("*").order("created_at", { ascending: false }).limit(200);
  if (status !== "semua") query = query.eq("status", status as SubmissionStatus);
  if (form !== "semua") query = query.eq("form", form as SubmissionForm);
  const { data, error } = await query;
  const items = (data ?? []) as ContactSubmission[];

  return (
    <>
      <AdminPageHeader
        title="Contact Us"
        description="Pendaftaran Life Group dan permohonan doa dari situs. Kiriman yang sama juga masuk ke Google Sheet gereja."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-ink/8" aria-label="Filter status">
          {STATUS_FILTERS.map((key) => (
            <Link
              key={key}
              href={filterHref(key, form)}
              aria-current={status === key ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition",
                status === key ? "bg-navy-700 text-cream-100" : "text-ink-soft hover:text-ink",
              )}
            >
              {key === "semua" ? "Semua" : SUBMISSION_STATUS_LABEL[key]}
            </Link>
          ))}
        </nav>
        <nav className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-ink/8" aria-label="Filter jenis form">
          {FORM_FILTERS.map((key) => (
            <Link
              key={key}
              href={filterHref(status, key)}
              aria-current={form === key ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition",
                form === key ? "bg-sun-500 text-ink" : "text-ink-soft hover:text-ink",
              )}
            >
              {key === "semua" ? "Semua form" : SUBMISSION_FORM_LABEL[key]}
            </Link>
          ))}
        </nav>
      </div>

      <DbError error={error} />

      {items.length ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className={cn("p-4 sm:p-6", item.status === "baru" && "ring-sun-500/50")}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={item.status === "baru" ? "sun" : item.status === "selesai" ? "green" : "gray"}>
                    {SUBMISSION_STATUS_LABEL[item.status]}
                  </Badge>
                  <Badge tone="navy">{SUBMISSION_FORM_LABEL[item.form]}</Badge>
                  <span className="text-xs text-ink-soft">{formatDateTime(item.created_at)}</span>
                </div>

                <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_20rem] lg:gap-8">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold text-ink">{item.name}</p>
                    <a
                      href={whatsappLink(item.phone, greeting(item))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline"
                    >
                      <Icon.whatsapp className="h-4 w-4" /> {item.phone}
                    </a>

                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                      {[
                        ["Jenis kelamin", item.gender],
                        ["Domisili", item.domicile],
                        ["Usia", item.age_range],
                        ["Life Group", item.life_group],
                      ]
                        .filter(([, value]) => value)
                        .map(([label, value]) => (
                          <div key={label}>
                            <dt className="inline text-ink-soft">{label}: </dt>
                            <dd className="inline font-medium text-ink">{value}</dd>
                          </div>
                        ))}
                    </dl>

                    {item.request && (
                      <p className="mt-3 rounded-xl bg-cream-100 p-4 text-sm leading-relaxed whitespace-pre-wrap text-ink">{item.request}</p>
                    )}
                  </div>

                  <form action={updateSubmission} className="space-y-2.5 rounded-xl bg-cream-50 p-3 ring-1 ring-ink/8">
                    <input type="hidden" name="id" value={item.id} />
                    <label className="block text-xs font-semibold text-ink-soft" htmlFor={`status-${item.id}`}>
                      Status
                    </label>
                    <Select id={`status-${item.id}`} name="status" defaultValue={item.status} className="py-2 text-sm">
                      {Object.entries(SUBMISSION_STATUS_LABEL).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </Select>
                    <label className="block text-xs font-semibold text-ink-soft" htmlFor={`notes-${item.id}`}>
                      Catatan pengurus
                    </label>
                    <Textarea
                      id={`notes-${item.id}`}
                      name="admin_notes"
                      defaultValue={item.admin_notes ?? ""}
                      placeholder="Mis. sudah dihubungi Ko Andi, masuk LG Young Professional"
                      className="min-h-20 py-2 text-sm"
                    />
                    <button type="submit" className="btn btn-navy w-full px-4 py-2.5 text-sm">
                      <Icon.check className="h-4 w-4" /> Simpan
                    </button>
                  </form>
                </div>

                <div className="mt-3 flex justify-end border-t border-ink/8 pt-2">
                  <DeleteButton action={deleteSubmission} id={item.id} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        !error && <EmptyState title="Tidak ada kiriman" description="Coba ubah filter, atau tunggu kiriman baru dari form Contact Us." />
      )}
    </>
  );
}
