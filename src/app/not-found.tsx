import Link from "next/link";

import { Grain } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="bg-navy-deep relative isolate grid min-h-dvh place-items-center overflow-hidden px-5 text-center text-cream-100">
      <Grain className="opacity-9" />
      <div>
        <p aria-hidden="true" className="font-display text-[9rem] leading-none font-bold text-white/10 sm:text-[14rem]">
          404
        </p>
        <h1 className="text-headline -mt-6 font-bold sm:-mt-10">Halaman ini tidak ditemukan.</h1>
        <p className="text-lead mx-auto mt-4 max-w-md text-cream-100/70">
          Mungkin tautannya sudah berubah. Yuk kembali ke beranda Every Nation Kelapa Gading.
        </p>
        <Link href="/" className="btn btn-sun mt-8">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
