"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

type MapViewProps = {
  lat: number;
  lng: number;
  pickupLat?: number | null;
  pickupLng?: number | null;
  label: string;
  pickupLabel?: string;
};

export default function MapView({
  lat,
  lng,
  pickupLat,
  pickupLng,
  label,
  pickupLabel,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const pickupCoords =
    typeof pickupLat === "number" &&
    Number.isFinite(pickupLat) &&
    typeof pickupLng === "number" &&
    Number.isFinite(pickupLng)
      ? { lat: pickupLat, lng: pickupLng }
      : null;
  const hasPickup = pickupCoords !== null;
  const origin = pickupCoords ?? { lat, lng };
  const originLat = origin.lat;
  const originLng = origin.lng;

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    (async () => {
      const L = await import("leaflet");
      if (cancelled) return;

      const map = L.map(el, {
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView([lat, lng], 15);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const tooltip = (text: string) => {
        const node = document.createElement("div");
        node.textContent = text || "—";
        node.className = "rounded-lg bg-navy-deep px-2 py-1 text-xs font-bold text-white shadow-lg";
        return node;
      };

      L.circleMarker([lat, lng], {
        radius: 9,
        color: "#e3c484",
        weight: 3,
        fillColor: "#0a2440",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip(tooltip(label || "الوحدة"), { direction: "top", offset: [0, -10] });

      L.circleMarker([originLat, originLng], {
        radius: hasPickup ? 6 : 14,
        color: "#c6a15b",
        weight: 2,
        fillColor: hasPickup ? "#f6efdf" : "#e3c484",
        fillOpacity: hasPickup ? 0.95 : 0.2,
      })
        .addTo(map)
        .bindTooltip(tooltip(pickupLabel || "نقطة الاستلام"), {
          direction: "top",
          offset: [0, -10],
        });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, originLat, originLng, label, pickupLabel, hasPickup]);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${lat},${lng}&travelmode=driving`;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div
        ref={containerRef}
        dir="ltr"
        aria-label="خريطة الوحدة ونقطة الاستلام"
        className="h-[260px] w-full bg-navy-soft"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-gold-bright bg-navy" />
            الوحدة
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-gold bg-gold-soft" />
            نقطة الاستلام
          </span>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-extrabold text-navy transition hover:text-gold"
        >
          اتجاهات بالعربية ↗
        </a>
      </div>
    </div>
  );
}
