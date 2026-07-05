"use client";

import { useActionState, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpAction, type SignUpState } from "@/actions/auth";

const initialState: SignUpState = {};

export default function SignUpPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
  const [role, setRole] = useState<"CUSTOMER" | "SHOP_OWNER">("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!state.success) return;

    void signIn("credentials", { email, password, redirect: false }).then(() => {
      router.push(role === "SHOP_OWNER" ? "/register-shop" : "/");
      router.refresh();
    });
    // Only re-run when a new successful submission comes in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, var(--accent-soft), transparent)",
        }}
      />
      <div className="card w-full max-w-sm p-8">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-lg shadow-sm shadow-orange-600/30">
          🔧
        </span>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mb-6 text-sm text-zinc-500">Free forever, for customers and shop owners.</p>
        <form action={formAction} className="flex flex-col gap-4">
          <input name="name" required placeholder="Full name" className="field" />
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="field"
          />
          <input name="phone" placeholder="Phone (optional)" className="field" />
          <input
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="field"
          />

          <div className="flex gap-2">
            <label
              className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition-colors ${
                role === "CUSTOMER"
                  ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                  : "border-[var(--border)] text-zinc-500 hover:border-orange-300"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="CUSTOMER"
                checked={role === "CUSTOMER"}
                onChange={() => setRole("CUSTOMER")}
                className="sr-only"
              />
              I need repairs
            </label>
            <label
              className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition-colors ${
                role === "SHOP_OWNER"
                  ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                  : "border-[var(--border)] text-zinc-500 hover:border-orange-300"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="SHOP_OWNER"
                checked={role === "SHOP_OWNER"}
                onChange={() => setRole("SHOP_OWNER")}
                className="sr-only"
              />
              I own a repair shop
            </label>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button type="submit" disabled={isPending} className="btn-primary mt-1 w-full">
            {isPending ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-orange-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
