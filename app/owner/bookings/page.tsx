import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { dateAr, money } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

export default async function OwnerBookingsPage() {
  const session = await requireRole("OWNER");
  const bookings = await (await getRepo()).listBookingsForOwner(session.email);
  const total = bookings.filter((b) => b.status !== "CANCELLED").reduce((s, b) => s + b.total - b.commission, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/owner" className="text-sm font-bold text-nile">← رجوع للوحة المالك</Link>
      <h1 className="mt-3 text-3xl font-black">الحجوزات</h1>
      <p className="muted mt-1 text-sm">صافي المستحق بعد خصم عمولة المنصة {money(total)}.</p>

      <div className="mt-6 grid gap-4">
        {bookings.map((b) => (
          <div key={b.id} className="soft-card flex flex-wrap items-center justify-between gap-4">
            <div>
              <p dir="ltr" className="font-black text-nile">{b.reference}</p>
              <p className="mt-1 font-bold">{b.propertyName}</p>
              <p className="muted text-xs">{b.guestName} · {dateAr(b.checkIn)} – {dateAr(b.checkOut)} · {b.nights} ليالي</p>
            </div>
            <div className="text-left">
              <p className="text-lg font-black">{money(b.total)}</p>
              <p className="muted text-xs">العمولة {money(b.commission)} · الصافي {money(b.total - b.commission)}</p>
              <p className="mt-1 text-xs font-bold">{b.status === "CONFIRMED" ? "مؤكد" : b.status === "COMPLETED" ? "مكتمل" : b.status} · {b.paymentStatus}</p>
              <Link href={`/booking/${b.reference}`} className="text-xs font-bold text-nile">تفاصيل ↗</Link>
            </div>
          </div>
        ))}
        {bookings.length === 0 && <div className="soft-card text-center muted">لا توجد حجوزات بعد.</div>}
      </div>
    </div>
  );
}
