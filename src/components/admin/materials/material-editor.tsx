"use client";

import { useActionState } from "react";

import type { ActionState } from "@/app/actions/admin";
import { saveMaterial } from "@/app/actions/materials";
import { Icon } from "@/components/icons";
import { LIFE_GROUP_SEGMENT_LABEL, type LgMaterial } from "@/lib/db-types";

import { submitKeepingValues } from "../submit-keeping-values";
import { PublishToggle } from "../toggle";
import { Field, Input, Notice, RichEditor, Select } from "../ui";
import { BookletUpload } from "./booklet-upload";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";

const initial: ActionState = { status: "idle" };

export function MaterialEditor({ material }: { material?: LgMaterial }) {
  const [state, action, pending] = useActionState(saveMaterial, initial);

  return (
    <form onSubmit={submitKeepingValues(action)} className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <UnsavedGuard />
      {material && <input type="hidden" name="id" value={material.id} />}

      <div className="space-y-5 lg:col-span-8">
        <Field label="Judul" htmlFor="title">
          <Input id="title" name="title" defaultValue={material?.title ?? ""} placeholder="Mis. Seri Pengampunan, Minggu 1" required maxLength={200} />
        </Field>
        <Field label="Ringkasan" htmlFor="summary" optional>
          <Input id="summary" name="summary" defaultValue={material?.summary ?? ""} maxLength={400} />
        </Field>
        <Field
          label="Tulisan"
          htmlFor="body"
         
          optional
        >
          <RichEditor id="body" name="body" defaultValue={material?.body} minHeight="min-h-[24rem]" placeholder="Ayat bacaan, renungan singkat, dan pertanyaan diskusi…" />
        </Field>
      </div>

      <aside className="space-y-5 lg:col-span-4">
        <PublishToggle name="published" defaultChecked={material?.published ?? false} />

        <Field label="Untuk grup" htmlFor="segment">
          <Select id="segment" name="segment" defaultValue={material?.segment ?? ""}>
            <option value="">Semua Life Group</option>
            {Object.entries(LIFE_GROUP_SEGMENT_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                Khusus {label}
              </option>
            ))}
          </Select>
        </Field>

        <BookletUpload
          defaultValue={
            material?.file_path
              ? { path: material.file_path, name: material.file_name ?? "booklet.pdf", size: material.file_size ?? 0 }
              : null
          }
        />

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
