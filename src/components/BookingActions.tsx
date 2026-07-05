"use client";

import { useState, useTransition } from "react";
import { respondToBookingAction } from "@/actions/booking";
import CompleteBookingForm from "@/components/CompleteBookingForm";

export default function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED" | "CANCELLED";
}) {
  const [isPending, startTransition] = useTransition();
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  function respond(next: "ACCEPTED" | "DECLINED") {
    startTransition(() => respondToBookingAction(bookingId, next));
  }

  if (status === "PENDING") {
    return (
      <div className="flex shrink-0 gap-2">
        <button disabled={isPending} onClick={() => respond("ACCEPTED")} className="btn-primary px-4 py-1.5">
          Accept
        </button>
        <button disabled={isPending} onClick={() => respond("DECLINED")} className="btn-secondary px-4 py-1.5">
          Decline
        </button>
      </div>
    );
  }

  if (status === "ACCEPTED") {
    if (showCompleteForm) {
      return <CompleteBookingForm bookingId={bookingId} />;
    }
    return (
      <button onClick={() => setShowCompleteForm(true)} className="btn-secondary shrink-0 px-4 py-1.5">
        Mark completed
      </button>
    );
  }

  return null;
}
