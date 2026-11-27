import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm, SetupForm } from "@/components/admin/login-form";
import { Notice } from "@/components/admin/ui";
import logo from "@/assets/brand/logo-light.png";
import { Grain } from "@/components/ui";
import { getSession, homeFor } from "@/lib/auth";
import { TABLES } from "@/lib/db-types";
import { MIN_LEADER_PASSWORD_LENGTH } from "@/lib/password";
import { isAuthConfigured } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Masuk", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Belum ada admin aktif sama sekali (instalasi baru): tampilkan pembuatan admin pertama. */
async function needsFirstAdmin() {
  const { count, error } = await createAdminClient()
    .from(TABLES.accounts)
    .select("id", { count: "exact", head: true })
    .eq("is_admin", true)
    .eq("is_active", true);
  return !error && !count;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; alasan?: string }> }) {
  const { next, alasan } = await searchParams;
  const configured = isAuthConfigured();

  const session = configured ? await getSession() : null;
  if (session && (session.isAdmin || session.isLeader)) {
    const allowed = (session.isAdmin && next?.startsWith("/admin")) || (session.isLeader && next?.startsWith("/portal"));
    redirect(allowed ? next! : homeFor(session));
  }
  const setup = configured && (await needsFirstAdmin());

  return (
    <div className="bg-navy-deep relative isolate grid min-h-dvh place-items-center px-5 py-12">
      <Grain className="opacity-9" />
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Image src={logo} alt="Every Nation Kelapa Gading" className="mx-auto h-12 w-auto" priority />
          <h1 className="font-display mt-6 text-2xl font-bold text-cream-100">{setup ? "Buat admin pertama" : "Masuk"}</h1>
          <p className="mt-1.5 text-sm text-cream-100/60">
            {setup ? "Sekali saja, sebelum admin lain didaftarkan dari panel." : "Untuk pengurus dan leader Life Group"}
          </p>
        </div>

        <div className="animate-rise mt-8 space-y-4 rounded-3xl bg-cream-50 p-6 shadow-deep sm:p-7">
          {alasan === "sesi" && <Notice tone="error">Sesi kamu sudah berakhir. Silakan masuk lagi.</Notice>}
          {alasan === "akses" && <Notice tone="error">Akun ini belum punya akses ke halaman itu.</Notice>}
          {!configured ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              Login belum dikonfigurasi. Isi kredensial Supabase di <code className="rounded bg-cream-200 px-1.5 py-0.5 text-xs">.env</code> lalu
              jalankan ulang server.
            </p>
          ) : setup ? (
            <SetupForm minLength={MIN_LEADER_PASSWORD_LENGTH} />
          ) : (
            <>
              <LoginForm next={next} />
              <p className="text-center text-xs leading-relaxed text-ink-soft">Belum punya akun atau lupa password? Minta ke admin gereja.</p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-cream-100/60">
          <Link href="/" className="hover:text-sun-400">
            Kembali ke situs
          </Link>
        </p>
      </div>
    </div>
  );
}
