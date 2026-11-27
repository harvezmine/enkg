import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader, Card } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { RichText } from "@/components/rich-text";
import { requireLeader } from "@/lib/leader-auth";
import { groupMaterial } from "@/lib/portal-data";
import { formatBytes } from "@/lib/portal-format";

export const metadata: Metadata = { title: "Materi" };
export const dynamic = "force-dynamic";

export default async function PortalMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireLeader();
  const material = await groupMaterial(context, id);
  if (!material) notFound();

  return (
    <>
      <AdminPageHeader
        title={material.title}
        description={material.summary ?? undefined}
        backHref="/portal/materi"
        action={
          material.file_path ? (
            <a href={`/portal/materi/${material.id}/unduh`} className="btn btn-navy px-4 py-2.5 text-sm">
              <Icon.arrowUpRight className="h-4 w-4" />
              Unduh booklet{material.file_size ? ` · ${formatBytes(material.file_size)}` : ""}
            </a>
          ) : undefined
        }
      />
      {material.body ? (
        <Card className="max-w-3xl p-5 sm:p-8">
          <RichText content={material.body} />
        </Card>
      ) : (
        <p className="text-sm text-ink-soft">Materi ini berupa booklet. Unduh untuk membacanya.</p>
      )}
    </>
  );
}
