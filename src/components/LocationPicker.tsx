"use client";

import dynamic from "next/dynamic";

const LocationPickerCanvas = dynamic(() => import("@/components/LocationPickerCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900">
      Loading map...
    </div>
  ),
});

export default function LocationPicker({
  position,
  onChange,
  focusSignal,
}: {
  position: [number, number];
  onChange: (lat: number, lng: number) => void;
  focusSignal?: number;
}) {
  return <LocationPickerCanvas position={position} onChange={onChange} focusSignal={focusSignal} />;
}
