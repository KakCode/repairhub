"use client";

import { useTransition } from "react";
import { approveShopAction, rejectShopAction } from "@/actions/admin";
import { useToast } from "@/components/ToastProvider";

export default function AdminShopApprovalActions({ shopId }: { shopId: string }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  return (
    <div className="flex shrink-0 gap-2">
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await approveShopAction(shopId);
            showToast("Shop approved", "success");
          })
        }
        className="btn-primary px-3 py-1.5 text-sm"
      >
        Approve
      </button>
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await rejectShopAction(shopId);
            showToast("Shop rejected", "success");
          })
        }
        className="btn-secondary px-3 py-1.5 text-sm"
      >
        Reject
      </button>
    </div>
  );
}
