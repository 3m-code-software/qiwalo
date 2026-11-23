import Link from "next/link";
import PropertyForm from "@/components/PropertyForm";
import { requireRole } from "@/lib/auth";

export const instant = false;

export default async function NewUnitPage() {
  await requireRole("OWNER");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/owner" className="text-sm font-bold text-nile">← رجوع للوحة المالك</Link>
        <h1 className="mt-3 text-3xl font-black">إضافة وحدة جديدة</h1>
        <p className="muted mt-1 text-sm">املأ البيانات الأساسية. المراجعة والنشر من جانب الإدارة.</p>
      </div>
      <div className="soft-card">
        <PropertyForm />
      </div>
    </div>
  );
}
