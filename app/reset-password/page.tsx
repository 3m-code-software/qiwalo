import type { Metadata } from "next";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "تعيين كلمة مرور جديدة",
  description: "عيّن كلمة مرور جديدة لحساب قيوالو.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const code = Array.isArray(sp.code) ? sp.code[0] : sp.code;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="soft-card">
        <div className="mb-6 text-center">
          <span className="chip">كلمة مرور جديدة</span>
          <h1 className="mt-3 text-2xl font-black">حدّث كلمة المرور</h1>
          <p className="muted mt-1 text-sm">اكتب كلمة مرور جديدة بطول ٦ أحرف على الأقل.</p>
        </div>
        <ResetPasswordForm code={code ?? ""} />
      </div>
    </div>
  );
}
