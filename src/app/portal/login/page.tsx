import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Notice } from "@/components/admin/ui";
import { PortalLoginForm } from "@/components/portal/login-form";
import logo from "@/assets/brand/logo-light.png";
import { Grain } from "@/components/ui";
import { isLeaderPortalConfigured } from "@/lib/leader-session";

export const metadata: Metadata = { title: "Masuk" };

export default async function PortalLoginPage({ searchParams }: { searchParams: Promise<{ alasan?: string }> }) {
  const { alasan } = await searchParams;

  return (
    <div className="bg-navy-deep relative isolate grid min-h-dvh place-items-center px-5 py-12">
      <Grain className="opacity-9" />
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Image src={logo} alt="Every Nation Kelapa Gading" className="mx-auto h-12 w-auto" priority />
          <h1 className="font-display mt-6 text-2xl font-bold text-cream-100">Portal Leader Life Group</h1>
          <p className="mt-1.5 text-sm text-cream-100/60">Anggota grup, laporan pertemuan, dan materi</p>
        </div>

        <div className="animate-rise mt-8 space-y-4 rounded-3xl bg-cream-50 p-6 shadow-deep sm:p-7">
          {alasan === "sesi" && <Notice tone="error">Sesi kamu sudah berakhir. Silakan masuk lagi.</Notice>}
          {isLeaderPortalConfigured() ? (
            <PortalLoginForm />
          ) : (
            <p className="text-sm leading-relaxed text-ink-soft">Portal belum dikonfigurasi di server ini.</p>
          )}
          <p className="text-center text-xs leading-relaxed text-ink-soft">
            Belum punya akun atau lupa password? Minta ke admin gereja.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-cream-100/60">
          <Link href="/admin/login" className="hover:text-sun-400">
            Pengurus? Masuk ke panel admin
          </Link>
        </p>
      </div>
    </div>
  );
}
