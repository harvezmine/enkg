import type { Metadata } from "next";
import Link from "next/link";

import { deleteMaterial, toggleMaterial } from "@/app/actions/materials";
import { DbError } from "@/components/admin/db-error";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader, Badge, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { LIFE_GROUP_SEGMENT_LABEL, TABLES, type LgMaterial } from "@/lib/db-types";
import { formatBytes } from "@/lib/portal-format";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Materi LG" };
export const dynamic = "force-dynamic";

export default async function AdminMaterialsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const supabase = await adminDb();
  const { data, error } = await supabase.from(TABLES.lgMaterials).select("*").order("updated_at", { ascending: false });
  const materials = (data ?? []) as LgMaterial[];

  const newButton = (
    <Link href="/admin/materi/baru" className="btn btn-navy px-4 py-2.5 text-sm">
      <Icon.plus className="h-4 w-4" /> Materi baru
    </Link>
  );

  return (
    <>
      <AdminPageHeader
        title="Materi Life Group"
        description="Tulisan dan booklet untuk leader. Yang terbit langsung bisa dibaca dan diunduh di portal leader."
        action={newButton}
      />
      <DbError error={error} />

      {materials.length ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {materials.map((material) => (
            <li key={material.id}>
              <Card className="flex h-full flex-col p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={material.published ? "green" : "gray"}>{material.published ? "Terbit" : "Draf"}</Badge>
                  <Badge tone="navy">{material.segment ? LIFE_GROUP_SEGMENT_LABEL[material.segment] : "Semua grup"}</Badge>
                  <span className="text-xs text-ink-soft">Diperbarui {formatDateShort(material.updated_at)}</span>
                </div>
                <h2 className="font-display mt-2.5 text-lg leading-snug font-bold text-ink">{material.title}</h2>
                {material.summary && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{material.summary}</p>}
                <p className="mt-2 text-xs text-ink-soft">
                  {[material.body ? "Ada tulisan" : null, material.file_path ? `Booklet ${formatBytes(material.file_size)}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-ink/8 pt-3">
                  <Link
                    href={`/admin/materi/${material.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-navy-50 px-3 text-xs font-semibold text-navy-700"
                  >
                    <Icon.edit className="h-4 w-4" /> Ubah
                  </Link>
                  <form action={toggleMaterial}>
                    <input type="hidden" name="id" value={material.id} />
                    <input type="hidden" name="next" value={material.published ? "false" : "true"} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-ink-soft transition hover:bg-cream-100"
                    >
                      {material.published ? "Jadikan draf" : "Terbitkan"}
                    </button>
                  </form>
                  {material.file_path && (
                    <a
                      href={`/admin/materi/${material.id}/unduh`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-ink-soft transition hover:bg-cream-100"
                    >
                      <Icon.arrowUpRight className="h-4 w-4" /> Unduh
                    </a>
                  )}
                  <span className="ml-auto">
                    <DeleteButton action={deleteMaterial} id={material.id} />
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        !error && (
          <EmptyState
            title="Belum ada materi"
            description="Tambahkan tulisan atau booklet PDF untuk bahan pertemuan Life Group."
            action={newButton}
          />
        )
      )}
    </>
  );
}
