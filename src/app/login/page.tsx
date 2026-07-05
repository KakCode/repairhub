"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", { email, password, redirect: false });
    setIsSubmitting(false);

    if (result?.code === "two_factor_required") {
      setStep("code");
      return;
    }
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email,
      password,
      code: formData.get("code"),
      redirect: false,
    });
    setIsSubmitting(false);

    if (result?.error) {
      setError("Invalid code. Check your authenticator app and try again.");
      return;
    }

    router.push("/");
    router.refresh();
  }

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
        {step === "credentials" ? (
          <div key="credentials-step">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mb-6 text-sm text-zinc-500">Log in to book a repair or manage your shop.</p>
            <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="btn-primary mt-1 w-full">
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-zinc-500">
              No account?{" "}
              <Link href="/signup" className="font-medium text-orange-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        ) : (
          <div key="code-step">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight">Two-factor code</h1>
            <p className="mb-6 text-sm text-zinc-500">
              Enter the 6-digit code from your authenticator app.
            </p>
            <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="btn-primary mt-1 w-full">
                {isSubmitting ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError(null);
                }}
                className="btn-ghost self-center text-sm"
              >
                Back
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
