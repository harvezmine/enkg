import { About } from "@/components/sections/about";
import { Beliefs } from "@/components/sections/beliefs";
import { Connect } from "@/components/sections/connect";
import { Give } from "@/components/sections/give";
import { Hero } from "@/components/sections/hero";
import { LifeGroup } from "@/components/sections/life-group";
import { News } from "@/components/sections/news";
import { Procon } from "@/components/sections/procon";
import { Services } from "@/components/sections/services";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { getNewsItems, getProconEvents } from "@/lib/queries";

// Halaman statis yang dibangun ulang tiap jam, supaya "ibadah berikutnya"
// dan tanggal jadwal selalu terkini tanpa merender ulang di setiap kunjungan.
// Simpan/terbitkan di admin panel langsung memperbarui halaman ini (revalidatePath).
export const revalidate = 3600;

export default async function HomePage() {
  const now = new Date();
  const [newsItems, proconEvents] = await Promise.all([getNewsItems(), getProconEvents()]);

  return (
    <>
      <a
        href="#konten"
        className="sr-only z-60 rounded-full bg-sun-500 px-5 py-3 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Lewati ke konten
      </a>
      <SiteHeader />
      <main id="konten">
        <Hero now={now} />
        <About />
        <LifeGroup />
        <Services now={now} />
        <Beliefs />
        <News now={now} items={newsItems} />
        <Procon events={proconEvents} />
        <Connect />
        <Give />
      </main>
      <SiteFooter now={now} />
      <WhatsAppFab />
    </>
  );
}
