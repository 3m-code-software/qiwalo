"use client";

import { useEffect, useMemo, useState } from "react";
import { money, toArabicDigits } from "@/lib/format";

export interface CalendarDay {
  date: string;
  price: number;
  isBlocked: boolean;
}

type Props = {
  days: CalendarDay[];
  initialCheckIn: string;
  initialCheckOut: string;
};

const asUTC = (date: string) => new Date(`${date}T12:00:00Z`);
const weekday = (date: string) =>
  new Intl.DateTimeFormat("ar-EG", { weekday: "short", timeZone: "UTC" }).format(asUTC(date));
const dayNumber = (date: string) => toArabicDigits(asUTC(date).getUTCDate());
const nightsBetween = (from: string, to: string) =>
  Math.round((asUTC(to).getTime() - asUTC(from).getTime()) / 86_400_000);

/** تقويم مصغّر لسبعة أيام: الاختيار بيحدّث حقول الوصول/المغادرة في نموذج الحجز تلقائياً. */
export default function AvailabilityCalendar({ days, initialCheckIn, initialCheckOut }: Props) {
  const sorted = useMemo(() => [...days].sort((a, b) => a.date.localeCompare(b.date)), [days]);
  const startAt = Math.max(0, sorted.findIndex((day) => day.date === initialCheckIn));
  const [windowIndex, setWindowIndex] = useState(startAt);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [message, setMessage] = useState("");

  // النموذج server-rendered؛ نحدّث قيمه مباشرة عشان ما نحتاجش نحوّل كرت الحجز كله client.
  useEffect(() => {
    const values = [["checkIn", checkIn], ["checkOut", checkOut]] as const;
    for (const [id, value] of values) {
      const input = document.getElementById(id);
      if (input instanceof HTMLInputElement) {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }, [checkIn, checkOut]);

  function pick(date: string) {
    if (!checkIn || checkOut) {
      setCheckIn(date);
      setCheckOut("");
      setMessage(`تم تحديد الوصول ${dayNumber(date)} — اختر تاريخ المغادرة.`);
      return;
    }
    if (date === checkIn) {
      setCheckIn("");
      setCheckOut("");
      setMessage("تم إلغاء تحديد التواريخ.");
      return;
    }
    if (date < checkIn) {
      setCheckIn(date);
      setCheckOut("");
      setMessage(`تم تحديث الوصول ${dayNumber(date)} — اختر تاريخ المغادرة.`);
      return;
    }
    const blockedInside = sorted.some((day) => day.date > checkIn && day.date < date && day.isBlocked);
    if (blockedInside) {
      setCheckIn(date);
      setCheckOut("");
      setMessage("ما فيش حجز عبر أيام محجوزة — اليوم ده اتحط كوصول جديد.");
      return;
    }
    setCheckOut(date);
    setMessage(
      `الوصول ${dayNumber(checkIn)} · المغادرة ${dayNumber(date)} · ${toArabicDigits(nightsBetween(checkIn, date))} ليالي.`,
    );
  }

  const visible = sorted.slice(windowIndex, windowIndex + 7);

  return (
    <section data-testid="availability-calendar" aria-label="تقويم التوافر" className="soft-card !p-4 sm:!p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-extrabold text-navy">سبعة أيام من التوافر والأسعار</p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="الأسبوع السابق"
            disabled={windowIndex === 0}
            onClick={() => setWindowIndex((index) => Math.max(0, index - 7))}
            className="btn-ghost !px-3 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← السابق
          </button>
          <button
            type="button"
            aria-label="الأسبوع التالي"
            disabled={windowIndex + 7 >= sorted.length}
            onClick={() => setWindowIndex((index) => Math.min(sorted.length - 7, index + 7))}
            className="btn-ghost !px-3 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            التالي →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2" dir="rtl">
        {visible.map((day) => {
          const isStart = day.date === checkIn;
          const isEnd = day.date === checkOut;
          const inRange = Boolean(checkIn && checkOut && day.date > checkIn && day.date < checkOut);
          return (
            <button
              key={day.date}
              type="button"
              data-date={day.date}
              disabled={day.isBlocked}
              aria-pressed={isStart || isEnd}
              aria-label={`${weekday(day.date)} ${dayNumber(day.date)}، ${money(day.price)}${day.isBlocked ? "، محجوز" : ""}`}
              title={day.isBlocked ? "محجوز" : money(day.price)}
              onClick={() => pick(day.date)}
              className={[
                "flex min-h-[68px] min-w-0 flex-col items-center justify-center rounded-xl border px-0.5 py-2 text-center transition",
                day.isBlocked
                  ? "cursor-not-allowed border-line bg-navy-soft/60 text-muted line-through"
                  : "border-line bg-white text-navy hover:border-gold hover:bg-gold-soft/50",
                isStart || isEnd ? "!border-gold !bg-gold !text-navy-deep shadow-md" : "",
                inRange ? "!border-gold/50 !bg-gold-soft" : "",
              ].join(" ")}
            >
              <span className="text-[10px] font-bold text-muted">{weekday(day.date)}</span>
              <span className="text-sm font-black">{dayNumber(day.date)}</span>
              <span className="mt-0.5 text-[9px] font-extrabold">{money(day.price, false)}</span>
              <span className="text-[8px] font-bold text-muted">ج.م</span>
            </button>
          );
        })}
      </div>

      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-xs font-bold leading-6 text-muted">
        {message || "اختر يوم الوصول ثم يوم المغادرة — التواريخ بتنقل تلقائي لنموذج الحجز."}
      </p>
      <p className="mt-1 text-[11px] leading-5 text-muted">
        الأيام المحجوزة مش متاحة للاختيار، والأسعار بتشمل القواعد الموسمية.
      </p>
    </section>
  );
}
