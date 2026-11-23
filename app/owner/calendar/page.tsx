import Link from "next/link";
import { createPriceRuleAction, deletePriceRuleAction, saveAvailabilityAction } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { dateAr, money, toArabicDigits } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const instant = false;

function isoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return isoDay(date);
}

function weekdayAr(iso: string): string {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "short" }).format(new Date(`${iso}T00:00:00`));
}

function AvailabilityForm({
  propertyId,
  mode,
  startDate,
  endDate,
}: {
  propertyId: string;
  mode: "block" | "unblock";
  startDate: string;
  endDate: string;
}) {
  const blocking = mode === "block";
  return (
    <form action={saveAvailabilityAction} className="space-y-3 rounded-xl border border-line bg-ivory p-4">
      <input type="hidden" name="propertyId" value={propertyId} />
      {blocking && <input type="hidden" name="isBlocked" value="on" />}
      <p className="font-extrabold text-navy">{blocking ? "حظر فترة" : "إتاحة فترة"}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label" htmlFor={`${mode}-start`}>من</label>
          <input id={`${mode}-start`} name="startDate" type="date" className="input" defaultValue={startDate} required />
        </div>
        <div>
          <label className="label" htmlFor={`${mode}-end`}>إلى</label>
          <input id={`${mode}-end`} name="endDate" type="date" className="input" defaultValue={endDate} required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`${mode}-price`}>سعر خاص لهذه الفترة (اختياري)</label>
        <input id={`${mode}-price`} name="priceOverride" type="number" min={0} className="input" placeholder="اتركه فارغاً لاستخدام السعر الأساسي" />
      </div>
      <button type="submit" className={`w-full text-sm ${blocking ? "btn-primary" : "btn-ghost"}`}>
        {blocking ? "حظر التواريخ" : "إتاحة التواريخ"}
      </button>
    </form>
  );
}

export default async function OwnerCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole("OWNER");
  const sp = await searchParams;
  const requested = Array.isArray(sp.propertyId) ? sp.propertyId[0] : sp.propertyId;
  const repo = await getRepo();
  const properties = await repo.listPropertiesForOwner(session.email);
  const selected = properties.find((p) => p.id === requested) ?? properties[0];

  if (!selected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/owner" className="text-sm font-bold text-nile">← رجوع للوحة المالك</Link>
        <h1 className="mt-3 text-3xl font-black">التقويم والأسعار</h1>
        <div className="soft-card mt-6 text-center">
          <p className="muted">أضف وحدة أولاً لتتمكن من إدارة التواريخ والأسعار.</p>
          <Link href="/owner/units/new" className="btn-primary mt-4 text-sm">إضافة وحدة</Link>
        </div>
      </div>
    );
  }

  const [availability, rules] = await Promise.all([
    repo.getAvailability(selected.id),
    repo.getPriceRules(selected.id),
  ]);
  const byDate = new Map(availability.map((a) => [a.date, a]));
  const today = isoDay(new Date());
  const days = Array.from({ length: 30 }, (_, i) => shiftDays(today, i));
  const defaultEnd = shiftDays(today, 7);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/owner" className="text-sm font-bold text-nile">← رجوع للوحة المالك</Link>
          <h1 className="mt-3 text-3xl font-black">التقويم والأسعار</h1>
          <p className="muted mt-1 text-sm">تحكم في التواريخ المحجوزة والأسعار الخاصة لمدة 30 يوماً قادمة.</p>
        </div>
        <Link href={`/owner/units/${selected.id}/preview`} className="btn-ghost !py-2 text-sm">معاينة الوحدة ↗</Link>
      </div>

      <form method="get" className="soft-card mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label className="label" htmlFor="propertyId">الوحدة</label>
          <select id="propertyId" name="propertyId" className="input" defaultValue={selected.id}>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-primary !py-2 text-sm">عرض</button>
      </form>

      <section className="soft-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-navy">أيام {dateAr(today)} إلى {dateAr(days[29])}</h2>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="chip">متاح</span>
            <span className="chip chip-gold">سعر خاص</span>
            <span className="chip !bg-red-50 !text-red-700">محجوز</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
          {days.map((date) => {
            const entry = byDate.get(date);
            const tone = entry?.isBlocked
              ? "border-red-200 bg-red-50 text-red-700"
              : entry?.priceOverride
                ? "border-gold/50 bg-gold-soft text-navy"
                : "border-line bg-navy-soft text-navy";
            return (
              <div key={date} className={`rounded-xl border p-2 text-center ${tone}`}>
                <p className="text-xs font-bold">{weekdayAr(date)}</p>
                <p className="text-lg font-black">{toArabicDigits(Number(date.slice(8)))}</p>
                <p className="text-[10px] font-bold">
                  {entry?.isBlocked ? "محجوز" : entry?.priceOverride ? money(entry.priceOverride) : "متاح"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="soft-card">
          <h2 className="mb-4 text-lg font-extrabold text-navy">تعديل التواريخ</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <AvailabilityForm propertyId={selected.id} mode="block" startDate={today} endDate={defaultEnd} />
            <AvailabilityForm propertyId={selected.id} mode="unblock" startDate={today} endDate={defaultEnd} />
          </div>
          <p className="muted mt-3 text-xs">السعر الخاص يُستخدم لكل يوم في الفترة المحددة. اتركه فارغاً لإلغاء أي سعر خاص سابق.</p>
        </section>

        <section className="soft-card">
          <h2 className="mb-4 text-lg font-extrabold text-navy">قواعد الأسعار</h2>
          <form action={createPriceRuleAction} className="space-y-3 rounded-xl border border-line bg-ivory p-4">
            <input type="hidden" name="propertyId" value={selected.id} />
            <div>
              <label className="label" htmlFor="ruleName">اسم القاعدة</label>
              <input id="ruleName" name="name" className="input" placeholder="موسم الشتاء" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label" htmlFor="ruleStart">من</label>
                <input id="ruleStart" name="startDate" type="date" className="input" defaultValue={today} required />
              </div>
              <div>
                <label className="label" htmlFor="ruleEnd">إلى</label>
                <input id="ruleEnd" name="endDate" type="date" className="input" defaultValue={defaultEnd} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label" htmlFor="rulePrice">سعر الليلة</label>
                <input id="rulePrice" name="price" type="number" min={100} className="input" defaultValue={selected.basePrice} required />
              </div>
              <div>
                <label className="label" htmlFor="ruleMin">أقل إقامة (ليالي)</label>
                <input id="ruleMin" name="minNights" type="number" min={1} className="input" defaultValue={1} required />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full text-sm">إضافة القاعدة</button>
          </form>

          <div className="mt-5 space-y-3">
            {rules.length === 0 && <p className="muted text-sm">لا توجد قواعد أسعار لهذه الوحدة.</p>}
            {rules.map((rule) => (
              <div key={rule.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-ivory p-3 text-sm">
                <div>
                  <p className="font-extrabold text-navy">{rule.name}</p>
                  <p className="muted text-xs">{dateAr(rule.startDate)} – {dateAr(rule.endDate)} · {money(rule.price)} · {toArabicDigits(rule.minNights)} ليالي</p>
                </div>
                <form action={deletePriceRuleAction}>
                  <input type="hidden" name="propertyId" value={selected.id} />
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <button type="submit" className="btn-ghost !px-3 !py-1.5 text-xs">حذف</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
