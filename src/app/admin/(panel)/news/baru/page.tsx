import type { Metadata } from "next";

import { PostEditor } from "@/components/admin/post-editor";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "News baru" };

export default function NewPostPage() {
  return (
    <>
      <AdminPageHeader title="News baru" description="Simpan sebagai draf dulu kalau belum siap terbit." backHref="/admin/news" />
      <PostEditor />
    </>
  );
}
