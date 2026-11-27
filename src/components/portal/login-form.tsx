"use client";

import { useActionState } from "react";

import { portalSignIn, type PortalState } from "@/app/actions/portal";
import { submitKeepingValues } from "@/components/admin/submit-keeping-values";
import { Field, Input, Notice } from "@/components/admin/ui";

export function PortalLoginForm() {
  const [state, action, pending] = useActionState(portalSignIn, { status: "idle" } as PortalState);

  return (
    // Nomor tidak ikut terhapus kalau password salah.
    <form onSubmit={submitKeepingValues(action)} className="space-y-4">
      <Field label="Nomor WhatsApp" htmlFor="login">
        <Input
          id="login"
          name="login"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          placeholder="0812 3456 7890"
          autoFocus
          required
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>

      {state.status === "error" && state.message && <Notice tone="error">{state.message}</Notice>}

      <button type="submit" disabled={pending} className="btn btn-navy w-full">
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
