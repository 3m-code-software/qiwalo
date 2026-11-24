import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور",
  description: "استعد كلمة مرور حساب قيوالو عبر بريدك الإلكتروني.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="soft-card">
        <div className="mb-6 text-center">
          <span className="chip">استعادة الحساب</span>
          <h1 className="mt-3 text-2xl font-black">نسيت كلمة المرور؟</h1>
          <p className="muted mt-1 text-sm">اكتب بريدك وهيوصلك رابط لتعيين كلمة مرور جديدة.</p>
        </div>
        <ForgotPasswordForm />
        <p className="muted mt-5 text-center text-xs">
          <Link href="/login" className="font-bold text-navy underline decoration-gold underline-offset-2">
            الرجوع لتسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
