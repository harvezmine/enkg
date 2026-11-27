import type { Metadata } from "next";
import Link from "next/link";

import { DbError } from "@/components/admin/db-error";
import { AdminPageHeader, Badge, Card, EmptyState } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { LIFE_GROUP_SEGMENT_LABEL } from "@/lib/db-types";
import { requireLeader } from "@/lib/leader-auth";
import { groupMaterials } from "@/lib/portal-data";
import { formatBytes } from "@/lib/portal-format";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Materi" };
export const dynamic = "force-dynamic";

export default async function PortalMaterialsPage() {
  const context = await requireLeader();
  const { materials, error } = await groupMaterials(context);

  return (
    <>
      <AdminPageHeader title="Materi Life Group" description="Bahan untuk pertemuan grup. Baca langsung di sini atau unduh booklet-nya." />
      <DbError error={error} />
      {materials.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {materials.map((material) => (
            <li key={material.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="navy">{material.segment ? LIFE_GROUP_SEGMENT_LABEL[material.segment] : "Semua grup"}</Badge>
                  {material.published_at && <span className="text-xs text-ink-soft">{formatDateShort(material.published_at)}</span>}
                </div>
                <h2 className="font-display mt-2.5 text-lg leading-snug font-bold text-ink">
                  <Link href={`/portal/materi/${material.id}`} className="hover:text-navy-700">
                    {material.title}
                  </Link>
                </h2>
                {material.summary && <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-soft">{material.summary}</p>}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  {material.body && (
                    <Link href={`/portal/materi/${material.id}`} className="btn btn-outline px-4 py-2 text-sm">
                      Baca
                    </Link>
                  )}
                  {material.file_path && (
                    <a href={`/portal/materi/${material.id}/unduh`} className="btn btn-navy px-4 py-2 text-sm">
                      <Icon.arrowUpRight className="h-4 w-4" />
                      Unduh booklet{material.file_size ? ` · ${formatBytes(material.file_size)}` : ""}
                    </a>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        !error && <EmptyState title="Belum ada materi" description="Materi yang diterbitkan admin untuk grup kamu akan muncul di sini." />
      )}
    </>
  );
}
