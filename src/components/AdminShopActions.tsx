"use client";

import { useTransition } from "react";
import { verifyShopAction, deleteShopAction } from "@/actions/admin";
import { useToast } from "@/components/ToastProvider";

export default function AdminShopActions({
  shopId,
  isVerified,
}: {
  shopId: string;
  isVerified: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function toggleVerified() {
    startTransition(async () => {
      await verifyShopAction(shopId, !isVerified);
      showToast(isVerified ? "Shop unverified" : "Shop verified", "success");
    });
  }

  function handleDelete() {
    if (!confirm("Delete this shop and all of its bookings, reviews, and photos? This can't be undone.")) {
      return;
    }
    startTransition(async () => {
      await deleteShopAction(shopId);
      showToast("Shop deleted", "success");
    });
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button disabled={isPending} onClick={toggleVerified} className="btn-secondary px-3 py-1.5 text-sm">
        {isVerified ? "Unverify" : "Verify"}
      </button>
      <button disabled={isPending} onClick={handleDelete} className="btn-ghost px-3 py-1.5 text-sm text-red-600">
        Delete
      </button>
    </div>
  );
}
