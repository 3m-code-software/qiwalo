import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: { default: "قيوالو | إقامات الأقصر وأسوان", template: "%s | قيوالو" },
  description: "شقق وشاليهات وفنادق في الأقصر وأسوان بأسعار واضحة وتأكيد فوري.",
};

export const viewport: Viewport = { themeColor: "#0d6b73" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<div className="h-16 border-b border-line bg-white" />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
