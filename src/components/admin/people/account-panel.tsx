"use client";

import { useActionState, useEffect, useState } from "react";

import {
  createAccount,
  deleteAccount,
  resetAccountPassword,
  setAccountActive,
  setAccountAdmin,
  type AccountActionState,
} from "@/app/actions/accounts";
import { Icon } from "@/components/icons";
import type { Account } from "@/lib/db-types";
import { formatDateTime } from "@/lib/utils";

import { DeleteButton } from "../delete-button";
import { Badge, Field, Input, Notice } from "../ui";
import { PersonPicker, type PickerOption } from "./person-picker";

const initial: AccountActionState = { status: "idle" };

export type AccountView = Omit<Account, "password_hash">;

function CopyText({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard diblokir (mis. bukan HTTPS); password tetap bisa disalin manual.
        }
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-navy-700 ring-1 ring-ink/10"
    >
      {copied && <Icon.check className="h-4 w-4" />}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

/** Email + password sementara, tampil sekali saja setelah dibuat atau di-reset. */
export function Credentials({ state }: { state: AccountActionState }) {
  if (state.status !== "success" || !state.tempPassword) return null;
  return (
    <div className="space-y-3 rounded-xl bg-sun-400/15 p-4 ring-1 ring-sun-500/40">
      <p className="text-sm text-ink">{state.message} Password ini hanya tampil sekali, kirim sekarang.</p>
      <dl className="space-y-1.5 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <dt className="w-20 text-ink-soft">Email</dt>
          <dd className="font-semibold break-all text-ink">{state.email}</dd>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <dt className="w-20 text-ink-soft">Password</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <code className="tabular rounded-lg bg-white px-3 py-1.5 font-mono text-base font-bold tracking-wide text-ink ring-1 ring-ink/10">
              {state.tempPassword}
            </code>
            <CopyText value={`Email: ${state.email}\nPassword sementara: ${state.tempPassword}`} />
          </dd>
        </div>
      </dl>
      {state.waUrl ? (
        <a href={state.waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-wa px-4 py-2.5 text-sm">
          <Icon.whatsapp className="h-4 w-4" /> Kirim lewat WhatsApp
        </a>
      ) : (
        <p className="text-xs text-ink-soft">Nomor WA belum ada di data jemaatnya. Salin lalu kirim lewat aplikasi lain.</p>
      )}
    </div>
  );
}

/** Tombol kelola satu akun: reset password, admin on/off, aktif/nonaktif, hapus. */
export function AccountActions({ account, isSelf }: { account: AccountView; isSelf: boolean }) {
  const [state, action, pending] = useActionState(resetAccountPassword, initial);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => setConfirm(false), [state]);

  return (
    <div className="space-y-3">
      <Credentials state={state} />
      {state.status === "error" && state.message && <Notice tone="error">{state.message}</Notice>}
      <div className="flex flex-wrap items-center gap-1.5">
        {confirm ? (
          <form action={action} className="flex flex-wrap items-center gap-1">
            <input type="hidden" name="account_id" value={account.id} />
            <button type="submit" disabled={pending} className="btn btn-navy px-4 py-2 text-xs">
              {pending ? "Membuat…" : "Ya, buat password baru"}
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft">
              Batal
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="btn btn-outline px-4 py-2 text-xs">
            Reset password
          </button>
        )}
        {!isSelf && (
          <>
            <form action={setAccountAdmin}>
              <input type="hidden" name="account_id" value={account.id} />
              <input type="hidden" name="admin" value={account.is_admin ? "false" : "true"} />
              <button type="submit" className="rounded-full px-3 py-2 text-xs font-semibold text-navy-700 transition hover:bg-navy-50">
                {account.is_admin ? "Cabut akses admin" : "Jadikan admin"}
              </button>
            </form>
            <form action={setAccountActive}>
              <input type="hidden" name="account_id" value={account.id} />
              <input type="hidden" name="active" value={account.is_active ? "false" : "true"} />
              <button type="submit" className="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft transition hover:bg-cream-100 hover:text-red-700">
                {account.is_active ? "Nonaktifkan" : "Aktifkan lagi"}
              </button>
            </form>
            <DeleteButton action={deleteAccount} id={account.id} label="Hapus akun" />
          </>
        )}
        {isSelf && <span className="px-2 text-xs text-ink-soft">Ini akunmu sendiri.</span>}
      </div>
    </div>
  );
}

/** Ringkasan satu akun: email, peran, status. */
export function AccountSummary({ account, leaderOf }: { account: AccountView; leaderOf?: string | null }) {
  return (
    <div className="space-y-2">
      <p className="font-semibold break-all text-ink">{account.email}</p>
      <div className="flex flex-wrap gap-1.5">
        {account.is_admin && <Badge tone="navy">Admin</Badge>}
        {leaderOf && <Badge tone="sun">Leader {leaderOf}</Badge>}
        {!account.is_admin && !leaderOf && <Badge tone="gray">Belum punya akses</Badge>}
        <Badge tone={account.is_active ? "green" : "gray"}>{account.is_active ? "Aktif" : "Nonaktif"}</Badge>
        {account.must_change_password && <Badge tone="gray">Masih password sementara</Badge>}
      </div>
      <p className="text-xs text-ink-soft">
        {account.last_login_at ? `Terakhir masuk ${formatDateTime(account.last_login_at)}` : "Belum pernah masuk"}
      </p>
    </div>
  );
}

/**
 * Form akun baru. Dari halaman jemaat, orangnya sudah tetap (personId); dari
 * halaman Pengguna, admin bisa memilih data jemaat yang ditautkan.
 */
export function NewAccountForm({
  personId,
  defaultName,
  defaultEmail,
  people,
  defaultAdmin = false,
}: {
  personId?: string;
  defaultName?: string;
  defaultEmail?: string | null;
  people?: PickerOption[];
  defaultAdmin?: boolean;
}) {
  const [state, action, pending] = useActionState(createAccount, initial);

  if (state.status === "success") return <Credentials state={state} />;

  return (
    <form action={action} className="space-y-4">
      {personId && <input type="hidden" name="person_id" value={personId} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {!personId && (
          <Field label="Nama" htmlFor="account-name">
            <Input id="account-name" name="name" defaultValue={defaultName} maxLength={120} placeholder="Nama pemilik akun" />
          </Field>
        )}
        <Field label="Email" htmlFor="account-email" hint="Dipakai untuk masuk.">
          <Input id="account-email" name="email" type="email" inputMode="email" defaultValue={defaultEmail ?? ""} required />
        </Field>
      </div>
      {people && (
        <Field
          label="Data jemaat"
          htmlFor="account-person"
          hint="Wajib untuk leader Life Group: portal LG terbuka kalau orang ini tercatat sebagai leader."
          optional
        >
          <PersonPicker name="person_id" options={people} inputId="account-person" placeholder="Cari nama di data jemaat…" />
        </Field>
      )}
      <label className="flex items-start gap-3 rounded-xl bg-white p-3.5 ring-1 ring-ink/10">
        <input type="checkbox" name="is_admin" defaultChecked={defaultAdmin} className="mt-0.5" />
        <span>
          <span className="block text-sm font-semibold text-ink">Admin</span>
          <span className="block text-xs leading-relaxed text-ink-soft">Bisa membuka seluruh admin panel, termasuk data jemaat dan akun lain.</span>
        </span>
      </label>
      {state.status === "error" && state.message && <Notice tone="error">{state.message}</Notice>}
      <button type="submit" disabled={pending} className="btn btn-navy px-5 py-2.5 text-sm">
        <Icon.lock className="h-4 w-4" />
        {pending ? "Membuat…" : "Buat akun"}
      </button>
    </form>
  );
}

/** Panel akun di halaman data jemaat. */
export function AccountPanel({
  person,
  account,
  leaderOf,
  isSelf,
}: {
  person: { id: string; full_name: string; email: string | null };
  account: AccountView | null;
  leaderOf: string | null;
  isSelf: boolean;
}) {
  if (!account) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-soft">
          {leaderOf
            ? `Dengan akun, ${person.full_name.split(" ")[0]} bisa masuk ke portal Life Group: melihat anggota, mengatur pertemuan, dan mengunduh materi.`
            : "Buat akun kalau orang ini perlu masuk sebagai admin, atau nanti sebagai leader Life Group."}
        </p>
        <NewAccountForm personId={person.id} defaultEmail={person.email} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <AccountSummary account={account} leaderOf={leaderOf} />
      <AccountActions account={account} isSelf={isSelf} />
    </div>
  );
}
