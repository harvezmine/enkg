"use client";

import { useActionState, useState } from "react";

import { changePassword, type AuthState } from "@/app/actions/auth";
import { saveMeeting, saveReport, type PortalState } from "@/app/actions/portal";
import { PersonAvatar } from "@/components/admin/people/avatar";
import { submitKeepingValues } from "@/components/admin/submit-keeping-values";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";
import { DateTimeInput, Field, Input, NumberInput, Notice, Select, Textarea } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { cn, toWibInput } from "@/lib/utils";

const initial: PortalState = { status: "idle" };

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" disabled={pending} className="btn btn-navy w-full sm:w-auto">
      {pending ? "Menyimpan…" : label}
      {!pending && <Icon.check className="h-4 w-4" />}
    </button>
  );
}

/* ── Jadwal pertemuan ─────────────────────────────────────────────────────── */

export type MeetingDefaults = {
  id: string;
  starts_at: string;
  place: string | null;
  topic: string | null;
  material_id: string | null;
};

export function MeetingForm({
  meeting,
  materials,
  defaultPlace,
  defaultStart,
}: {
  meeting?: MeetingDefaults;
  materials: { id: string; title: string }[];
  defaultPlace?: string | null;
  /** Nilai awal datetime-local (WIB) untuk pertemuan baru, mis. jadwal rutin berikutnya. */
  defaultStart?: string;
}) {
  const [state, action, pending] = useActionState(saveMeeting, initial);

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-5">
      <UnsavedGuard />
      {meeting && <input type="hidden" name="id" value={meeting.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tanggal & jam" htmlFor="starts_at" hint="WIB">
          <DateTimeInput
            id="starts_at"
            name="starts_at"
            defaultValue={meeting ? toWibInput(meeting.starts_at) : (defaultStart ?? "")}
            required
          />
        </Field>
        <Field label="Tempat" htmlFor="place" hint="Hanya terlihat oleh kamu dan admin." optional>
          <Input id="place" name="place" defaultValue={meeting?.place ?? defaultPlace ?? ""} placeholder="Rumah Ko Andi, Zoom, …" maxLength={200} />
        </Field>
      </div>
      <Field label="Topik" htmlFor="topic" optional>
        <Input id="topic" name="topic" defaultValue={meeting?.topic ?? ""} placeholder="Mis. Mengampuni seperti Kristus" maxLength={160} />
      </Field>
      {materials.length > 0 && (
        <Field label="Materi yang dipakai" htmlFor="material_id" optional>
          <Select id="material_id" name="material_id" defaultValue={meeting?.material_id ?? ""}>
            <option value="">Tanpa materi</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.title}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {state.status === "error" && state.message && <Notice tone="error">{state.message}</Notice>}
      <SubmitButton pending={pending} label={meeting ? "Simpan jadwal" : "Jadwalkan"} />
    </form>
  );
}

/* ── Laporan pertemuan ────────────────────────────────────────────────────── */

export type ReportMember = { id: string; full_name: string; nickname: string | null; photoUrl: string | null };

export function ReportForm({
  meetingId,
  members,
  defaults,
}: {
  meetingId: string;
  members: ReportMember[];
  defaults: { attendee_ids: string[]; guest_count: number; report: string | null; prayer_requests: string | null; reported: boolean };
}) {
  const [state, action, pending] = useActionState(saveReport, initial);
  const [present, setPresent] = useState(() => new Set(defaults.attendee_ids));

  const toggle = (id: string) =>
    setPresent((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-5">
      <UnsavedGuard />
      <input type="hidden" name="id" value={meetingId} />

      <fieldset>
        <legend className="flex w-full items-baseline justify-between gap-2 text-sm font-semibold text-ink">
          Siapa saja yang hadir
          <span className="text-xs font-normal text-ink-soft">
            {present.size} dari {members.length}
          </span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setPresent(new Set(members.map((member) => member.id)))}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-50"
          >
            Hadir semua
          </button>
          <button
            type="button"
            onClick={() => setPresent(new Set())}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream-100"
          >
            Kosongkan
          </button>
        </div>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {members.map((member) => {
            const checked = present.has(member.id);
            return (
              <li key={member.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition",
                    checked ? "border-navy-700 bg-navy-50/60" : "border-ink/12 bg-white hover:border-ink/25",
                  )}
                >
                  <input
                    type="checkbox"
                    name="attendee"
                    value={member.id}
                    checked={checked}
                    onChange={() => toggle(member.id)}
                    className="h-5 w-5 shrink-0 accent-navy-700"
                  />
                  <PersonAvatar
                    person={member}
                    photoUrl={member.photoUrl}
                    className="h-9 w-9 shrink-0 rounded-full text-xs"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{member.full_name}</span>
                    {member.nickname && <span className="block truncate text-xs text-ink-soft">{member.nickname}</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <Field label="Tamu atau teman baru" htmlFor="guest_count" hint="Yang datang tapi belum tercatat sebagai anggota grup.">
        <NumberInput id="guest_count" name="guest_count" min={0} max={500} defaultValue={defaults.guest_count} aria-label="Jumlah tamu" />
      </Field>
      <Field label="Jalannya pertemuan" htmlFor="report" optional>
        <Textarea id="report" name="report" defaultValue={defaults.report ?? ""} className="min-h-40" maxLength={8000} />
      </Field>
      <Field label="Pokok doa" htmlFor="prayer_requests" optional>
        <Textarea id="prayer_requests" name="prayer_requests" defaultValue={defaults.prayer_requests ?? ""} className="min-h-28" maxLength={8000} />
      </Field>

      {state.status === "error" && state.message && <Notice tone="error">{state.message}</Notice>}
      <SubmitButton pending={pending} label={defaults.reported ? "Perbarui laporan" : "Kirim laporan"} />
    </form>
  );
}

/* ── Ganti password ───────────────────────────────────────────────────────── */

/** Ganti password sendiri. Dipakai portal leader dan halaman akun admin. */
export function PasswordForm({ minLength }: { minLength: number }) {
  const [state, action, pending] = useActionState(changePassword, {} as AuthState);

  // Isian tidak dikosongkan saat password lama salah (bawaan React 19 untuk <form action>).
  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-4">
      <Field label="Password sekarang" htmlFor="current" hint="Kalau baru dapat akun, isi password sementara dari admin.">
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Password baru" htmlFor="next" hint={`Minimal ${minLength} karakter.`}>
        <Input id="next" name="next" type="password" autoComplete="new-password" minLength={minLength} required />
      </Field>
      <Field label="Ulangi password baru" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={minLength} required />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <SubmitButton pending={pending} label="Simpan password" />
    </form>
  );
}
