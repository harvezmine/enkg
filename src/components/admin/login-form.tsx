"use client";

import { useActionState } from "react";

import { signIn, type AuthState } from "@/app/actions/auth";

import { Field, Input, Notice } from "./ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, {} as AuthState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/admin"} />

      <Field label="Password pengurus" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          autoFocus
          required
        />
      </Field>

      {state.error && <Notice tone="error">{state.error}</Notice>}

      <button type="submit" disabled={pending} className="btn btn-navy w-full">
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
