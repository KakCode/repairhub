"use client";

import { useTransition } from "react";
import { approveReviewAction, rejectReviewAction } from "@/actions/admin";
import { useToast } from "@/components/ToastProvider";

export default function AdminReviewActions({
  reviewId,
  status,
}: {
  reviewId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  if (status === "REJECTED") {
    return (
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await approveReviewAction(reviewId);
            showToast("Review restored", "success");
          })
        }
        className="btn-secondary shrink-0 px-3 py-1.5 text-sm"
      >
        Restore
      </button>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await rejectReviewAction(reviewId);
          showToast("Review rejected", "success");
        })
      }
      className="btn-ghost shrink-0 px-3 py-1.5 text-sm text-red-600"
    >
      Reject
    </button>
  );
}
