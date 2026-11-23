"use client";

import { useActionState, useState } from "react";
import { submitReviewAction, type FormState } from "@/app/actions";

export default function ReviewForm({ reference, propertyName }: { reference: string; propertyName: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(submitReviewAction, {});
  const [rating, setRating] = useState(5);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="reference" value={reference} />
      <p className="text-sm font-bold text-muted">قيّم إقامتك في {propertyName}</p>

      <fieldset>
        <legend className="label">التقييم</legend>
        <div className="flex items-center gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" aria-label={`${n} من 5 نجوم`}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
              />
              <span className={`text-3xl transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold ${n <= rating ? "text-gold" : "text-line"}`}>
                ★
              </span>
            </label>
          ))}
          <span className="mr-3 text-sm font-black text-navy">{rating}/5</span>
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="review-comment">تعليقك</label>
        <textarea
          id="review-comment"
          name="comment"
          rows={4}
          required
          minLength={5}
          className="input"
          placeholder="شاركنا تفاصيل إقامتك..."
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-gold w-full disabled:opacity-60">
        {pending ? "جارٍ إرسال التقييم..." : "إرسال التقييم"}
      </button>
      <p className="muted text-center text-xs leading-6">سيظهر التقييم على الوحدة بعد مراجعته.</p>
    </form>
  );
}
