"use client";

import { useActionState, useEffect, useState } from "react";

import {
  createLeaderAccount,
  resetLeaderPassword,
  setLeaderAccountActive,
  type AccountActionState,
} from "@/app/actions/accounts";
import { Icon } from "@/components/icons";
import type { Account, Person } from "@/lib/db-types";
import { phoneDigits } from "@/lib/people";
import { formatDateTime } from "@/lib/utils";

import { Badge, Notice } from "../ui";

const initial: AccountActionState = { status: "idle" };

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
      {copied ? <Icon.check className="h-4 w-4" /> : null}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

/** Password sementara, tampil sekali saja setelah dibuat atau di-reset. */
function Credentials({ state }: { state: AccountActionState }) {
  if (state.status !== "success" || !state.tempPassword) return null;
  return (
    <div className="space-y-3 rounded-xl bg-sun-400/15 p-4 ring-1 ring-sun-500/40">
      <p className="text-sm text-ink">{state.message} Password ini hanya tampil sekali, kirim sekarang.</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="tabular rounded-lg bg-white px-3 py-2 font-mono text-base font-bold tracking-wide text-ink ring-1 ring-ink/10">
          {state.tempPassword}
        </code>
        <CopyText value={state.tempPassword} />
      </div>
      <p className="text-xs text-ink-soft">Masuk dengan nomor {state.login}.</p>
      {state.waUrl && (
        <a href={state.waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-wa px-4 py-2.5 text-sm">
          <Icon.whatsapp className="h-4 w-4" /> Kirim lewat WhatsApp
        </a>
      )}
    </div>
  );
}

/**
 * Akun Portal Leader untuk seseorang. Dipasang di halaman data jemaat bagi
 * leader Life Group. Hash password tidak pernah sampai ke komponen ini.
 */
export function AccountPanel({
  person,
  account,
}: {
  person: Person;
  account: Omit<Account, "password_hash"> | null;
}) {
  const [createState, createAction, creating] = useActionState(createLeaderAccount, initial);
  const [resetState, resetAction, resetting] = useActionState(resetLeaderPassword, initial);
  const [confirmReset, setConfirmReset] = useState(false);

  // Setelah reset selesai (berhasil atau gagal), tombol konfirmasi ditutup lagi.
  useEffect(() => setConfirmReset(false), [resetState]);

  const phoneLogin = person.phone ? phoneDigits(person.phone) : "";
  const isLeader = person.life_group_role === "leader" && Boolean(person.life_group_id);

  return (
    <div className="space-y-4">
      {!isLeader && (
        <Notice tone="error">
          Akun portal hanya bisa dipakai selama {person.nickname || person.full_name} tercatat sebagai leader sebuah Life Group.
        </Notice>
      )}

      {!account ? (
        createState.status === "success" ? (
          <Credentials state={createState} />
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-soft">
              Dengan akun portal, leader bisa melihat anggota grupnya, mengisi laporan pertemuan, dan mengunduh materi.
              Masuknya pakai nomor WhatsApp.
            </p>
            {person.phone ? (
              <form action={createAction}>
                <input type="hidden" name="person_id" value={person.id} />
                <button type="submit" disabled={creating} className="btn btn-navy px-5 py-2.5 text-sm">
                  <Icon.lock className="h-4 w-4" />
                  {creating ? "Membuat…" : "Buat akun portal"}
                </button>
              </form>
            ) : (
              <p className="text-sm font-medium text-red-700">Isi nomor WhatsApp di data jemaat dulu untuk membuat akun.</p>
            )}
            {createState.status === "error" && createState.message && <Notice tone="error">{createState.message}</Notice>}
          </>
        )
      ) : (
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-soft">Nomor untuk masuk</dt>
              <dd className="tabular font-semibold text-ink">{account.login}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Status</dt>
              <dd className="mt-0.5 flex flex-wrap gap-1.5">
                <Badge tone={account.is_active ? "green" : "gray"}>{account.is_active ? "Aktif" : "Nonaktif"}</Badge>
                {account.must_change_password && <Badge tone="sun">Masih password sementara</Badge>}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Terakhir masuk</dt>
              <dd className="text-ink">{account.last_login_at ? formatDateTime(account.last_login_at) : "Belum pernah"}</dd>
            </div>
          </dl>

          {phoneLogin && phoneLogin !== account.login && (
            <p className="text-xs leading-relaxed text-ink-soft">
              Nomor WA di data jemaat sudah berubah. Reset password supaya nomor masuknya ikut diperbarui.
            </p>
          )}

          {/* Setelah akun dibuat, halaman dimuat ulang dengan `account` terisi:
              password sementara dari pembuatan akun tetap harus tampil di sini. */}
          <Credentials state={resetState.status === "success" ? resetState : createState} />
          {resetState.status === "error" && resetState.message && <Notice tone="error">{resetState.message}</Notice>}

          <div className="flex flex-wrap items-center gap-2">
            {confirmReset ? (
              <form action={resetAction} className="flex flex-wrap items-center gap-1">
                <input type="hidden" name="account_id" value={account.id} />
                <button type="submit" disabled={resetting} className="btn btn-navy px-4 py-2 text-sm">
                  {resetting ? "Membuat…" : "Ya, buat password baru"}
                </button>
                <button type="button" onClick={() => setConfirmReset(false)} className="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft">
                  Batal
                </button>
              </form>
            ) : (
              <button type="button" onClick={() => setConfirmReset(true)} className="btn btn-outline px-4 py-2 text-sm">
                Reset password
              </button>
            )}
            <form action={setLeaderAccountActive}>
              <input type="hidden" name="account_id" value={account.id} />
              <input type="hidden" name="active" value={account.is_active ? "false" : "true"} />
              <button
                type="submit"
                className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-cream-100 hover:text-red-700"
              >
                {account.is_active ? "Nonaktifkan akun" : "Aktifkan lagi"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
