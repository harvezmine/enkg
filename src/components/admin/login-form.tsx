"use client";

import { useActionState, useState } from "react";

import { setupFirstAdmin, signIn, type AuthState } from "@/app/actions/auth";
import { Icon } from "@/components/icons";

import { submitKeepingValues } from "./submit-keeping-values";
import { Field, Input, Notice } from "./ui";

function PasswordInput({ id, autoComplete, minLength }: { id: string; autoComplete: string; minLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} name={id} type={show ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} required className="pr-24" />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-50"
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
      >
        {show ? "Sembunyikan" : "Lihat"}
      </button>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, {} as AuthState);

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="nama@email.com" autoFocus required />
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" autoComplete="current-password" />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <button type="submit" disabled={pending} className="btn btn-navy w-full">
        {pending ? "Memeriksa…" : "Masuk"}
        {!pending && <Icon.arrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}

/** Hanya tampil selama belum ada admin: membuat akun admin pertama. */
export function SetupForm({ minLength }: { minLength: number }) {
  const [state, action, pending] = useActionState(setupFirstAdmin, {} as AuthState);

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-4">
      <Field label="Nama kamu" htmlFor="name">
        <Input id="name" name="name" autoComplete="name" autoFocus required />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
      </Field>
      <Field label="Password" htmlFor="password" hint={`Minimal ${minLength} karakter.`}>
        <PasswordInput id="password" autoComplete="new-password" minLength={minLength} />
      </Field>
      <Field label="Kode pengaturan" htmlFor="code" hint="Isi ADMIN_PASSWORD dari pengelola server.">
        <PasswordInput id="code" autoComplete="off" />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <button type="submit" disabled={pending} className="btn btn-navy w-full">
        {pending ? "Membuat akun…" : "Buat akun admin"}
      </button>
    </form>
  );
}
