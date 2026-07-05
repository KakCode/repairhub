"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";
import { updateShopLogoAction } from "@/actions/shop";
import { UPLOAD_HINT, validateImageFile } from "@/lib/uploadConstraints";
import { useToast } from "@/components/ToastProvider";

export default function LogoManager({ shopId, logoUrl }: { shopId: string; logoUrl: string | null }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      showToast(validationError, "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error ?? "Upload failed", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    startTransition(() => updateShopLogoAction(shopId, data.url));
    showToast("Profile photo updated", "success");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm dark:from-zinc-800 dark:to-zinc-900">
        {logoUrl ? (
          <Image src={logoUrl} alt="Shop profile photo" fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">🔧</div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <label className="btn-secondary cursor-pointer">
            {logoUrl ? "Replace" : "+ Upload"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {logoUrl && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => updateShopLogoAction(shopId, null))}
              className="btn-ghost"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">{UPLOAD_HINT}</p>
      </div>
    </div>
  );
}
