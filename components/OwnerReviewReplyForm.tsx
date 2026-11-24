"use client";

import { useActionState } from "react";
import { replyToReviewAction, type FormState } from "@/app/actions";

export default function OwnerReviewReplyForm({
  reviewId,
  reply,
}: {
  reviewId: string;
  reply: string | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(replyToReviewAction, {});

  return (
    <form action={formAction} className="mt-3 space-y-2 border-t border-line pt-3">
      <input type="hidden" name="reviewId" value={reviewId} />
      <label className="label" htmlFor={`owner-reply-${reviewId}`}>
        {reply ? "تعديل ردك" : "ردك على التقييم"}
      </label>
      <textarea
        id={`owner-reply-${reviewId}`}
        name="reply"
        rows={2}
        minLength={5}
        maxLength={600}
        defaultValue={reply ?? ""}
        className="input"
        placeholder="اشكر الضيف أو اشرح أي ملاحظة باختصار..."
      />
      {state.error && <p role="alert" className="text-sm font-bold text-red-600">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm font-bold text-nile">{state.ok}</p>}
      <button type="submit" disabled={pending} className="btn-ghost !py-2 text-xs disabled:opacity-60">
        {pending ? "جارٍ الحفظ..." : reply ? "حفظ التعديل" : "نشر الرد"}
      </button>
    </form>
  );
}
