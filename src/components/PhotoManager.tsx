"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";
import { addShopPhotoAction, removeShopPhotoAction } from "@/actions/shop";
import { UPLOAD_HINT, validateImageFile } from "@/lib/uploadConstraints";
import { useToast } from "@/components/ToastProvider";

interface Photo {
  id: string;
  url: string;
}

export default function PhotoManager({ shopId, photos }: { shopId: string; photos: Photo[] }) {
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

    startTransition(() => addShopPhotoAction(shopId, data.url));
    showToast("Photo uploaded", "success");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-[var(--border)] shadow-sm">
            <Image src={photo.url} alt="Shop photo" fill className="object-cover" />
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => removeShopPhotoAction(photo.id))}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <label className="btn-secondary w-fit cursor-pointer">
        + Upload photo
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      <p className="text-xs text-zinc-500">{UPLOAD_HINT}</p>
    </div>
  );
}
