"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UPLOAD_HINT, validateImageFile } from "@/lib/uploadConstraints";
import { useToast } from "@/components/ToastProvider";
import type { BookingFormState } from "@/actions/booking";

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookingForm({
  action,
  categories,
}: {
  action: (prevState: BookingFormState, formData: FormData) => Promise<BookingFormState>;
  categories: string[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, {});
  const { showToast } = useToast();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.error) showToast(state.error, "error");
    // Only fire when a new result comes back from the server action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state.success) {
    return (
      <div className="card border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
        <p className="text-base font-medium">✅ Your booking request was sent!</p>
        <p className="mt-1 text-emerald-700 dark:text-emerald-400">The shop will respond soon.</p>
        <button onClick={() => router.push("/")} className="btn-secondary mt-4">
          Back to search
        </button>
      </div>
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      showToast(validationError, "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      showToast(data.error ?? "Upload failed", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPhotoUrls((prev) => [...prev, data.url]);
    showToast("Photo attached", "success");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Vehicle / equipment type</label>
        <select name="vehicleType" required className="field">
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="field-label">Describe the problem</label>
        <textarea name="problemDescription" required rows={4} className="field" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Preferred date</label>
          <input name="preferredDate" type="date" required min={todayDateString()} className="field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Preferred time</label>
          <input name="preferredTime" type="time" required className="field" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="field-label">Photos (optional)</label>
        <p className="text-xs text-zinc-500">
          Add a photo of the problem so the shop knows what to expect.
        </p>
        {photoUrls.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {photoUrls.map((url, i) => (
              <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--border)] shadow-sm">
                <Image src={url} alt={`Attached photo ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="btn-secondary w-fit cursor-pointer">
          {uploading ? "Uploading..." : "+ Attach photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <p className="text-xs text-zinc-500">{UPLOAD_HINT}</p>
        <input type="hidden" name="photoUrls" value={JSON.stringify(photoUrls)} />
      </div>

      <button type="submit" disabled={isPending || uploading} className="btn-primary self-start">
        {isPending ? "Sending..." : "Send booking request"}
      </button>
    </form>
  );
}
