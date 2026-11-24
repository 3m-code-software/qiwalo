import type { Booking, Review } from "@/lib/types";

const SHORT_MONTHS = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"];

export type OwnerStatPoint = { key: string; label: string; count: number };

export type OwnerStatsData = {
  monthBookings: number;
  monthNet: number;
  avgRating: number | null;
  occupancyPct: number;
  chart: OwnerStatPoint[];
};

const pad = (value: number) => String(value).padStart(2, "0");
const monthKey = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;

function nightsBetween(start: string, end: string): number {
  if (start >= end) return 0;
  return Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000));
}

export function buildOwnerStats({
  bookings,
  reviews,
  publishedCount,
  now = new Date(),
}: {
  bookings: Booking[];
  reviews: Review[];
  publishedCount: number;
  now?: Date;
}): OwnerStatsData {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));
  const monthStartStr = monthKey(monthStart) + "-01";
  const monthEndStr = monthKey(monthEnd) + "-01";
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const confirmed = bookings.filter(
    (booking) => booking.status === "CONFIRMED" || booking.status === "COMPLETED",
  );
  const inMonth = confirmed.filter(
    (booking) => booking.checkIn < monthEndStr && booking.checkOut > monthStartStr,
  );
  const monthNet = inMonth.reduce((sum, booking) => sum + booking.total - booking.commission, 0);

  const bookedNights = inMonth.reduce((sum, booking) => {
    const from = booking.checkIn > monthStartStr ? booking.checkIn : monthStartStr;
    const to = booking.checkOut < monthEndStr ? booking.checkOut : monthEndStr;
    return sum + nightsBetween(from, to);
  }, 0);
  const availableNights = daysInMonth * publishedCount;
  const occupancyPct = availableNights > 0
    ? Math.min(100, Math.round((bookedNights / availableNights) * 100))
    : 0;

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  const chart: OwnerStatPoint[] = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 5 + index, 1));
    const key = monthKey(date);
    const next = monthKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)));
    return {
      key,
      label: SHORT_MONTHS[date.getUTCMonth()],
      count: confirmed.filter((booking) => booking.checkIn >= key && booking.checkIn < next).length,
    };
  });

  return { monthBookings: inMonth.length, monthNet, avgRating, occupancyPct, chart };
}
