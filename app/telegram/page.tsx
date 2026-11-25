import type { Metadata } from "next";
import Link from "next/link";
import { telegramBotLink, verifyTelegramActivationToken } from "@/lib/telegram";

export const instant = false;

export const metadata: Metadata = {
  title: "تفعيل إشعارات تليجرام",
  description: "فعّل بوت قيوالو عشان يوصلك رسالة الترحيب على تليجرام.",
};

function safePath(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "";
}

export default async function TelegramPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const token = Array.isArray(sp.token) ? sp.token[0] ?? "" : sp.token ?? "";
  const next = safePath(sp.next);
  const activation = token ? await verifyTelegramActivationToken(token) : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <div className="soft-card">
        <span className="chip">خطوة اختيارية</span>
        <h1 className="mt-4 text-3xl font-black text-navy">تفعيل إشعارات تليجرام</h1>
        {activation ? (
          <>
            <p className="mt-3 leading-8 text-navy">تم إنشاء حسابك يا {activation.name} ✅</p>
            <p className="muted mt-2 text-sm leading-7">
              اضغط الرابط، ثم اضغط <b>Start</b> داخل البوت. هيوصلك ترحيب فيه اسمك فقط، من غير رقم تليفون.
            </p>
            <a
              href={telegramBotLink(token)}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-6 inline-block w-full !py-3 text-center"
            >
              افتح بوت قيوالو ↗
            </a>
          </>
        ) : (
          <p className="muted mt-3 text-sm leading-7">
            رابط التفعيل غير صالح أو انتهى. تقدر تكمل للواجهة بدون تفعيل، أو اطلب رابط جديد من الدعم.
          </p>
        )}
        <div className="gold-rule my-6" />
        <Link href={next || "/"} className="btn-ghost block w-full !py-3 text-center">
          تخطي والدخول للواجهة
        </Link>
      </div>
    </div>
  );
}
