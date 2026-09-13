import type { Metadata } from "next";
import Link from "next/link";

import { deletePost, togglePost } from "@/app/actions/admin";
import { DbError } from "@/components/admin/db-error";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader, Badge, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { POST_CATEGORY_LABEL, TABLES, type Post } from "@/lib/db-types";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "News" };
export const dynamic = "force-dynamic";

export default async function AdminNewsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const supabase = await adminDb();
  const { data, error } = await supabase.from(TABLES.posts).select("*").order("updated_at", { ascending: false });
  const posts = (data ?? []) as Post[];

  const newButton = (
    <Link href="/admin/news/baru" className="btn btn-navy px-4 py-2.5 text-sm">
      <Icon.plus className="h-4 w-4" /> News baru
    </Link>
  );

  return (
    <>
      <AdminPageHeader title="News" description="Kabar dan artikel yang tampil di section News halaman utama." action={newButton} />

      {saved && (
        <div className="mb-6">
          <Notice tone="success">Tersimpan. Halaman utama sudah diperbarui.</Notice>
        </div>
      )}
      <DbError error={error} />

      {posts.length ? (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={post.published ? "green" : "gray"}>{post.published ? "Terbit" : "Draf"}</Badge>
                  <Badge tone="navy">{POST_CATEGORY_LABEL[post.category]}</Badge>
                  <span className="text-xs text-ink-soft">Diperbarui {formatDateShort(post.updated_at)}</span>
                </div>
                <h2 className="font-display mt-2.5 text-lg leading-snug font-bold text-ink">{post.title}</h2>
                {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{post.excerpt}</p>}

                <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-ink/8 pt-3">
                  <Link href={`/admin/news/${post.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-navy-50 px-3 text-xs font-semibold text-navy-700">
                    <Icon.edit className="h-4 w-4" /> Ubah
                  </Link>
                  <form action={togglePost}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="next" value={post.published ? "false" : "true"} />
                    <button type="submit" className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-ink-soft transition hover:bg-cream-100">
                      {post.published ? "Jadikan draf" : "Terbitkan"}
                    </button>
                  </form>
                  {post.published && (
                    <Link href={`/news/${post.slug}`} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-ink-soft transition hover:bg-cream-100">
                      <Icon.eye className="h-4 w-4" /> Lihat
                    </Link>
                  )}
                  <span className="ml-auto">
                    <DeleteButton action={deletePost} id={post.id} />
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        !error && (
          <EmptyState
            title="Belum ada News"
            description="Selama kosong, section News di halaman utama memakai kabar bawaan. Simpan sebagai draf dulu kalau belum siap terbit."
            action={newButton}
          />
        )
      )}
    </>
  );
}
