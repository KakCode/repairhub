"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { confirmTwoFactorAction, type ConfirmTwoFactorState } from "@/actions/twoFactor";
import { useToast } from "@/components/ToastProvider";

export default function TwoFactorSetupForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ConfirmTwoFactorState, FormData>(
    confirmTwoFactorAction,
    {}
  );
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) showToast(state.error, "error");
    if (state.success) {
      showToast("Two-factor authentication enabled", "success");
      router.push("/admin");
      router.refresh();
    }
    // Only fire when a new result comes back from the server action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="field-label">Enter the 6-digit code from your authenticator app</label>
      <input
        name="code"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        required
        autoFocus
        placeholder="123456"
        className="field text-center text-lg tracking-[0.5em]"
      />
      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Verifying..." : "Confirm and enable 2FA"}
      </button>
    </form>
  );
}
