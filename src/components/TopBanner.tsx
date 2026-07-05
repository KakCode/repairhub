"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopBanner() {
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  if (dismissed || pathname === "/login") return null;

  return (
    <div className="relative flex items-center justify-center gap-3 bg-zinc-900 px-4 py-2 text-center text-sm text-white dark:bg-orange-600">
      <p>
        🎉 Free forever for repair shops —{" "}
        <Link href="/signup" className="font-medium underline underline-offset-2 hover:text-orange-300 dark:hover:text-white">
          register your shop today
        </Link>
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
