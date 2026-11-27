"use client";

import { useActionState, useState } from "react";

import type { ActionState } from "@/app/actions/admin";
import { addRecipient, connectBot, sendDigestNow, sendTestMessage, updateChatTopics } from "@/app/actions/telegram";
import { Icon } from "@/components/icons";
import { TOPICS, TOPIC_LABEL, type Topic } from "@/lib/telegram/topics";
import { cn } from "@/lib/utils";

import { submitKeepingValues } from "../submit-keeping-values";
import { Field, Input, Notice } from "../ui";

const idle: ActionState = { status: "idle" };

function Feedback({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  return <Notice tone={state.status === "error" ? "error" : "success"}>{state.message}</Notice>;
}

/** Tombol untuk aksi tanpa isian (sambungkan bot, kirim ringkasan sekarang). */
function SimpleAction({
  action,
  label,
  pendingLabel,
  variant = "navy",
}: {
  action: (prev: ActionState) => Promise<ActionState>;
  label: string;
  pendingLabel: string;
  variant?: "navy" | "outline";
}) {
  const [state, formAction, pending] = useActionState(action, idle);
  return (
    <form action={formAction} className="space-y-3">
      <button type="submit" disabled={pending} className={cn("btn px-4 py-2.5 text-sm", variant === "navy" ? "btn-navy" : "btn-outline")}>
        {pending ? pendingLabel : label}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export const ConnectBotButton = () => <SimpleAction action={connectBot} label="Sambungkan bot" pendingLabel="Menyambungkan…" />;

export const DigestNowButton = () => (
  <SimpleAction action={sendDigestNow} label="Kirim ringkasan hari ini sekarang" pendingLabel="Mengirim…" variant="outline" />
);

/** Tambah penerima: nama, nomor Telegram, dan pengingat yang dia terima. */
export function AddRecipientForm() {
  const [state, action, pending] = useActionState(addRecipient, idle);
  const [round, setRound] = useState(0);
  const [lastState, setLastState] = useState(state);
  // Kosongkan form setelah berhasil menambah (key baru = form baru).
  if (state !== lastState) {
    setLastState(state);
    if (state.status === "success") setRound((value) => value + 1);
  }

  return (
    <div className="space-y-3">
      <form key={round} onSubmit={submitKeepingValues(action)} className="space-y-4">
        <Field label="Nama" htmlFor="recipient-name">
          <Input id="recipient-name" name="name" placeholder="Mis. Ko Andi" required maxLength={80} autoComplete="off" />
        </Field>
        <Field label="Nomor Telegram" htmlFor="recipient-phone" hint="Biasanya sama dengan nomor WhatsApp-nya.">
          <Input id="recipient-phone" name="phone" type="tel" inputMode="tel" placeholder="0812 3456 7890" required maxLength={40} />
        </Field>
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Pengingat yang dikirim</legend>
          <div className="mt-1">
            {TOPICS.map((topic) => (
              <label key={topic} className="-mx-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 transition hover:bg-cream-50">
                <input type="checkbox" name="topics" value={topic} defaultChecked className="h-4 w-4 shrink-0 accent-navy-700" />
                <span className="text-sm font-medium text-ink">{TOPIC_LABEL[topic]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={pending} className="btn btn-navy w-full px-4 py-2.5 text-sm">
          <Icon.plus className="h-4 w-4" />
          {pending ? "Menyimpan…" : "Tambahkan penerima"}
        </button>
      </form>
      <Feedback state={state} />
    </div>
  );
}

/** Pengingat per penerima. Langsung tersimpan begitu dicentang. */
export function TopicToggles({ id, topics }: { id: string; topics: Topic[] }) {
  const [selected, setSelected] = useState<Topic[]>(topics);

  return (
    <form action={updateChatTopics} className="flex flex-wrap gap-2">
      <input type="hidden" name="id" value={id} />
      {TOPICS.map((topic) => {
        const on = selected.includes(topic);
        return (
          <label
            key={topic}
            className={cn(
              "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-xs font-semibold ring-1 transition",
              on ? "bg-navy-700 text-cream-100 ring-navy-700" : "bg-white text-ink-soft ring-ink/12 hover:ring-ink/25",
            )}
          >
            <input
              type="checkbox"
              name="topics"
              value={topic}
              checked={on}
              onChange={(event) => {
                const next = event.target.checked ? [...selected, topic] : selected.filter((item) => item !== topic);
                setSelected(next);
                const form = event.target.form;
                // Tunggu React menulis status centang baru, baru kirim.
                window.setTimeout(() => form?.requestSubmit(), 0);
              }}
              className="sr-only"
            />
            {on ? <Icon.check className="h-3.5 w-3.5" /> : <Icon.plus className="h-3.5 w-3.5" />}
            {TOPIC_LABEL[topic]}
          </label>
        );
      })}
    </form>
  );
}

export function TestMessageButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(sendTestMessage, idle);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-navy-50 px-3 text-xs font-semibold text-navy-700 transition hover:bg-navy-100"
      >
        <Icon.message className="h-4 w-4" />
        {pending ? "Mengirim…" : "Kirim pesan tes"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
