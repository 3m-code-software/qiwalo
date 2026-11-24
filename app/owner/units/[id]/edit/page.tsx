import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PropertyForm from "@/components/PropertyForm";
import { getSession } from "@/lib/auth";
import { getRepo } from "@/lib/repo";

export const instant = false;

const statusLabel: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING: "قيد المراجعة",
  PUBLISHED: "منشورة",
  REJECTED: "مرفوضة",
};

export default async function EditUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/owner/units/${id}/edit`)}`);
  if (session.role !== "OWNER" && session.role !== "ADMIN") redirect("/");

  const repo = await getRepo();
  const property = await repo.getPropertyById(id);
  if (!property) notFound();
  if (session.role !== "ADMIN" && property.ownerId !== session.email) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href={`/owner/units/${id}/preview`} className="text-sm font-bold text-nile">← رجوع للمعاينة</Link>
        <h1 className="mt-3 text-3xl font-black">تعديل الوحدة</h1>
        <p className="muted mt-1 text-sm">
          {property.name} · الحالة الحالية: <span className="font-bold">{statusLabel[property.status] ?? property.status}</span>
        </p>
        <p className="muted mt-1 text-xs">
          الرابط ثابت ولن يتغير؛ الحجوزات والتقييمات ونسبة العمولة مش هيتلمسوا.
        </p>
      </div>
      <div className="soft-card">
        <PropertyForm property={property} />
      </div>
    </div>
  );
}
