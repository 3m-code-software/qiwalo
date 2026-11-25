import Link from "next/link";
import TransportForm from "@/components/TransportForm";
import { requireRole } from "@/lib/auth";

export const instant = false;

export const metadata = { title: "إضافة نقل سياحي | قيوالو" };

export default async function NewTransportPage() {
  await requireRole("OWNER");
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/owner" className="text-sm font-bold text-nile">← رجوع للوحة المالك</Link>
        <h1 className="mt-3 text-3xl font-black">إضافة خدمة نقل سياحي</h1>
        <p className="muted mt-1 text-sm">سيارة، كوستر، باص أو موتوسيكل — كل خدمة مرتبطة بمدينة ومراجعة إدارة قبل النشر.</p>
      </div>
      <div className="soft-card !p-6">
        <TransportForm />
      </div>
    </main>
  );
}
