"use client";

import dynamic from "next/dynamic";
import type { MapShop } from "@/components/MapCanvas";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900">
      Loading map...
    </div>
  ),
});

export default function MapView({
  shops,
  center,
  zoom,
}: {
  shops: MapShop[];
  center: [number, number];
  zoom?: number;
}) {
  return <MapCanvas shops={shops} center={center} zoom={zoom} />;
}
