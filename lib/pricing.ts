import { differenceInCalendarDays, eachDayOfInterval, format, parseISO } from "date-fns";
import { COMMISSION_RATE, GUEST_SERVICE_FEE_RATE } from "./constants";
import type { Availability, PriceRule, Property } from "./types";

export interface NightPrice {
  date: string;
  price: number;
  ruleName?: string;
}

export interface Quote {
  nights: number;
  nightly: NightPrice[];
  subtotal: number;
  serviceFee: number;
  commission: number;
  total: number;
  ownerPayout: number;
}

export type QuoteResult =
  | { ok: true; quote: Quote }
  | { ok: false; reason: "invalid_dates" | "unavailable" | "min_nights"; minNights?: number };

export function priceForDate(
  date: string,
  property: Pick<Property, "basePrice">,
  rules: PriceRule[],
  availability: Availability[] = [],
): number {
  const override = availability.find((a) => a.date === date)?.priceOverride;
  if (override != null) return override;
  const rule = rules.find((r) => date >= r.startDate && date <= r.endDate);
  return rule ? rule.price : property.basePrice;
}

export function quoteStay(
  property: Property,
  rules: PriceRule[],
  availability: Availability[],
  checkIn: string,
  checkOut: string,
): QuoteResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    return { ok: false, reason: "invalid_dates" };
  }
  if (checkOut <= checkIn) return { ok: false, reason: "invalid_dates" };

  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  const nights = differenceInCalendarDays(end, start);
  const dates = eachDayOfInterval({ start, end: new Date(end.getTime() - 86400000) });
  const keys = dates.map((d) => format(d, "yyyy-MM-dd"));

  if (availability.some((a) => a.isBlocked && keys.includes(a.date))) {
    return { ok: false, reason: "unavailable" };
  }

  let subtotal = 0;
  let minNights = 1;
  const nightly: NightPrice[] = keys.map((date) => {
    const rule = rules.find((r) => date >= r.startDate && date <= r.endDate);
    if (rule) minNights = Math.max(minNights, rule.minNights);
    const price = priceForDate(date, property, rules, availability);
    subtotal += price;
    return { date, price, ruleName: rule?.name };
  });

  if (nights < minNights) return { ok: false, reason: "min_nights", minNights };

  const serviceFee = Math.round(subtotal * GUEST_SERVICE_FEE_RATE);
  const rate = (property as Property & { commissionRate?: number }).commissionRate ?? COMMISSION_RATE;
  const commission = Math.round(subtotal * (rate / 100));
  const total = subtotal + serviceFee;

  return {
    ok: true,
    quote: { nights, nightly, subtotal, serviceFee, commission, total, ownerPayout: total - commission },
  };
}
