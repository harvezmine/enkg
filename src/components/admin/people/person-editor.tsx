"use client";

import { useActionState, useId, useState, type ReactNode } from "react";

import type { ActionState } from "@/app/actions/admin";
import { savePerson } from "@/app/actions/people";
import { Icon } from "@/components/icons";
import {
  LIFE_GROUP_ROLE_LABEL,
  LIFE_GROUP_SEGMENT_LABEL,
  PERSON_STATUS_LABEL,
  type Gender,
  type LifeGroup,
  type Person,
} from "@/lib/db-types";
import type { RelationAs } from "@/lib/people";
import { cn } from "@/lib/utils";

import { submitKeepingValues } from "../submit-keeping-values";
import { DateInput, Field, Input, Notice, Select, Textarea } from "../ui";
import { todayWib } from "@/lib/people";
import { PhotoUpload } from "./photo-upload";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";

const initial: ActionState = { status: "idle" };

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
    <div role="radiogroup" aria-label="Jenis kelamin" className="grid grid-cols-2 gap-2">
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

/** Saran isian dari data yang sudah ada, supaya penulisan wilayah & Life Group seragam. */
function Suggestions({ id, values }: { id: string; values: string[] }) {
  return (
    <datalist id={id}>
      {values.map((value) => (
        <option key={value} value={value} />
      ))}
    </datalist>
  );
}

export type RelateIntent = { toId: string; toName: string; as: RelationAs; label: string; spouses: { id: string; name: string }[] };

export type PersonDefaults = Partial<
  Pick<Person, "full_name" | "gender" | "phone" | "address" | "area" | "life_group_id" | "status" | "notes">
>;

export function PersonEditor({
  person,
  photoUrl,
  areas,
  lifeGroups,
  relate,
  defaults,
  submission,
}: {
  person?: Person;
  photoUrl?: string | null;
  areas: string[];
  lifeGroups: Pick<LifeGroup, "id" | "name" | "segment">[];
  /** Diisi saat datang dari "Tambah anggota keluarga". */
  relate?: RelateIntent;
  /** Nilai awal untuk orang baru, mis. alamat keluarga yang sama atau isi kiriman Contact Us. */
  defaults?: PersonDefaults;
  /** Kiriman "Gabung Life Group" yang sedang didaftarkan sebagai jemaat. */
  submission?: { id: string; summary: string };
}) {
  const [state, action, pending] = useActionState(savePerson, initial);
  const areaList = useId();
  const value = <K extends keyof Person>(key: K) => (person?.[key] ?? (defaults as Partial<Person>)?.[key] ?? "") as string;
  const [groupId, setGroupId] = useState(value("life_group_id"));

  return (
    <form onSubmit={submitKeepingValues(action)} className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <UnsavedGuard />
      {person && <input type="hidden" name="id" value={person.id} />}
      {submission && <input type="hidden" name="submission_id" value={submission.id} />}
      {relate && (
        <>
          <input type="hidden" name="relate_to" value={relate.toId} />
          <input type="hidden" name="relate_as" value={relate.as} />
        </>
      )}

      <div className="space-y-5 lg:col-span-8">
        {submission && (
          <div className="rounded-2xl bg-sun-400/15 p-4 text-sm leading-relaxed text-ink ring-1 ring-sun-500/40">
            Data awal diambil dari kiriman Contact Us: {submission.summary}. Lengkapi yang belum ada, lalu simpan.
          </div>
        )}
        {relate && (
          <div className="rounded-2xl bg-sun-400/15 p-4 text-sm text-ink ring-1 ring-sun-500/40">
            <p>
              Orang ini akan dicatat sebagai <strong>{relate.label}</strong> dari <strong>{relate.toName}</strong>.
            </p>
            {relate.as === "anak" &&
              relate.spouses.map((spouse) => (
                <label key={spouse.id} className="mt-2.5 flex items-center gap-2.5">
                  <input type="checkbox" name="also_parent" value={spouse.id} defaultChecked className="h-4 w-4 accent-navy-700" />
                  Catat juga sebagai anak {spouse.name}
                </label>
              ))}
          </div>
        )}

        <Group title="Identitas">
          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            <Field label="Nama lengkap" htmlFor="full_name">
              <Input id="full_name" name="full_name" defaultValue={value("full_name")} required maxLength={160} autoComplete="off" />
            </Field>
            <Field label="Nama panggilan" htmlFor="nickname" optional>
              <Input id="nickname" name="nickname" defaultValue={value("nickname")} maxLength={60} autoComplete="off" />
            </Field>
          </div>
          <Field label="Jenis kelamin" htmlFor="gender">
            <GenderChoice defaultValue={person?.gender ?? defaults?.gender ?? null} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tempat lahir" htmlFor="birth_place" optional>
              <Input id="birth_place" name="birth_place" defaultValue={value("birth_place")} maxLength={80} placeholder="Jakarta" />
            </Field>
            <Field label="Tanggal lahir" htmlFor="birth_date" optional>
              <DateInput id="birth_date" name="birth_date" defaultValue={value("birth_date")} max={todayWib()} startView="year" aria-label="Tanggal lahir" />
            </Field>
          </div>
        </Group>

        <Group title="Kontak & tempat tinggal">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="WhatsApp" htmlFor="phone" optional>
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
          <Field label="Wilayah" htmlFor="area" hint="Mis. Kelapa Gading, Sunter." optional>
            <Input id="area" name="area" list={areaList} defaultValue={value("area")} maxLength={80} />
            <Suggestions id={areaList} values={areas} />
          </Field>
        </Group>

        <Group title="Di gereja">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Status"
              htmlFor="status"
              help={
                <ul className="space-y-1.5">
                  <li><strong>Jemaat baru</strong>: baru mulai datang, biasanya belum punya Life Group.</li>
                  <li><strong>Jemaat aktif</strong>: rutin beribadah di ENKG.</li>
                  <li><strong>Simpatisan</strong>: sering datang, tapi belum menganggap ENKG gerejanya.</li>
                  <li><strong>Tidak aktif</strong>: sudah lama tidak datang.</li>
                  <li><strong>Pindah gereja</strong>: sekarang beribadah di gereja lain.</li>
                </ul>
              }
            >
              <Select id="status" name="status" defaultValue={person?.status ?? defaults?.status ?? "aktif"}>
                {Object.entries(PERSON_STATUS_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Life Group" htmlFor="life_group_id" optional>
              <Select id="life_group_id" name="life_group_id" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
                <option value="">Belum punya Life Group</option>
                {lifeGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                    {group.segment ? ` · ${LIFE_GROUP_SEGMENT_LABEL[group.segment]}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            {groupId && (
              <Field
                label="Peran di Life Group"
                htmlFor="life_group_role"
               
                help="Dengan akun, leader bisa melihat dan mengubah data anggota grupnya, mengatur pertemuan, dan mengisi laporan."
              >
                <Select id="life_group_role" name="life_group_role" defaultValue={person?.life_group_role ?? "anggota"}>
                  {Object.entries(LIFE_GROUP_ROLE_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Mulai beribadah di ENKG" htmlFor="joined_on" optional>
              <DateInput id="joined_on" name="joined_on" defaultValue={value("joined_on")} max={todayWib()} startView="year" aria-label="Mulai beribadah di ENKG" />
            </Field>
            <Field label="Tanggal baptis" htmlFor="baptized_on" optional>
              <DateInput id="baptized_on" name="baptized_on" defaultValue={value("baptized_on")} max={todayWib()} startView="year" aria-label="Tanggal baptis" />
            </Field>
          </div>
          <Field label="Pekerjaan atau sekolah" htmlFor="occupation" optional>
            <Input id="occupation" name="occupation" defaultValue={value("occupation")} maxLength={120} />
          </Field>
          <Field label="Catatan pengurus" htmlFor="notes" hint="Hanya terlihat di panel ini." optional>
            <Textarea id="notes" name="notes" defaultValue={value("notes")} className="min-h-28" maxLength={4000} />
          </Field>
        </Group>
      </div>

      <aside className="space-y-5 lg:col-span-4">
        <div className="lg:sticky lg:top-6 lg:space-y-5">
          <div className="mx-auto max-w-56 lg:max-w-none">
            <PhotoUpload name="photo_path" defaultPath={person?.photo_path} defaultUrl={photoUrl} />
          </div>

          {state.status === "error" && state.message && (
            <div className="mt-5 lg:mt-0">
              <Notice tone="error">{state.message}</Notice>
            </div>
          )}

          <div className="sticky bottom-24 z-10 -mx-2 mt-5 rounded-[1.75rem] bg-cream-100 p-2 shadow-[0_-20px_24px_-4px_var(--color-cream-100)] lg:static lg:mt-0 lg:shadow-none">
            <button type="submit" disabled={pending} className="btn btn-navy w-full">
              {pending ? "Menyimpan…" : "Simpan"}
              {!pending && <Icon.check className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>
    </form>
  );
}
