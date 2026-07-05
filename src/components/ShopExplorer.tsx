"use client";

import { useEffect, useMemo, useState } from "react";
import MapView from "@/components/MapView";
import ShopCard, { type ShopCardData } from "@/components/ShopCard";
import { distanceKm } from "@/lib/distance";

export interface ExplorerShop extends ShopCardData {
  latitude: number;
  longitude: number;
}

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006];

export default function ShopExplorer({
  shops,
  categories,
  isLoggedIn = false,
}: {
  shops: ExplorerShop[];
  categories: string[];
  isLoggedIn?: boolean;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(!isLoggedIn);

  function handleNearMe() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationError(null);
      },
      () => setLocationError("Could not get your location")
    );
  }

  useEffect(() => {
    // Center the map on the signed-in user's current location automatically,
    // instead of making them click "Near me" themselves.
    if (!isLoggedIn || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationError(null);
      },
      () => setLocationError("Could not get your location")
    );
  }, [isLoggedIn]);

  const filtered = useMemo(() => {
    let result = shops.filter((shop) => {
      if (category && !shop.categories.includes(category)) return false;
      if (openNowOnly && !shop.isOpenNow) return false;
      return true;
    });

    if (userLocation) {
      result = result.map((shop) => ({
        ...shop,
        distanceKm: distanceKm(userLocation[0], userLocation[1], shop.latitude, shop.longitude),
      }));
    }

    if (sortByRating) {
      result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (userLocation) {
      result = [...result].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return result;
  }, [shops, category, openNowOnly, sortByRating, userLocation]);

  const mapCenter = userLocation ?? (shops[0] ? [shops[0].latitude, shops[0].longitude] : DEFAULT_CENTER);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setCategory(null)} className={category === null ? "chip-active" : "chip"}>
          All
        </button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} className={category === cat ? "chip-active" : "chip"}>
            {cat}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-[var(--border)]" />
        <button onClick={handleNearMe} className={userLocation ? "chip-active" : "chip"}>
          📍 Near me
        </button>
        <button onClick={() => setOpenNowOnly((v) => !v)} className={openNowOnly ? "chip-active" : "chip"}>
          Open now
        </button>
        <button onClick={() => setSortByRating((v) => !v)} className={sortByRating ? "chip-active" : "chip"}>
          ⭐ Highest rated
        </button>
        <span className="mx-1 h-5 w-px bg-[var(--border)]" />
        <button onClick={() => setShowMap((v) => !v)} className="chip">
          {showMap ? "🗺️ Hide map" : "🗺️ Show map"}
        </button>
      </div>
      {locationError && <p className="text-sm text-red-600">{locationError}</p>}

      <div className={showMap ? "grid grid-cols-1 gap-6 lg:grid-cols-2" : "grid grid-cols-1 gap-6"}>
        {showMap && (
          <div className="h-[560px] overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm">
            <MapView shops={filtered} center={mapCenter} />
          </div>
        )}
        <div className={showMap ? "flex flex-col gap-3" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
          {filtered.length === 0 ? (
            <div className="card flex flex-1 items-center justify-center p-10 text-sm text-zinc-500">
              No shops match your filters yet.
            </div>
          ) : (
            filtered.map((shop) => <ShopCard key={shop.id} shop={shop} />)
          )}
        </div>
      </div>
    </div>
  );
}
