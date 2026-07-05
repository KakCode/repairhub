"use client";

import { useActionState, useEffect, useState } from "react";
import type { OpeningHours } from "@/lib/validations";
import OpeningHoursEditor, { DEFAULT_OPENING_HOURS } from "@/components/OpeningHoursEditor";
import LocationPicker from "@/components/LocationPicker";
import { useToast } from "@/components/ToastProvider";
import type { ShopFormState } from "@/actions/shop";

interface ServiceRow {
  name: string;
  priceFrom?: number;
}

export interface ShopFormDefaults {
  name: string;
  description?: string | null;
  categories: string[];
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  yearsExperience?: number | null;
  certifications?: string | null;
  openingHours?: OpeningHours;
  services?: ServiceRow[];
}

export default function ShopForm({
  action,
  submitLabel,
  defaultValues,
  availableCategories,
}: {
  action: (prevState: ShopFormState, formData: FormData) => Promise<ShopFormState>;
  submitLabel: string;
  defaultValues?: ShopFormDefaults;
  availableCategories: string[];
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const { showToast } = useToast();
  const [categories, setCategories] = useState<string[]>(defaultValues?.categories ?? []);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    defaultValues?.openingHours ?? DEFAULT_OPENING_HOURS
  );
  const [services, setServices] = useState<ServiceRow[]>(defaultValues?.services ?? []);
  const [address, setAddress] = useState(defaultValues?.address ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    defaultValues?.latitude != null && defaultValues?.longitude != null
      ? { lat: defaultValues.latitude, lng: defaultValues.longitude }
      : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [focusSignal, setFocusSignal] = useState(0);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    if (state.success) showToast("Changes saved successfully", "success");
    if (state.error) showToast(state.error, "error");
    // Only fire when a new result comes back from the server action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleLocate() {
    setIsLocating(true);
    setLocateError(null);
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setLocateError(data.error ?? "Could not find that address");
        return;
      }
      setCoords({ lat: data.latitude, lng: data.longitude });
      setFocusSignal((v) => v + 1);
    } catch {
      setLocateError("Something went wrong looking up that address");
    } finally {
      setIsLocating(false);
    }
  }

  function updateService(index: number, field: keyof ServiceRow, val: string) {
    setServices((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, [field]: field === "priceFrom" ? (val ? Number(val) : undefined) : val }
          : s
      )
    );
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="card flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Shop name</label>
          <input name="name" required defaultValue={defaultValues?.name} className="field" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Description</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={defaultValues?.description ?? ""}
            className="field"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="field-label">Categories</label>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={categories.includes(cat) ? "chip-active" : "chip"}
              >
                {cat}
              </button>
            ))}
          </div>
          {categories.map((c) => (
            <input key={c} type="hidden" name="categories" value={c} />
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Address</label>
          <div className="flex gap-2">
            <input
              name="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full street address, city, country"
              className="field"
            />
            <button
              type="button"
              onClick={handleLocate}
              disabled={isLocating || address.trim().length < 5}
              className="btn-secondary shrink-0"
            >
              {isLocating ? "Locating..." : "📍 Locate"}
            </button>
          </div>
          {locateError && <p className="text-xs text-red-600">{locateError}</p>}
          {coords ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  {showMap ? "Drag the pin or click the map to fine-tune the exact spot." : "Map hidden."}
                </p>
                <button
                  type="button"
                  onClick={() => setShowMap((v) => !v)}
                  className="btn-ghost px-2 py-1 text-xs"
                >
                  {showMap ? "Hide map" : "Show map"}
                </button>
              </div>
              {showMap && (
                <div className="h-64 overflow-hidden rounded-xl border border-[var(--border)]">
                  <LocationPicker
                    position={[coords.lat, coords.lng]}
                    onChange={(lat, lng) => setCoords({ lat, lng })}
                    focusSignal={focusSignal}
                  />
                </div>
              )}
              <input type="hidden" name="latitude" value={coords.lat} />
              <input type="hidden" name="longitude" value={coords.lng} />
            </>
          ) : (
            <p className="text-xs text-zinc-500">
              Click &quot;Locate&quot; to pin your shop on the map.
            </p>
          )}
        </div>
      </div>

      <div className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Phone</label>
          <input name="phone" defaultValue={defaultValues?.phone ?? ""} className="field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">WhatsApp</label>
          <input name="whatsapp" defaultValue={defaultValues?.whatsapp ?? ""} className="field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Website</label>
          <input name="website" defaultValue={defaultValues?.website ?? ""} className="field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Years of experience</label>
          <input
            name="yearsExperience"
            type="number"
            min={0}
            defaultValue={defaultValues?.yearsExperience ?? ""}
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Certifications</label>
          <input
            name="certifications"
            defaultValue={defaultValues?.certifications ?? ""}
            className="field"
          />
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-6">
        <label className="field-label">Opening hours</label>
        <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />
        <input type="hidden" name="openingHours" value={JSON.stringify(openingHours)} />
      </div>

      <div className="card flex flex-col gap-3 p-6">
        <label className="field-label">Services</label>
        {services.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input
              placeholder="Service name"
              value={s.name}
              onChange={(e) => updateService(i, "name", e.target.value)}
              className="field flex-1"
            />
            <input
              placeholder="Price from"
              type="number"
              min={0}
              value={s.priceFrom ?? ""}
              onChange={(e) => updateService(i, "priceFrom", e.target.value)}
              className="field w-32"
            />
            <button
              type="button"
              onClick={() => setServices((prev) => prev.filter((_, idx) => idx !== i))}
              className="btn-ghost px-3"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setServices((prev) => [...prev, { name: "" }])}
          className="btn-secondary self-start"
        >
          + Add service
        </button>
        <input
          type="hidden"
          name="services"
          value={JSON.stringify(services.filter((s) => s.name.trim()))}
        />
      </div>

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
