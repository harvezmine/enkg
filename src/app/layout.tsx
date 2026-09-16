import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { MotionProvider } from "@/components/motion";
import { site } from "@/content/site";

import "./globals.css";

/* Grotesk tegas untuk judul (senada logo), sans yang nyaman untuk teks, serif untuk ayat. */
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Gereja di Kelapa Gading, Jakarta Utara`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "every nation kelapa gading",
    "enkg",
    "gereja kelapa gading",
    "gereja jakarta utara",
    "mahaka square",
    "life group",
    "kids church",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#1c4484" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Church",
  name: site.name,
  url: site.url,
  image: `${site.url}/opengraph-image.png`,
  telephone: `+${site.whatsapp.number}`,
  email: site.email,
  parentOrganization: { "@type": "Organization", name: site.synod },
  address: {
    "@type": "PostalAddress",
    streetAddress: `${site.address.building}, ${site.address.street}`,
    addressLocality: "Kelapa Gading",
    addressRegion: "DKI Jakarta",
    postalCode: "14240",
    addressCountry: "ID",
  },
  geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
  hasMap: site.maps.link,
  sameAs: Object.values(site.socials),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${serif.variable}`}>
      <body>
        {/* Tanpa JavaScript, elemen AOS tetap terlihat. */}
        <noscript>
          <style>{"[data-aos]{opacity:1!important;transform:none!important;clip-path:none!important}"}</style>
        </noscript>
        <MotionProvider>{children}</MotionProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
