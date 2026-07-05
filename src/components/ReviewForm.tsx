"use client";

import { useActionState, useEffect, useState } from "react";
import StarRating from "@/components/StarRating";
import { useToast } from "@/components/ToastProvider";
import type { ReviewFormState } from "@/actions/review";

const RATING_FIELDS = [
  { key: "qualityRating", label: "Quality" },
  { key: "priceRating", label: "Price" },
  { key: "speedRating", label: "Speed" },
  { key: "friendlinessRating", label: "Friendliness" },
  { key: "overallRating", label: "Overall" },
] as const;

export default function ReviewForm({
  action,
  bookingId,
}: {
  action: (prevState: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
  bookingId?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const { showToast } = useToast();
  const [ratings, setRatings] = useState<Record<string, number>>({
    qualityRating: 5,
    priceRating: 5,
    speedRating: 5,
    friendlinessRating: 5,
    overallRating: 5,
  });

  useEffect(() => {
    if (state.error) showToast(state.error, "error");
    // Only fire when a new result comes back from the server action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state.success) {
    return (
      <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
        ✅ Thanks for your review!
      </div>
    );
  }

  return (
    <form action={formAction} className="card flex flex-col gap-3 p-5">
      <p className="field-label">Leave a review</p>
      {bookingId && <input type="hidden" name="bookingId" value={bookingId} />}
      {RATING_FIELDS.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
          <StarRating
            value={ratings[key]}
            onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
          />
          <input type="hidden" name={key} value={ratings[key]} />
        </div>
      ))}
      <textarea
        name="comment"
        rows={3}
        placeholder="Tell others about your experience (optional)"
        className="field"
      />
      <button type="submit" disabled={isPending} className="btn-primary self-start px-4 py-1.5 text-sm">
        {isPending ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
