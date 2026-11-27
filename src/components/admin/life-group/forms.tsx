"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import type { ActionState } from "@/app/actions/admin";
import { assignLifeGroup, saveLifeGroup, type AssignState } from "@/app/actions/life-groups";
import { Icon } from "@/components/icons";
import { LIFE_GROUP_ROLE_LABEL, LIFE_GROUP_SEGMENT_LABEL, type LifeGroup } from "@/lib/db-types";
import { WEEKDAYS } from "@/lib/life-groups";

import { PersonPicker, type PickerOption } from "../people/person-picker";
import { submitKeepingValues } from "../submit-keeping-values";
import { PublishToggle } from "../toggle";
import { Field, Input, Notice, Select, Textarea, TimeInput } from "../ui";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";


export type GroupOption = Pick<LifeGroup, "id" | "name" | "segment"> & { leaders: string };

/* ── Buat / ubah Life Group ───────────────────────────────────────────────── */

export function LifeGroupForm({ group, cancelHref }: { group?: LifeGroup; cancelHref: string }) {
  const [state, action, pending] = useActionState(saveLifeGroup, { status: "idle" } as ActionState);

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-5">
      <UnsavedGuard />
      {group && <input type="hidden" name="id" value={group.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nama Life Group" htmlFor="lg-name">
          <Input id="lg-name" name="name" defaultValue={group?.name ?? ""} placeholder="Mis. YP Kelapa Gading" required maxLength={80} />
        </Field>
        <Field label="Kelompok" htmlFor="lg-segment" optional>
          <Select id="lg-segment" name="segment" defaultValue={group?.segment ?? ""}>
            <option value="">Lainnya</option>
            {Object.entries(LIFE_GROUP_SEGMENT_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Hari pertemuan" htmlFor="lg-day" optional>
          <Select id="lg-day" name="meeting_day" defaultValue={group?.meeting_day ?? ""}>
            <option value="">Belum tetap</option>
            {WEEKDAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Jam" htmlFor="lg-time" hint="WIB" optional>
          <TimeInput id="lg-time" name="meeting_time" defaultValue={group?.meeting_time} aria-label="Jam pertemuan" />
        </Field>
        <Field label="Wilayah" htmlFor="lg-area" hint="Tampil di kalender publik." optional>
          <Input id="lg-area" name="area" defaultValue={group?.area ?? ""} maxLength={80} />
        </Field>
        <Field label="Tempat pertemuan" htmlFor="lg-location" hint="Hanya terlihat pengurus dan leader." optional>
          <Input id="lg-location" name="location" defaultValue={group?.location ?? ""} maxLength={300} placeholder="Rumah keluarga Santoso, Jl. ..." />
        </Field>
      </div>
      <Field label="Keterangan" htmlFor="lg-description" optional>
        <Textarea id="lg-description" name="description" defaultValue={group?.description ?? ""} className="min-h-20" maxLength={300} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <PublishToggle
          name="show_on_calendar"
          defaultChecked={group?.show_on_calendar ?? true}
          label="Tampil di kalender publik"
          description="Hanya nama grup, jam, dan wilayah. Alamat tidak pernah tampil."
        />
        <PublishToggle name="is_active" defaultChecked={group?.is_active ?? true} label="Grup aktif" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="btn btn-navy px-5 py-2.5 text-sm">
          {pending ? "Menyimpan…" : group ? "Simpan" : "Buat Life Group"}
        </button>
        <Link href={cancelHref} className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft">
          Batal
        </Link>
      </div>
      {state.status === "error" && state.message && <Notice tone="error">{state.message}</Notice>}
    </form>
  );
}

/* ── Masukkan orang ke Life Group ─────────────────────────────────────────── */

function AssignFeedback({ state }: { state: AssignState }) {
  if (state.status === "idle" || !state.message) return null;
  if (state.status === "error") return <Notice tone="error">{state.message}</Notice>;
  return (
    <div className="space-y-2">
      <Notice tone="success">{state.message}</Notice>
      {state.notify && (
        <a href={state.notify.href} target="_blank" rel="noopener noreferrer" className="btn btn-wa w-full px-4 py-2.5 text-sm sm:w-auto">
          <Icon.whatsapp className="h-4 w-4" />
          {state.notify.label}
        </a>
      )}
    </div>
  );
}

const groupLabel = (group: GroupOption) =>
  [group.name, group.segment ? LIFE_GROUP_SEGMENT_LABEL[group.segment] : null, group.leaders ? `Leader: ${group.leaders}` : null]
    .filter(Boolean)
    .join(" · ");

/**
 * Dua bentuk: dari kartu jemaat (orangnya tetap, pilih grup) atau dari
 * halaman grup (grupnya tetap, pilih orang).
 */
export function AssignLifeGroupForm(
  props:
    | { personId: string; groups: GroupOption[]; suggested?: string | null; compact?: boolean; returnTo?: string }
    | { groupId: string; people: PickerOption[] },
) {
  const [state, action, pending] = useActionState(assignLifeGroup, { status: "idle" } as AssignState);
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (state.status === "success") setRound((value) => value + 1);
  }, [state]);

  if ("personId" in props) {
    // Grup yang kelompoknya cocok dengan pilihan di form Contact Us ditaruh paling atas.
    const groups = [...props.groups].sort(
      (a, b) => Number(b.segment === props.suggested) - Number(a.segment === props.suggested),
    );
    return (
      <form onSubmit={submitKeepingValues(action)} className="space-y-2.5">
        <input type="hidden" name="person_id" value={props.personId} />
        {props.returnTo && <input type="hidden" name="return_to" value={props.returnTo} />}
        <div className={props.compact ? "space-y-2" : "flex flex-col gap-2 sm:flex-row"}>
          <Select name="life_group_id" defaultValue="" required aria-label="Pilih Life Group" className="min-w-0 py-2.5 text-sm">
            <option value="" disabled>
              Pilih Life Group
            </option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {groupLabel(group)}
              </option>
            ))}
          </Select>
          <button type="submit" disabled={pending || !groups.length} className="btn btn-navy w-full shrink-0 px-4 py-2.5 text-sm sm:w-auto">
            {pending ? "Menyimpan…" : "Masukkan"}
          </button>
        </div>
        {!groups.length && <p className="text-xs text-ink-soft">Belum ada Life Group. Buat dulu di halaman Life Group.</p>}
        <AssignFeedback state={state} />
      </form>
    );
  }

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-3">
      <input type="hidden" name="life_group_id" value={props.groupId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <Field label="Orangnya" htmlFor="assign-person">
          <PersonPicker key={round} name="person_id" options={props.people} inputId="assign-person" placeholder="Cari nama di database…" />
        </Field>
        <Field label="Sebagai" htmlFor="assign-role">
          <Select id="assign-role" name="role" defaultValue="anggota">
            {Object.entries(LIFE_GROUP_ROLE_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <button type="submit" disabled={pending} className="btn btn-navy px-5 py-2.5 text-sm">
        {pending ? "Menyimpan…" : "Masukkan ke grup"}
      </button>
      <AssignFeedback state={state} />
    </form>
  );
}
