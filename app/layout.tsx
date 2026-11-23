import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import TermsBanner from "@/components/TermsBanner";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "قيوالو | إقامات الأقصر وأسوان", template: "%s | قيوالو" },
  description: "شقق وشاليهات وفنادق في الأقصر وأسوان بأسعار واضحة وتأكيد فوري.",
};

export const viewport: Viewport = { themeColor: "#0a2440" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`h-full ${cairo.variable}`}>
      <body className="flex min-h-full flex-col bg-ivory">
        <Suspense fallback={<div className="h-[74px] border-b border-line bg-white" />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Suspense fallback={null}>
          <TermsBanner />
        </Suspense>
        <Script id="tawk-api-init" strategy="beforeInteractive">
          {`var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();`}
        </Script>
        <Script
          src="https://embed.tawk.to/6a65d4fd9b421a1d428467c3/1juesg01j"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
