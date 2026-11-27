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

/**
 * Keadaan akun: database belum siap (schema.sql belum dijalankan), belum ada
 * admin aktif (instalasi baru → buat admin pertama), atau siap dipakai.
 * Sengaja bukan query `head`: tanpa isi, Supabase tidak melaporkan tabel yang belum ada.
 */
async function accountsState(): Promise<"belum-siap" | "admin-pertama" | "siap"> {
  const { data, error } = await createAdminClient()
    .from(TABLES.accounts)
    .select("id")
    .eq("is_admin", true)
    .eq("is_active", true)
    .limit(1);
  if (error) return "belum-siap";
  return data.length ? "siap" : "admin-pertama";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; alasan?: string }> }) {
  const { next, alasan } = await searchParams;
  const configured = isAuthConfigured();

  const session = configured ? await getSession() : null;
  if (session && (session.isAdmin || session.isLeader)) {
    const allowed = (session.isAdmin && next?.startsWith("/admin")) || (session.isLeader && next?.startsWith("/portal"));
    redirect(allowed ? next! : homeFor(session));
  }
  const state = configured ? await accountsState() : "belum-siap";
  const setup = state === "admin-pertama";

  return (
    <div className="bg-navy-deep relative isolate grid min-h-dvh place-items-center px-5 py-12">
      <Grain className="opacity-9" />
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Image src={logo} alt="Every Nation Kelapa Gading" className="mx-auto h-12 w-auto" priority />
          <h1 className="font-display mt-6 text-2xl font-bold text-cream-100">{setup ? "Buat admin pertama" : "Masuk"}</h1>
        </div>

        <div className="animate-rise mt-8 space-y-4 rounded-3xl bg-cream-50 p-6 shadow-deep sm:p-7">
          {alasan === "sesi" && <Notice tone="error">Sesi kamu sudah berakhir. Silakan masuk lagi.</Notice>}
          {alasan === "akses" && <Notice tone="error">Akun ini belum punya akses ke halaman itu.</Notice>}
          {configured && state === "belum-siap" ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              Database akun belum siap. Pengelola server perlu menjalankan{" "}
              <code className="rounded bg-cream-200 px-1.5 py-0.5 text-xs">supabase/schema.sql</code> sekali, lalu muat ulang halaman ini.
            </p>
          ) : !configured ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              Login belum dikonfigurasi. Isi kredensial Supabase di <code className="rounded bg-cream-200 px-1.5 py-0.5 text-xs">.env</code> lalu
              jalankan ulang server.
            </p>
          ) : setup ? (
            <SetupForm minLength={MIN_LEADER_PASSWORD_LENGTH} />
          ) : (
            <>
              <LoginForm next={next} />
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
