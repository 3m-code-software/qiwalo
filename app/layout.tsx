import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

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
      </body>
    </html>
  );
}
