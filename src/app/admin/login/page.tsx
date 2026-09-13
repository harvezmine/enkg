import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import logo from "@/assets/brand/logo-light.png";
import { LoginForm } from "@/components/admin/login-form";
import { Grain } from "@/components/ui";
import { MIN_PASSWORD_LENGTH, isAdminConfigured } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className="bg-navy-deep relative isolate grid min-h-dvh place-items-center px-5 py-12">
      <Grain className="opacity-9" />
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Image src={logo} alt="Every Nation Kelapa Gading" className="mx-auto h-12 w-auto" priority />
          <h1 className="font-display mt-6 text-2xl font-bold text-cream-100">Panel Pengurus</h1>
          <p className="mt-1.5 text-sm text-cream-100/60">News, event, dan kiriman Contact Us</p>
        </div>

        <div className="animate-rise mt-8 rounded-3xl bg-cream-50 p-6 shadow-deep sm:p-7">
          {isAdminConfigured() ? (
            <LoginForm next={next} />
          ) : (
            <div className="text-sm leading-relaxed text-ink-soft">
              <p className="font-semibold text-ink">Admin panel belum dikonfigurasi.</p>
              <p className="mt-2">
                Salin <code className="rounded bg-cream-200 px-1.5 py-0.5 text-xs">.env.example</code> menjadi{" "}
                <code className="rounded bg-cream-200 px-1.5 py-0.5 text-xs">.env.local</code>, isi kredensial Supabase
                (termasuk service-role key) dan <code className="rounded bg-cream-200 px-1.5 py-0.5 text-xs">ADMIN_PASSWORD</code>{" "}
                minimal {MIN_PASSWORD_LENGTH} karakter, lalu jalankan ulang server.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-cream-100/60">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-sun-400">
            Kembali ke situs
          </Link>
        </p>
      </div>
    </div>
  );
}
