"use client";

import {
  useActionState,
  useEffect,
  useId,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { submitConnect, type ConnectState } from "@/app/actions/connect";
import { site, whatsappMessages, whatsappUrl } from "@/content/site";
import { AGE_RANGES, DOMICILES, GENDERS, isValidPhone, LIFE_GROUPS } from "@/lib/google-forms";

import { Icon } from "./icons";

type Tab = "lifeGroup" | "prayer" | "message";

const TABS: { id: Tab; label: string; hint: string; icon: "users" | "heart" | "message" }[] = [
  { id: "lifeGroup", label: "Gabung Life Group", hint: "Kelompok kecil untuk bertumbuh bersama", icon: "users" },
  { id: "prayer", label: "Permohonan Doa", hint: "Tim doa gereja akan mendoakanmu", icon: "heart" },
  { id: "message", label: "Kirim Pesan", hint: "Tanya apa saja lewat WhatsApp", icon: "message" },
];

/** Anchor dari kartu pelayanan → tab yang dibuka (dan pilihan yang diisi otomatis). */
const HASHES: Record<string, { tab: Tab; group?: string }> = {
  "gabung-life-group": { tab: "lifeGroup" },
  "gabung-family": { tab: "lifeGroup", group: "Family" },
  "gabung-young-professional": { tab: "lifeGroup", group: "Young Professional" },
  "gabung-youth": { tab: "lifeGroup", group: "Youth" },
  "permohonan-doa": { tab: "prayer" },
  "kirim-pesan": { tab: "message" },
};

const initialState: ConnectState = { status: "idle" };

const INPUT =
  "w-full rounded-2xl border border-ink/12 bg-white py-3.5 text-base text-ink outline-none transition placeholder:text-ink-soft/50 hover:border-ink/25 focus:border-navy-700 focus:ring-4 focus:ring-navy-700/10 aria-invalid:border-red-600 aria-invalid:focus:ring-red-600/10";

/* ── Field ────────────────────────────────────────────────────────────────── */

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-sm text-red-700">
      <Icon.alert className="h-4 w-4 shrink-0" />
      {children}
    </p>
  );
}

function TextField({
  label,
  name,
  icon,
  error,
  defaultValue,
  placeholder,
  autoComplete,
  inputMode,
  validate,
}: {
  label: string;
  name: string;
  icon?: "user" | "phone";
  error?: string;
  defaultValue?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel";
  /** Mengembalikan pesan error, atau undefined bila valid. Dijalankan saat kolom ditinggalkan. */
  validate?: (value: string) => string | undefined;
}) {
  const id = useId();
  const [localError, setLocalError] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [valid, setValid] = useState(false);
  const shown = localError ?? (dirty ? undefined : error);
  const FieldIcon = icon ? Icon[icon] : null;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative mt-2">
        {FieldIcon && (
          <FieldIcon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-soft/55" />
        )}
        <input
          id={id}
          name={name}
          type="text"
          required
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={Boolean(shown)}
          aria-describedby={shown ? `${id}-error` : undefined}
          onChange={(event) => {
            setDirty(true);
            if (localError && validate && !validate(event.currentTarget.value)) {
              setLocalError(undefined);
              setValid(true);
            }
          }}
          onBlur={(event) => {
            if (!validate || !event.currentTarget.value.trim()) return;
            const message = validate(event.currentTarget.value);
            setLocalError(message);
            setValid(!message);
          }}
          className={`${INPUT} ${FieldIcon ? "pl-12" : "pl-4"} pr-11`}
        />
        {valid && !shown && (
          <Icon.check className="pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-navy-700" />
        )}
      </div>
      <FieldError id={`${id}-error`}>{shown}</FieldError>
    </div>
  );
}

function TextArea({
  label,
  name,
  error,
  defaultValue,
  placeholder,
  max = 2000,
}: {
  label: string;
  name: string;
  error?: string;
  defaultValue?: string;
  placeholder?: string;
  max?: number;
}) {
  const id = useId();
  const [count, setCount] = useState(defaultValue?.length ?? 0);
  const [dirty, setDirty] = useState(false);
  const shown = dirty ? undefined : error;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        <span className="tabular text-xs text-ink-soft">
          {count}/{max}
        </span>
      </div>
      <textarea
        id={id}
        name={name}
        rows={5}
        required
        maxLength={max}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={Boolean(shown)}
        aria-describedby={shown ? `${id}-error` : undefined}
        onChange={(event) => {
          setCount(event.currentTarget.value.length);
          setDirty(true);
        }}
        className={`${INPUT} mt-2 resize-y px-4 leading-relaxed`}
      />
      <FieldError id={`${id}-error`}>{shown}</FieldError>
    </div>
  );
}

function Choices({
  label,
  name,
  options,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  options: readonly string[];
  defaultValue?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="group/chip relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option}
              defaultChecked={option === defaultValue}
              required
              className="peer sr-only"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-4 py-2.5 text-sm font-medium text-ink-soft transition peer-checked:border-navy-700 peer-checked:bg-navy-700 peer-checked:text-cream-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sun-500 hover:border-navy-700/50 hover:text-ink">
              <Icon.check className="hidden h-4 w-4 group-has-checked/chip:block" />
              {option}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </fieldset>
  );
}

const validatePhone = (value: string) =>
  isValidPhone(value) ? undefined : "Nomor WhatsApp belum valid, contoh: 0812 3456 7890.";

/* ── Bagian form ──────────────────────────────────────────────────────────── */

function FormHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-ink/10 pb-6">
      <h3 className="font-display text-2xl font-bold sm:text-3xl">{title}</h3>
      <div className="mt-2 leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3.5 text-sm text-red-800 ring-1 ring-red-200">
      <Icon.alert className="mt-0.5 h-5 w-5 shrink-0" />
      {message}
    </p>
  );
}

function FormFooter({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-5 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex max-w-sm items-start gap-2 text-sm text-ink-soft">
        <Icon.lock className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" />
        Datamu dikirim langsung ke tim Every Nation Kelapa Gading dan tidak ditampilkan di situs.
      </p>
      <button type="submit" disabled={pending} className="btn btn-navy w-full shrink-0 sm:w-auto">
        {pending ? (
          <>
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Mengirim…
          </>
        ) : (
          children
        )}
      </button>
    </div>
  );
}

function Honeypot() {
  return (
    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute h-0 w-0 opacity-0" />
  );
}

function Success({ title, body, onReset }: { title: string; body: string; onReset: () => void }) {
  return (
    <div role="status" className="flex flex-col items-center py-10 text-center sm:py-16">
      <div className="animate-pop grid h-20 w-20 place-items-center rounded-full bg-sun-500 text-ink shadow-[0_20px_50px_-20px_rgb(252_188_4/0.8)]">
        <Icon.check className="h-10 w-10" />
      </div>
      <h3 className="font-display mt-7 text-3xl font-bold">{title}</h3>
      <p className="mt-3 max-w-md leading-relaxed text-ink-soft">{body}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="#pelayanan" className="btn btn-outline">
          Lihat jadwal ibadah
        </a>
        <button type="button" onClick={onReset} className="btn btn-navy">
          Kirim lagi
        </button>
      </div>
    </div>
  );
}

function LifeGroupForm({ presetGroup, onReset }: { presetGroup?: string; onReset: () => void }) {
  const [state, action, pending] = useActionState(submitConnect, initialState);
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  if (state.status === "success") {
    return (
      <Success
        title="Pendaftaranmu sudah kami terima"
        body="Terima kasih. Tim Life Group akan menghubungimu lewat nomor WhatsApp yang kamu isi."
        onReset={onReset}
      />
    );
  }

  return (
    // noValidate: tooltip bawaan browser terpotong pada chip sr-only; validasi ditampilkan lewat pesan error situs.
    <form action={action} noValidate className="relative space-y-7">
      <input type="hidden" name="form" value="lifeGroup" />
      <Honeypot />
      <FormHeader title="Gabung Life Group">
        Wadah untuk terlibat dan bertumbuh bersama dalam pemuridan di kelompok kecil. Pilih Life Group Family, Young
        Professional, atau Youth.
      </FormHeader>
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="Nama" name="name" icon="user" autoComplete="name" placeholder="Nama lengkap" defaultValue={values.name} error={errors.name} />
        <TextField
          label="Nomor WhatsApp"
          name="phone"
          icon="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0812 3456 7890"
          defaultValue={values.phone}
          error={errors.phone}
          validate={validatePhone}
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Choices label="Jenis kelamin" name="gender" options={GENDERS} defaultValue={values.gender} error={errors.gender} />
        <Choices label="Domisili" name="domicile" options={DOMICILES} defaultValue={values.domicile} error={errors.domicile} />
      </div>
      <Choices label="Usia" name="ageRange" options={AGE_RANGES} defaultValue={values.ageRange} error={errors.ageRange} />
      <Choices
        label="Ingin bergabung di Life Group"
        name="group"
        options={LIFE_GROUPS}
        defaultValue={values.group ?? presetGroup}
        error={errors.group}
      />
      <ErrorBanner message={state.message} />
      <FormFooter pending={pending}>
        Daftar Life Group <Icon.arrowRight className="shift h-5 w-5" />
      </FormFooter>
    </form>
  );
}

function PrayerForm({ onReset }: { onReset: () => void }) {
  const [state, action, pending] = useActionState(submitConnect, initialState);
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  if (state.status === "success") {
    return (
      <Success
        title="Permohonan doamu sudah terkirim"
        body="Tim doa gereja akan mendoakan permohonanmu. Tuhan memberkati."
        onReset={onReset}
      />
    );
  }

  return (
    // noValidate: tooltip bawaan browser terpotong pada chip sr-only; validasi ditampilkan lewat pesan error situs.
    <form action={action} noValidate className="relative space-y-7">
      <input type="hidden" name="form" value="prayer" />
      <Honeypot />
      <FormHeader title="Permohonan Doa">
        <blockquote className="border-l-2 border-sun-500 pl-4">
          <p className="font-serif text-xl leading-snug text-ink italic">
            “Doa orang yang benar, bila dengan yakin didoakan, sangat besar kuasanya.”
          </p>
          <footer className="mt-1 text-sm">Yakobus 5:16</footer>
        </blockquote>
      </FormHeader>
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="Nama" name="name" icon="user" autoComplete="name" placeholder="Nama lengkap" defaultValue={values.name} error={errors.name} />
        <TextField
          label="Nomor WhatsApp"
          name="phone"
          icon="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0812 3456 7890"
          defaultValue={values.phone}
          error={errors.phone}
          validate={validatePhone}
        />
      </div>
      <Choices label="Jenis kelamin" name="gender" options={GENDERS} defaultValue={values.gender} error={errors.gender} />
      <TextArea
        label="Permohonan doa"
        name="request"
        placeholder="Tuliskan pokok doamu di sini."
        defaultValue={values.request}
        error={errors.request}
      />
      <ErrorBanner message={state.message} />
      <FormFooter pending={pending}>
        Kirim permohonan doa <Icon.arrowRight className="shift h-5 w-5" />
      </FormFooter>
    </form>
  );
}

/** Tanpa server: menyusun pesan lalu membuka WhatsApp. */
function MessageForm() {
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = `Halo Every Nation Kelapa Gading, saya ${String(data.get("name")).trim()}.\n\n${String(data.get("message")).trim()}`;
    window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <FormHeader title="Kirim Pesan">
        Tulis pertanyaanmu di sini. Pesan akan dibuka di WhatsApp gereja.
      </FormHeader>
      <TextField label="Nama" name="name" icon="user" autoComplete="name" placeholder="Nama lengkap" />
      <TextArea label="Pesan" name="message" placeholder="Halo, saya ingin bertanya tentang…" max={1000} />
      <div className="flex justify-end border-t border-ink/10 pt-6">
        <button type="submit" className="btn btn-wa w-full sm:w-auto">
          <Icon.whatsapp className="h-5 w-5" /> Lanjut ke WhatsApp
        </button>
      </div>
    </form>
  );
}

/* ── Tab ──────────────────────────────────────────────────────────────────── */

export function ConnectForm() {
  const [tab, setTab] = useState<Tab>("lifeGroup");
  const [presetGroup, setPresetGroup] = useState<string>();
  const [resets, setResets] = useState({ lifeGroup: 0, prayer: 0 });
  const baseId = useId();

  useEffect(() => {
    const apply = () => {
      const target = HASHES[window.location.hash.slice(1)];
      if (!target) return;
      setTab(target.tab);
      if (target.group) setPresetGroup(target.group);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const reset = (form: "lifeGroup" | "prayer") => () => setResets((r) => ({ ...r, [form]: r[form] + 1 }));

  // Panah kiri/kanan/atas/bawah berpindah tab, sesuai pola ARIA tablist.
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = (TABS.findIndex((item) => item.id === tab) + step + TABS.length) % TABS.length;
    setTab(TABS[index].id);
    document.getElementById(`${baseId}-tab-${TABS[index].id}`)?.focus();
  };

  return (
    <div className="grid overflow-hidden rounded-[2rem] bg-cream-50 shadow-lift ring-1 ring-ink/5 lg:grid-cols-[21rem_1fr]">
      <div className="bg-navy-deep relative isolate overflow-hidden p-4 text-cream-100 sm:p-6 lg:p-8">
        <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 -z-10 opacity-10 mix-blend-overlay" />
        <p className="hidden text-sm text-cream-100/60 lg:block">Apa yang bisa kami bantu?</p>
        <div
          role="tablist"
          aria-label="Pilih formulir"
          onKeyDown={onTabKey}
          className="flex gap-2 overflow-x-auto lg:mt-5 lg:flex-col lg:overflow-visible"
        >
          {TABS.map((item) => {
            const TabIcon = Icon[item.icon];
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${baseId}-tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(item.id)}
                className={`flex shrink-0 items-center gap-3 rounded-2xl p-2.5 pr-4 text-left transition duration-300 lg:p-3.5 ${
                  selected ? "bg-cream-50 text-ink shadow-lift" : "text-cream-100/75 hover:bg-white/7 hover:text-cream-100"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                    selected ? "bg-sun-500 text-ink" : "bg-white/10"
                  }`}
                >
                  <TabIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold whitespace-nowrap">{item.label}</span>
                  <span className={`mt-0.5 hidden text-xs lg:block ${selected ? "text-ink-soft" : "text-cream-100/50"}`}>
                    {item.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-10 hidden border-t border-white/10 pt-6 lg:block">
          <p className="text-sm text-cream-100/60">Lebih suka ngobrol langsung?</p>
          <a
            href={whatsappUrl(whatsappMessages.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display mt-2 inline-flex items-center gap-2 text-xl font-semibold transition-colors hover:text-sun-400"
          >
            <Icon.whatsapp className="h-5 w-5 text-sun-400" />
            {site.whatsapp.display}
          </a>
        </div>
      </div>

      {/* Semua panel tetap terpasang agar isian tidak hilang saat pindah tab. */}
      <div className="p-6 sm:p-10">
        <div role="tabpanel" id={`${baseId}-panel-lifeGroup`} aria-labelledby={`${baseId}-tab-lifeGroup`} hidden={tab !== "lifeGroup"}>
          <LifeGroupForm key={`${resets.lifeGroup}-${presetGroup}`} presetGroup={presetGroup} onReset={reset("lifeGroup")} />
        </div>
        <div role="tabpanel" id={`${baseId}-panel-prayer`} aria-labelledby={`${baseId}-tab-prayer`} hidden={tab !== "prayer"}>
          <PrayerForm key={resets.prayer} onReset={reset("prayer")} />
        </div>
        <div role="tabpanel" id={`${baseId}-panel-message`} aria-labelledby={`${baseId}-tab-message`} hidden={tab !== "message"}>
          <MessageForm />
        </div>
      </div>
    </div>
  );
}
