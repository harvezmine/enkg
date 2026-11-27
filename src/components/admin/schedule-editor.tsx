"use client";

import { useActionState, useState } from "react";

import type { ActionState } from "@/app/actions/admin";
import { saveSchedule } from "@/app/actions/calendar";
import { Icon } from "@/components/icons";
import { CATEGORY_LABEL, SLUG_USAGE, WEEKDAYS, dotClock, formatDateFull, isCalendarDate, toClock } from "@/lib/calendar";
import type { ScheduleCategory, ScheduleRecurrence, ScheduleRow } from "@/lib/db-types";
import { cn } from "@/lib/utils";

import { submitKeepingValues } from "./submit-keeping-values";
import { PublishToggle } from "./toggle";
import { DateInput, Field, Input, NumberInput, Notice, Select, Textarea, TimeInput } from "./ui";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";

const initial: ActionState = { status: "idle" };

const RECURRENCE_OPTIONS: { value: ScheduleRecurrence; label: string }[] = [
  { value: "weekly", label: "Setiap minggu" },
  { value: "monthly_nth", label: "Tiap bulan" },
  { value: "once", label: "Sekali" },
];

const CATEGORIES: ScheduleCategory[] = ["ibadah", "doa", "life_group", "lainnya"];

/** Pilihan berupa tombol berderet. Nilainya dikirim lewat input tersembunyi. */
function Segmented<T extends string>({
  name,
  value,
  onChange,
  options,
  label,
}: {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-2", options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
      <input type="hidden" name={name} value={value} />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-xl border px-3 py-3 text-sm font-semibold transition sm:text-[15px]",
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

export function ScheduleEditor({ row }: { row?: ScheduleRow }) {
  const [state, action, pending] = useActionState(saveSchedule, initial);
  const [recurrence, setRecurrence] = useState<ScheduleRecurrence>(row?.recurrence ?? "weekly");
  const [mode, setMode] = useState<"onsite" | "online">(row?.mode ?? "onsite");
  const [category, setCategory] = useState<ScheduleCategory>(row?.category ?? "ibadah");
  const [weekday, setWeekday] = useState(String(row?.weekday ?? 0));
  const [nth, setNth] = useState(String(row?.nth ?? 1));
  const [onDate, setOnDate] = useState(row?.on_date ?? "");
  const [start, setStart] = useState(toClock(row?.start_time) ?? "");
  const [end, setEnd] = useState(toClock(row?.end_time) ?? "");

  const day = WEEKDAYS[Number(weekday)] ?? "";
  const pattern =
    recurrence === "weekly"
      ? `Setiap ${day}`
      : recurrence === "monthly_nth"
        ? `${day} ke-${nth} setiap bulan`
        : isCalendarDate(onDate)
          ? formatDateFull(onDate)
          : "Tanggal belum dipilih";
  const clock = start ? `${dotClock(start)}${end ? ` sampai ${dotClock(end)}` : ""} WIB` : "jam belum diisi";
  const usage = row?.slug ? SLUG_USAGE[row.slug] : undefined;

  return (
    <form onSubmit={submitKeepingValues(action)} className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <UnsavedGuard />
      {row && <input type="hidden" name="id" value={row.id} />}

      <div className="space-y-5 lg:col-span-8">
        {usage && (
          <div className="rounded-2xl bg-sun-400/15 p-4 text-sm leading-relaxed text-ink ring-1 ring-sun-500/40">
            <p className="font-semibold">Jadwal ini juga dipakai di halaman utama.</p>
            <p className="mt-1 text-ink-soft">{usage}. Jamnya ikut berubah kalau diubah di sini.</p>
          </div>
        )}

        <Field label="Nama jadwal" htmlFor="title">
          <Input id="title" name="title" defaultValue={row?.title ?? ""} placeholder="Misalnya: Ibadah Minggu" required maxLength={120} />
        </Field>

        <Field label="Pola" htmlFor="recurrence">
          <Segmented name="recurrence" label="Pola jadwal" value={recurrence} onChange={setRecurrence} options={RECURRENCE_OPTIONS} />
        </Field>

        {recurrence === "once" ? (
          <Field label="Tanggal" htmlFor="on_date">
            <DateInput id="on_date" name="on_date" value={onDate} onChange={setOnDate} required aria-label="Tanggal" />
          </Field>
        ) : (
          <div className={cn("grid gap-5", recurrence === "monthly_nth" && "sm:grid-cols-2")}>
            <Field label="Hari" htmlFor="weekday">
              <Select id="weekday" name="weekday" value={weekday} onChange={(event) => setWeekday(event.target.value)}>
                {WEEKDAYS.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            {recurrence === "monthly_nth" && (
              <Field label="Minggu ke-" htmlFor="nth" hint="Ke-1 berarti tanggal 1 sampai 7, ke-4 tanggal 22 sampai 28.">
                <Select id="nth" name="nth" value={nth} onChange={(event) => setNth(event.target.value)}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {`${day} ke-${value}`}
                      {value === 5 ? " (tidak ada tiap bulan)" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <Field label="Mulai" htmlFor="start_time" hint="WIB">
            <TimeInput id="start_time" name="start_time" value={start} onChange={setStart} required aria-label="Jam mulai" />
          </Field>
          <Field label="Selesai" htmlFor="end_time" optional>
            <TimeInput id="end_time" name="end_time" value={end} onChange={setEnd} aria-label="Jam selesai" />
          </Field>
        </div>

        <Field label="Cara ikut" htmlFor="mode">
          <Segmented
            name="mode"
            label="Cara ikut"
            value={mode}
            onChange={setMode}
            options={[
              { value: "onsite", label: "Datang langsung" },
              { value: "online", label: "Online" },
            ]}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={mode === "online" ? "Platform" : "Tempat"} htmlFor="place" optional>
            <Input
              id="place"
              name="place"
              defaultValue={row?.place ?? ""}
              placeholder={mode === "online" ? "Zoom" : "Stream Hall"}
              maxLength={160}
            />
          </Field>
          <Field label={mode === "online" ? "Tautan Zoom" : "Tautan"} htmlFor="link_url" optional>
            <Input id="link_url" name="link_url" type="url" defaultValue={row?.link_url ?? ""} placeholder="https://…" maxLength={600} />
          </Field>
        </div>

        <Field label="Catatan" htmlFor="note" hint="Tampil kecil di bawah jadwal, mis. Meeting ID dan passcode Zoom." optional>
          <Textarea id="note" name="note" defaultValue={row?.note ?? ""} className="min-h-20" maxLength={300} />
        </Field>
      </div>

      <aside className="space-y-5 lg:col-span-4">
        <div className="rounded-2xl bg-navy-deep p-5 text-cream-100 shadow-soft">
          <p className="text-xs font-semibold text-sun-400">Tampil di kalender sebagai</p>
          <p className="font-display mt-2 text-xl leading-snug font-bold">{pattern}</p>
          <p className="mt-1 text-sm text-cream-100/75">{clock}</p>
        </div>

        <PublishToggle
          name="published"
          defaultChecked={row?.published ?? true}
          label="Tampilkan di situs"
          description="Kalau mati, jadwal hanya terlihat di panel ini."
        />

        <Field label="Jenis" htmlFor="category" hint="Menentukan warna titik di kalender.">
          <Select id="category" name="category" value={category} onChange={(event) => setCategory(event.target.value as ScheduleCategory)}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABEL[category]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Urutan" htmlFor="sort_order" hint="Untuk jadwal di jam yang sama, angka kecil tampil lebih dulu.">
          <NumberInput id="sort_order" name="sort_order" defaultValue={row?.sort_order ?? 0} min={-99} max={999} aria-label="Urutan" />
        </Field>

        {category === "life_group" && (
          <p className="rounded-xl bg-cream-50 p-3.5 text-xs leading-relaxed text-ink-soft ring-1 ring-ink/8">
            Jadwal tiap Life Group sudah tampil sendiri dari menu Life Group. Pakai jenis ini untuk acara Life Group bersama, misalnya LG
            gabungan sebulan sekali.
          </p>
        )}

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
