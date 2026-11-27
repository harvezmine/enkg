import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Portal Leader", template: "%s · Portal Leader ENKG" },
  robots: { index: false, follow: false },
};

export default function PortalRootLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-cream-100">{children}</div>;
}
