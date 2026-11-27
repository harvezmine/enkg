"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";

import { saveMember, type PortalState } from "@/app/actions/portal";
import { PhotoUpload } from "@/components/admin/people/photo-upload";
import { submitKeepingValues } from "@/components/admin/submit-keeping-values";
import { DateInput, Field, Input, Notice, Textarea } from "@/components/admin/ui";
import { todayWib } from "@/lib/people";
import { Icon } from "@/components/icons";
import type { Gender } from "@/lib/db-types";
import type { PortalMember } from "@/lib/leader-auth";
import { cn } from "@/lib/utils";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";

const initial: PortalState = { status: "idle" };

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink/8 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-display mb-5 text-lg font-bold text-ink">{title}</h2>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

function GenderChoice({ defaultValue }: { defaultValue: Gender | null }) {
  const [value, setValue] = useState<Gender | "">(defaultValue ?? "");
  const options: { value: Gender; label: string }[] = [
    { value: "L", label: "Laki-laki" },
    { value: "P", label: "Perempuan" },
  ];

  return (
    <div role="radiogroup" aria-labelledby="gender-label" className="grid grid-cols-2 gap-2">
      <input type="hidden" name="gender" value={value} />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => setValue(value === option.value ? "" : option.value)}
          className={cn(
            "rounded-xl border px-4 py-3 text-[15px] font-semibold transition",
            value === option.value
              ? "border-navy-700 bg-navy-700 text-cream-100"
              : "border-ink/12 bg-white text-ink-soft hover:border-ink/25",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Form ubah data anggota untuk leader. Hanya data diri dan kontak; status,
 * Life Group, dan catatan pengurus tetap diatur admin gereja.
 */
export function MemberEditor({
  member,
  photoUrl,
  isSelf,
}: {
  member: PortalMember;
  photoUrl?: string | null;
  /** Leader sedang mengubah datanya sendiri. */
  isSelf: boolean;
}) {
  const [state, action, pending] = useActionState(saveMember, initial);
  const value = (key: keyof PortalMember) => (member[key] ?? "") as string;

  return (
    <form onSubmit={submitKeepingValues(action)} className="grid gap-5 lg:grid-cols-12 lg:gap-8">
      <UnsavedGuard />
      <input type="hidden" name="id" value={member.id} />

      {/* Di HP foto ada di atas: biasanya itu yang paling sering diperbarui leader. */}
      <aside className="lg:order-last lg:col-span-4">
        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="mx-auto max-w-52 lg:max-w-none">
            <PhotoUpload name="photo_path" defaultPath={member.photo_path} defaultUrl={photoUrl} uploadUrl="/portal/upload/foto" />
          </div>
          <p className="rounded-xl bg-cream-50 p-3.5 text-xs leading-relaxed text-ink-soft ring-1 ring-ink/8">
            Status jemaat, Life Group, dan catatan pengurus hanya bisa diubah admin gereja.
          </p>
        </div>
      </aside>

      <div className="space-y-5 lg:col-span-8">
        <Group title="Data diri">
          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            <Field label="Nama lengkap" htmlFor="full_name">
              <Input id="full_name" name="full_name" defaultValue={value("full_name")} required maxLength={160} autoComplete="off" />
            </Field>
            <Field label="Nama panggilan" htmlFor="nickname" optional>
              <Input id="nickname" name="nickname" defaultValue={value("nickname")} maxLength={60} autoComplete="off" />
            </Field>
          </div>
          <div>
            <p id="gender-label" className="text-sm font-semibold text-ink">
              Jenis kelamin
            </p>
            <div className="mt-2">
              <GenderChoice defaultValue={member.gender} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tempat lahir" htmlFor="birth_place" optional>
              <Input id="birth_place" name="birth_place" defaultValue={value("birth_place")} maxLength={80} placeholder="Jakarta" />
            </Field>
            <Field label="Tanggal lahir" htmlFor="birth_date" hint="Supaya ulang tahunnya muncul di beranda kamu." optional>
              <DateInput id="birth_date" name="birth_date" defaultValue={value("birth_date")} max={todayWib()} startView="year" aria-label="Tanggal lahir" />
            </Field>
          </div>
          <Field label="Pekerjaan atau sekolah" htmlFor="occupation" optional>
            <Input id="occupation" name="occupation" defaultValue={value("occupation")} maxLength={120} />
          </Field>
        </Group>

        <Group title="Kontak & tempat tinggal">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="WhatsApp"
              htmlFor="phone"
              hint={isSelf ? "Login tetap pakai email akunmu, nomor ini tidak berpengaruh." : undefined}
              optional
            >
              <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={value("phone")} placeholder="0812 3456 7890" maxLength={40} />
            </Field>
            <Field label="Email" htmlFor="email" optional>
              <Input id="email" name="email" type="email" defaultValue={value("email")} placeholder="nama@email.com" maxLength={200} />
            </Field>
          </div>
          <Field label="Alamat lengkap" htmlFor="address" optional>
            <Textarea
              id="address"
              name="address"
              defaultValue={value("address")}
              className="min-h-24"
              maxLength={400}
              placeholder="Jalan, nomor rumah, RT/RW, kelurahan"
            />
          </Field>
          <Field label="Wilayah" htmlFor="area" hint="Singkat saja. Mis. Kelapa Gading, Sunter." optional>
            <Input id="area" name="area" defaultValue={value("area")} maxLength={80} />
          </Field>
        </Group>

        {state.status === "error" && state.message && <Notice tone="error">{state.message}</Notice>}

        <div className="sticky bottom-24 z-10 -mx-2 flex flex-col-reverse gap-2 rounded-[1.75rem] bg-cream-100 p-2 shadow-[0_-20px_24px_-4px_var(--color-cream-100)] sm:flex-row sm:items-center lg:bottom-4">
          <Link href="/portal/anggota" className="rounded-full px-5 py-3 text-center text-sm font-semibold text-ink-soft">
            Batal
          </Link>
          <button type="submit" disabled={pending} className="btn btn-navy w-full sm:ml-auto sm:w-auto">
            {pending ? "Menyimpan…" : "Simpan perubahan"}
            {!pending && <Icon.check className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </form>
  );
}
