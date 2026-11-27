"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import type { ActionState } from "@/app/actions/admin";
import { addRelative, saveMembership, saveTeam } from "@/app/actions/people";
import { Icon } from "@/components/icons";
import type { Team } from "@/lib/db-types";
import { RELATION_AS_OPTIONS, type RelationAs } from "@/lib/people";

import { submitKeepingValues } from "../submit-keeping-values";
import { DateInput, Field, Input, NumberInput, Notice, Select } from "../ui";
import { todayWib } from "@/lib/people";
import { PersonPicker, type PickerOption } from "./person-picker";

const initial: ActionState = { status: "idle" };

/** Naik setiap kali aksi berhasil; dipakai sebagai `key` untuk mengosongkan pilihan. */
function useSuccessRound(state: ActionState) {
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (state.status === "success") setRound((value) => value + 1);
  }, [state]);
  return round;
}

function Feedback({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  return <Notice tone={state.status === "error" ? "error" : "success"}>{state.message}</Notice>;
}

/* ── Keluarga ─────────────────────────────────────────────────────────────── */

export function FamilyForm({
  personId,
  firstName,
  options,
  spouses,
}: {
  personId: string;
  firstName: string;
  options: PickerOption[];
  /** Pasangan orang ini: anak yang ditambahkan bisa sekalian dicatat sebagai anak mereka. */
  spouses: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(addRelative, initial);
  const [as, setAs] = useState<RelationAs>("pasangan");
  const round = useSuccessRound(state);

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-3">
      <input type="hidden" name="person_id" value={personId} />
      <div className="grid gap-3 sm:grid-cols-[11rem_1fr]">
        <Field label={`Hubungan dengan ${firstName}`} htmlFor="relation-as">
          <Select id="relation-as" name="as" value={as} onChange={(event) => setAs(event.target.value as RelationAs)}>
            {RELATION_AS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Orangnya" htmlFor="relation-person">
          <PersonPicker key={round} name="relative_id" options={options} inputId="relation-person" placeholder="Cari nama di database…" />
        </Field>
      </div>

      {as === "pasangan" && (
        <Field label="Tanggal menikah" htmlFor="relation-married" optional>
          <DateInput id="relation-married" name="married_on" max={todayWib()} startView="year" className="sm:max-w-72" aria-label="Tanggal menikah" />
        </Field>
      )}

      {as === "anak" &&
        spouses.map((spouse) => (
          <label key={spouse.id} className="flex items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" name="also_parent" value={spouse.id} defaultChecked className="h-4 w-4 accent-navy-700" />
            Catat juga sebagai anak {spouse.name}
          </label>
        ))}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="submit" disabled={pending} className="btn btn-navy px-5 py-2.5 text-sm">
          {pending ? "Menyimpan…" : "Tambahkan"}
        </button>
        <Link
          href={`/admin/jemaat/baru?dari=${personId}&sebagai=${as}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline"
        >
          <Icon.plus className="h-4 w-4" />
          Belum terdaftar? Isi data baru
        </Link>
      </div>
      <Feedback state={state} />
    </form>
  );
}

/* ── Pelayanan ────────────────────────────────────────────────────────────── */

/**
 * Tambah pelayanan. Dari halaman jemaat: pilih timnya. Dari halaman tim:
 * pilih orangnya. Memilih tim yang sudah diikuti memperbarui perannya.
 */
export function MembershipForm(
  props:
    | { personId: string; teams: (Pick<Team, "id" | "name"> & { joined: boolean })[] }
    | { teamId: string; people: PickerOption[] },
) {
  const [state, action, pending] = useActionState(saveMembership, initial);
  const round = useSuccessRound(state);
  const fromPerson = "personId" in props;

  return (
    <form key={round} onSubmit={submitKeepingValues(action)} className="space-y-3">
      {fromPerson ? (
        <input type="hidden" name="person_id" value={props.personId} />
      ) : (
        <input type="hidden" name="team_id" value={props.teamId} />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {fromPerson ? (
          <Field label="Tim" htmlFor="membership-team">
            <Select id="membership-team" name="team_id" defaultValue="" required>
              <option value="" disabled>
                Pilih tim pelayanan
              </option>
              {props.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                  {team.joined ? " (sudah, ubah peran)" : ""}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Orangnya" htmlFor="membership-person">
            <PersonPicker name="person_id" options={props.people} inputId="membership-person" placeholder="Cari nama di database…" />
          </Field>
        )}
        <Field label="Peran" htmlFor="membership-role" optional>
          <Input id="membership-role" name="role" placeholder="Mis. Keyboard, Gitar, Pintu depan" maxLength={60} />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name="is_lead" className="h-4 w-4 accent-navy-700" />
        Koordinator tim
      </label>

      <button type="submit" disabled={pending} className="btn btn-navy px-5 py-2.5 text-sm">
        {pending ? "Menyimpan…" : "Simpan pelayanan"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

/** Ubah peran seseorang langsung dari kartunya di halaman tim. */
export function MemberRoleEditor({
  teamId,
  personId,
  role,
  isLead,
}: {
  teamId: string;
  personId: string;
  role: string | null;
  isLead: boolean;
}) {
  const [state, action, pending] = useActionState(saveMembership, initial);
  const [editing, setEditing] = useState(false);
  const round = useSuccessRound(state);

  useEffect(() => {
    if (round) setEditing(false);
  }, [round]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-navy-700 transition hover:bg-navy-50"
      >
        <Icon.edit className="h-3.5 w-3.5" />
        Ubah peran
      </button>
    );
  }

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-2 py-1">
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="person_id" value={personId} />
      <Input name="role" defaultValue={role ?? ""} placeholder="Peran" aria-label="Peran" maxLength={60} className="py-2 text-sm" autoFocus />
      <label className="flex items-center gap-2 text-xs text-ink">
        <input type="checkbox" name="is_lead" defaultChecked={isLead} className="h-4 w-4 accent-navy-700" />
        Koordinator
      </label>
      <div className="flex gap-1">
        <button type="submit" disabled={pending} className="btn btn-navy px-3 py-1.5 text-xs">
          {pending ? "…" : "Simpan"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft">
          Batal
        </button>
      </div>
      {state.status === "error" && <p className="text-xs font-medium text-red-700">{state.message}</p>}
    </form>
  );
}

/* ── Tim ──────────────────────────────────────────────────────────────────── */

export function TeamForm({ team, cancelHref }: { team?: Team; cancelHref: string }) {
  const [state, action, pending] = useActionState(saveTeam, initial);

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-4">
      {team && <input type="hidden" name="id" value={team.id} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <Field label="Nama tim" htmlFor="team-name">
          <Input id="team-name" name="name" defaultValue={team?.name ?? ""} placeholder="Mis. Musisi" required maxLength={60} autoFocus />
        </Field>
        <Field label="Keterangan" htmlFor="team-description" optional>
          <Input
            id="team-description"
            name="description"
            defaultValue={team?.description ?? ""}
            placeholder="Mis. Keyboard, gitar, bass, dan drum"
            maxLength={200}
          />
        </Field>
      </div>
      {team && (
        <Field label="Urutan tampil" htmlFor="team-order" hint="Angka kecil tampil lebih dulu.">
          <NumberInput id="team-order" name="sort_order" defaultValue={team.sort_order} min={-99} max={999} aria-label="Urutan tampil" />
        </Field>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="btn btn-navy px-5 py-2.5 text-sm">
          {pending ? "Menyimpan…" : team ? "Simpan tim" : "Buat tim"}
        </button>
        <Link href={cancelHref} className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft">
          Batal
        </Link>
      </div>
      <Feedback state={state} />
    </form>
  );
}
