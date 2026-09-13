"use client";

import { useActionState, useState } from "react";

import { savePost, type ActionState } from "@/app/actions/admin";
import { Icon } from "@/components/icons";
import { POST_CATEGORY_LABEL, type Post } from "@/lib/db-types";
import { slugify } from "@/lib/utils";

import { ImageUpload } from "./image-upload";
import { submitKeepingValues } from "./submit-keeping-values";
import { PublishToggle } from "./toggle";
import { Field, Input, Notice, Select, Textarea } from "./ui";

const initial: ActionState = { status: "idle" };

export function PostEditor({ post }: { post?: Post }) {
  const [state, action, pending] = useActionState(savePost, initial);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [body, setBody] = useState(post?.body ?? "");

  const effectiveSlug = slugTouched ? slug : slugify(title);

  return (
    <form onSubmit={submitKeepingValues(action)} className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      {post && <input type="hidden" name="id" value={post.id} />}
      {post?.published_at && <input type="hidden" name="published_at" value={post.published_at} />}

      {/* Kolom utama */}
      <div className="space-y-5 lg:col-span-8">
        <Field label="Judul" htmlFor="title">
          <Input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Judul kabar atau artikel" required />
        </Field>

        <Field label="Ringkasan" htmlFor="excerpt" hint="Satu-dua kalimat untuk kartu di halaman utama. Kosongkan untuk memakai paragraf pertama." optional>
          <Input id="excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} maxLength={400} placeholder="Ringkasan singkat" />
        </Field>

        <Field label="Isi" htmlFor="body" hint="Baris kosong memisahkan paragraf. ## untuk sub-judul, > untuk kutipan, - untuk daftar, **tebal**.">
          <Textarea
            id="body"
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-[26rem] font-mono text-sm"
            placeholder={"Tulis di sini…\n\n## Sub-judul\n\nParagraf berikutnya."}
            required
          />
          <p className="mt-1.5 text-right text-xs text-ink-soft">{body.trim() ? body.trim().split(/\s+/).length : 0} kata</p>
        </Field>
      </div>

      {/* Kolom samping: di HP turun ke bawah, bukan disempitkan */}
      <aside className="space-y-5 lg:col-span-4">
        <PublishToggle name="published" defaultChecked={post?.published ?? false} description="Kalau mati, tersimpan sebagai draf." />

        <Field label="Kategori" htmlFor="category">
          <Select id="category" name="category" defaultValue={post?.category ?? "kabar"}>
            {Object.entries(POST_CATEGORY_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Penulis" htmlFor="author" optional>
          <Input id="author" name="author" defaultValue={post?.author ?? "Tim ENKG"} />
        </Field>

        <Field label="Slug URL" htmlFor="slug" hint={`/news/${effectiveSlug || "…"}`}>
          <Input
            id="slug"
            name="slug"
            value={effectiveSlug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            placeholder="otomatis-dari-judul"
          />
        </Field>

        <ImageUpload name="cover_url" defaultValue={post?.cover_url} />

        {state.status === "error" && state.message && <Notice tone="error">{state.message}</Notice>}

        <div className="sticky bottom-24 z-10 -mx-2 rounded-[1.75rem] bg-cream-100 p-2 shadow-[0_-20px_24px_-4px_var(--color-cream-100)] lg:bottom-4">
          <button type="submit" disabled={pending} className="btn btn-navy w-full">
            {pending ? "Menyimpan…" : "Simpan"}
            {!pending && <Icon.check className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </form>
  );
}
