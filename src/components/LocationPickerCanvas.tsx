"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// SVG pin (not an emoji glyph) — see MapCanvas.tsx for why: Leaflet positions
// markers via a CSS `transform`, and Chromium can silently fail to paint
// color-emoji glyphs inside transformed elements.
const markerIcon = L.divIcon({
  html: `<svg width="28" height="36" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#ea580c"/>
    <circle cx="12" cy="12" r="4.5" fill="white"/>
  </svg>`,
  className: "",
  iconSize: [24, 32],
  iconAnchor: [12, 32],
});

function ClickToMove({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Recenters the map only when `focusSignal` changes (a fresh address lookup),
// never in response to the marker's own drag/click-to-move — calling
// map.setView() right after a drag/click races with Leaflet's own internal
// drag cleanup and throws "Cannot read properties of undefined (reading '_leaflet_pos')".
function Recenter({ position, focusSignal }: { position: [number, number]; focusSignal: number }) {
  const map = useMap();
  useEffect(() => {
    if (focusSignal === 0) return;
    map.setView(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal]);
  return null;
}

export default function LocationPickerCanvas({
  position,
  onChange,
  focusSignal = 0,
}: {
  position: [number, number];
  onChange: (lat: number, lng: number) => void;
  focusSignal?: number;
}) {
  return (
    <MapContainer center={position} zoom={15} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={position}
        icon={markerIcon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target as L.Marker;
            const { lat, lng } = marker.getLatLng();
            onChange(lat, lng);
          },
        }}
      />
      <ClickToMove onChange={onChange} />
      <Recenter position={position} focusSignal={focusSignal} />
    </MapContainer>
  );
}
