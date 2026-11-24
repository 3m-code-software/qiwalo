"use client";

import { useState } from "react";
import { dateAr, toArabicDigits } from "@/lib/format";
import type { Review } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 text-lg" aria-label={`${rating} من 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-gold" : "text-line"}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsTab({ reviews }: { reviews: Review[] }) {
  const [index, setIndex] = useState(0);

  if (reviews.length === 0) {
    return (
      <section id="reviews" className="soft-card mt-10 text-center" aria-label="آراء الضيوف">
        <h2 className="mb-3 flex items-center justify-center gap-3 text-xl font-extrabold text-navy">
          <span className="h-5 w-1 rounded-full bg-gold" />
          آراء الضيوف
        </h2>
        <p className="text-sm leading-7 text-muted">لا توجد تقييمات منشورة لهذه الوحدة بعد. كن أول من يشارك تجربته بعد إقامته.</p>
      </section>
    );
  }

  const current = Math.min(index, reviews.length - 1);
  const review = reviews[current];
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const move = (step: number) => setIndex((i) => (i + step + reviews.length) % reviews.length);

  return (
    <section id="reviews" className="mt-10" aria-label="آراء الضيوف">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-xl font-extrabold text-navy">
          <span className="h-5 w-1 rounded-full bg-gold" />
          آراء الضيوف
        </h2>
        <span className="chip chip-gold">★ {toArabicDigits(average.toFixed(1))} · {toArabicDigits(reviews.length)} تقييم</span>
      </div>

      <div className="soft-card !rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-sand text-lg font-black text-navy">
              {review.guestName.trim().charAt(0) || "ض"}
            </span>
            <div>
              <p className="font-extrabold text-navy">{review.guestName}</p>
              <p className="text-xs text-muted">{dateAr(review.createdAt.slice(0, 10))}</p>
            </div>
          </div>
          <Stars rating={review.rating} />
        </div>

        <p className="min-h-24 py-5 text-sm leading-8 text-foreground/85">{review.comment}</p>

        {review.ownerReply && (
          <div className="mb-5 rounded-xl border border-gold/40 bg-gold-soft p-4 text-sm leading-7 text-navy">
            <p className="mb-1 text-xs font-black">رد المالك</p>
            <p>{review.ownerReply}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {reviews.map((r, i) => (
              <button
                key={r.id}
                type="button"
                tabIndex={-1}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-gold" : "w-1.5 bg-line"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={reviews.length < 2}
              aria-label="التقييم السابق"
              className="btn-ghost !px-3 !py-2 text-sm disabled:opacity-40"
            >
              ← السابق
            </button>
            <span className="text-xs font-bold text-muted">{toArabicDigits(current + 1)} / {toArabicDigits(reviews.length)}</span>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={reviews.length < 2}
              aria-label="التقييم التالي"
              className="btn-ghost !px-3 !py-2 text-sm disabled:opacity-40"
            >
              التالي →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
