"use client";

import { useActionState } from "react";
import { completeBookingAction } from "@/actions/booking";

export default function CompleteBookingForm({ bookingId }: { bookingId: string }) {
  const boundAction = completeBookingAction.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(boundAction, {});

  if (state.success) {
    return (
      <div className="card border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
        ✅ Marked as completed
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-2 sm:w-72">
      <textarea
        name="summary"
        rows={2}
        required
        placeholder="What did you fix? (shown to the customer)"
        className="field text-sm"
      />
      <input
        name="amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="Amount charged (optional)"
        className="field text-sm"
      />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="btn-primary self-start px-3 py-1.5 text-sm">
        {isPending ? "Saving..." : "Save & mark completed"}
      </button>
    </form>
  );
}
