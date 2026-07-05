"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";

export interface MapShop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

// Plain SVG pin instead of an emoji glyph: Leaflet always positions markers
// via a CSS `transform`, and Chromium has a rendering bug where color-emoji
// (COLR/CBDT) glyphs silently fail to paint inside transformed elements —
// confirmed the emoji div was present with normal computed styles but never
// actually rendered a pixel. An SVG shape has no such issue.
const markerIcon = L.divIcon({
  html: `<svg width="28" height="28" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#ea580c"/>
    <circle cx="12" cy="12" r="4.5" fill="white"/>
  </svg>`,
  className: "",
  iconSize: [24, 32],
  iconAnchor: [12, 32],
});

export default function MapCanvas({
  shops,
  center,
  zoom = 12,
}: {
  shops: MapShop[];
  center: [number, number];
  zoom?: number;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {shops.map((shop) => (
        <Marker key={shop.id} position={[shop.latitude, shop.longitude]} icon={markerIcon}>
          <Popup>
            <Link href={`/shops/${shop.id}`} className="font-medium underline">
              {shop.name}
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
