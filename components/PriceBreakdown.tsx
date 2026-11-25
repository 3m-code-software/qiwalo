import { dateAr, money, toArabicDigits } from "@/lib/format";
import type { Quote } from "@/lib/pricing";

/** Guest-facing price details: nightly rates, subtotal, service fee and final total. */
export default function PriceBreakdown({
  quote,
  commissionRate,
  openNights = false,
  className = "",
  addOns = [],
}: {
  quote: Quote;
  commissionRate?: number;
  openNights?: boolean;
  className?: string;
  addOns?: { label: string; amount: number; commission: number }[];
}) {
  const extrasTotal = addOns.reduce((sum, item) => sum + item.amount, 0);
  const extrasCommission = addOns.reduce((sum, item) => sum + item.commission, 0);
  return (
    <div className={`space-y-2 text-sm ${className}`}>
      {quote.nightly.length > 0 && (
        <details open={openNights} className="rounded-lg border border-line/70 bg-ivory/60 px-3 py-2">
          <summary className="cursor-pointer font-bold text-navy">
            تفصيل الليالي ({toArabicDigits(quote.nights)})
          </summary>
          <div className="mt-2 space-y-1.5">
            {quote.nightly.map((night) => (
              <div key={night.date} className="flex justify-between gap-3">
                <span className="muted">
                  {dateAr(night.date)}{night.ruleName ? ` · ${night.ruleName}` : ""}
                </span>
                <span className="font-bold">{money(night.price)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
      <div className="flex justify-between gap-3">
        <span className="muted">المجموع الفرعي</span>
        <span className="font-bold">{money(quote.subtotal)}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="muted">رسوم الخدمة</span>
        <span className="font-bold">{money(quote.serviceFee)}</span>
      </div>
      {addOns.map((addOn) => (
        <div key={addOn.label} className="flex justify-between gap-3" data-testid="price-addon">
          <span className="muted">{addOn.label}</span>
          <span className="font-bold">{money(addOn.amount)}</span>
        </div>
      ))}
      <div className="flex justify-between gap-3 text-lg font-black text-nile">
        <span>الإجمالي</span>
        <span>{money(quote.total + extrasTotal)}</span>
      </div>
      {commissionRate !== undefined && (
        <p className="muted border-t border-line pt-2 text-xs leading-6">
          عمولة المنصة ({toArabicDigits(commissionRate)}٪ = {money(quote.commission + extrasCommission)}) تُقتطع من المالك بعد التأكيد، وهي غير مضافة لما يدفعه الضيف.
        </p>
      )}
    </div>
  );
}
