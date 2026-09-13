"use client";

import { useActionState, useState } from "react";

import { saveEvent, type ActionState } from "@/app/actions/admin";
import { Icon } from "@/components/icons";
import { EVENT_CATEGORY_LABEL, type ChurchEvent, type EventCategory } from "@/lib/db-types";
import { slugify, toWibInput } from "@/lib/utils";

import { ImageUpload } from "./image-upload";
import { submitKeepingValues } from "./submit-keeping-values";
import { PublishToggle } from "./toggle";
import { Field, Input, Notice, Select, Textarea } from "./ui";

const initial: ActionState = { status: "idle" };

export function EventEditor({ event, defaultCategory = "gereja" }: { event?: ChurchEvent; defaultCategory?: EventCategory }) {
  const [state, action, pending] = useActionState(saveEvent, initial);
  const [category, setCategory] = useState<EventCategory>(event?.category ?? defaultCategory);
  const [title, setTitle] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(event?.slug));

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const procon = category === "procon";

  return (
    <form onSubmit={submitKeepingValues(action)} className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      {event && <input type="hidden" name="id" value={event.id} />}

      <div className="space-y-5 lg:col-span-8">
        <Field label="Nama event" htmlFor="title">
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={procon ? "Misalnya: Monetize with AI" : "Misalnya: Ibadah Natal 2026"}
            required
          />
        </Field>

        {procon && (
          <div className="grid gap-5 sm:grid-cols-2 sm:items-end">
            <Field label="Topik" htmlFor="topic" hint="Tampil sebagai label kartu ProCon.">
              <Input id="topic" name="topic" defaultValue={event?.topic ?? ""} placeholder="Keuangan" />
            </Field>
            <Field label="Mitra" htmlFor="partner" optional>
              <Input id="partner" name="partner" defaultValue={event?.partner ?? ""} placeholder="Bersama blu by BCA Digital" />
            </Field>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 sm:items-end">
          <Field label="Mulai" htmlFor="starts_at" hint={procon ? "Kosongkan bila jadwal belum ada (tampil \"Segera hadir\")." : "Jam dalam WIB."} optional={procon}>
            <Input id="starts_at" name="starts_at" type="datetime-local" defaultValue={toWibInput(event?.starts_at)} required={!procon} />
          </Field>
          <Field label="Selesai" htmlFor="ends_at" optional>
            <Input id="ends_at" name="ends_at" type="datetime-local" defaultValue={toWibInput(event?.ends_at)} />
          </Field>
        </div>

        <Field label="Deskripsi" htmlFor="description" hint="Format sama seperti News: ## sub-judul, - daftar, **tebal**. Paragraf pertama jadi ringkasan kartu." optional>
          <Textarea
            id="description"
            name="description"
            defaultValue={event?.description ?? ""}
            className="min-h-64"
            placeholder="Apa yang akan terjadi, untuk siapa, dan apa yang perlu dibawa."
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2 sm:items-end">
          <Field label="Nama lokasi" htmlFor="location" optional>
            <Input id="location" name="location" defaultValue={event?.location ?? ""} placeholder="Stream Hall, Mahaka Square" />
          </Field>
          <Field label="Tautan peta" htmlFor="map_url" optional>
            <Input id="map_url" name="map_url" defaultValue={event?.map_url ?? ""} placeholder="https://maps.app.goo.gl/…" />
          </Field>
        </div>

        <Field label="Alamat lengkap" htmlFor="address" optional>
          <Input id="address" name="address" defaultValue={event?.address ?? ""} placeholder="Jl. Raya Kelapa Nias No. 6, Kelapa Gading" />
        </Field>

        <Field label="Tautan pendaftaran" htmlFor="register_url" hint="Kosongkan bila pendaftaran cukup lewat WhatsApp." optional>
          <Input id="register_url" name="register_url" defaultValue={event?.register_url ?? ""} placeholder="https://forms.gle/…" />
        </Field>
      </div>

      <aside className="space-y-5 lg:col-span-4">
        <PublishToggle name="published" defaultChecked={event?.published ?? false} description="Kalau mati, event hanya terlihat di panel ini." />

        <Field label="Jenis" htmlFor="category" hint={procon ? "Tampil di section ProCon News." : "Tampil di section News sebagai event."}>
          <Select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
            {Object.entries(EVENT_CATEGORY_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Slug URL" htmlFor="slug" hint={`/event/${effectiveSlug || "…"}`}>
          <Input
            id="slug"
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </Field>

        <ImageUpload name="cover_url" defaultValue={event?.cover_url} />

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
