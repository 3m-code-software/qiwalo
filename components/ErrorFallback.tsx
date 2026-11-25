"use client";

import Link from "next/link";
import { SUPPORT_PHONE, SUPPORT_TELEGRAM, SUPPORT_WHATSAPP } from "@/lib/constants";

/**
 * واجهة عربية موحّدة للأخطاء. كل التنسيقات inline عشان تشتغل حتى في
 * global-error اللي بيستبدل الـ root layout وما بياخدش الـ global CSS.
 */
export default function ErrorFallback({ onRetry, global = false }: {
  onRetry: () => void;
  global?: boolean;
}) {
  return (
    <div
      dir="rtl"
      lang="ar"
      className={global ? undefined : "mx-auto max-w-2xl px-4 py-12"}
      style={{
        minHeight: global ? "100vh" : "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: global ? "48px 16px" : undefined,
        background: global ? "#faf8f4" : undefined,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          margin: "0 auto",
          padding: "32px 24px",
          background: "#ffffff",
          border: "1px solid #e7e1d6",
          borderRadius: 20,
          boxShadow: "0 18px 50px rgba(6,25,46,0.08)",
          textAlign: "center",
          color: "#12243a",
          fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
        }}
      >
        <div
          aria-hidden
          style={{
            margin: "0 auto 18px",
            width: 64,
            height: 64,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "#f6efdf",
            color: "#c6a15b",
            fontSize: 30,
          }}
        >
          ✦
        </div>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 999,
            border: "1px solid rgba(198,161,91,0.5)",
            background: "#f6efdf",
            color: "#0a2440",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          قيوالو · الأقصر وأسوان
        </span>
        <h1 style={{ margin: "18px 0 8px", fontSize: 28, fontWeight: 900, color: "#0a2440" }}>
          حصل خلط بسيط، جرّب تاني 🙏
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 2, color: "#6c7887" }}>
          حصلت مشكلة غير متوقعة ومش متعلقة بحجزك أو بياناتك. جرّب تاني، ولو استمرت المشكلة تواصل مع الدعم.
        </p>

        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 24,
            width: "100%",
            maxWidth: 280,
            padding: "12px 18px",
            border: 0,
            borderRadius: 12,
            background: "#c6a15b",
            color: "#06192e",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          إعادة المحاولة
        </button>

        <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <Link href="/" style={{ color: "#0a2440", fontWeight: 800, fontSize: 14, textDecoration: "underline", textDecorationColor: "#c6a15b" }}>
            الرئيسية
          </Link>
          <Link href="/search" style={{ color: "#0a2440", fontWeight: 800, fontSize: 14, textDecoration: "underline", textDecorationColor: "#c6a15b" }}>
            ابحث عن إقامة
          </Link>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, lineHeight: 2, color: "#6c7887" }}>
          الدعم:{" "}
          <a dir="ltr" href={SUPPORT_WHATSAPP} style={{ color: "#0a2440", fontWeight: 700 }}>واتساب</a>
          {" · "}
          <a dir="ltr" href={SUPPORT_TELEGRAM} style={{ color: "#0a2440", fontWeight: 700 }}>تليجرام</a>
          {" · "}
          <a dir="ltr" href={`tel:${SUPPORT_PHONE}`} style={{ color: "#0a2440", fontWeight: 700 }}>{SUPPORT_PHONE}</a>
        </p>
      </div>
    </div>
  );
}
