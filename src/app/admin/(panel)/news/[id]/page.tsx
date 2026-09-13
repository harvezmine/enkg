import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DbError } from "@/components/admin/db-error";
import { PostEditor } from "@/components/admin/post-editor";
import { AdminPageHeader } from "@/components/admin/ui";
import { adminDb } from "@/lib/admin-auth";
import { TABLES, type Post } from "@/lib/db-types";

export const metadata: Metadata = { title: "Ubah News" };
export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminDb();
  const { data, error } = await supabase.from(TABLES.posts).select("*").eq("id", id).maybeSingle();

  if (error) {
    return (
      <>
        <AdminPageHeader title="Ubah News" backHref="/admin/news" />
        <DbError error={error} />
      </>
    );
  }
  if (!data) notFound();

  return (
    <>
      <AdminPageHeader title="Ubah News" backHref="/admin/news" />
      <PostEditor post={data as Post} />
    </>
  );
}
