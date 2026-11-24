"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

type MapUnit = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  label: string;
  href: string;
};

/** One lazy-loaded mini map for the whole result set, instead of one map per card. */
export default function ResultsMap({ unitsJson }: { unitsJson: string }) {
  const router = useRouter();
  const units = useMemo(() => JSON.parse(unitsJson) as MapUnit[], [unitsJson]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!open) {
      mapRef.current?.remove();
      mapRef.current = null;
      return;
    }
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || mapRef.current || !containerRef.current) return;

      const valid = units.filter((u) => Number.isFinite(u.lat) && Number.isFinite(u.lng));
      if (valid.length === 0) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      for (const unit of valid) {
        const marker = L.circleMarker([unit.lat, unit.lng], {
          radius: 9,
          color: "#0a2440",
          weight: 3,
          fillColor: "#e3c484",
          fillOpacity: 1,
        }).addTo(map);
        marker.bindTooltip(`${unit.name}${unit.label ? ` · ${unit.label}` : ""}`, {
          direction: "top",
          offset: [0, -10],
        });
        marker.on("click", () => router.push(unit.href));
      }

      if (valid.length === 1) {
        map.setView([valid[0].lat, valid[0].lng], 14);
      } else {
        map.fitBounds(L.latLngBounds(valid.map((u) => [u.lat, u.lng] as [number, number])), {
          padding: [28, 28],
          maxZoom: 14,
        });
      }
      requestAnimationFrame(() => {
        if (!cancelled && mapRef.current === map) map.invalidateSize();
      });
    })();

    return () => { cancelled = true; };
  }, [open, units, router]);

  useEffect(() => () => {
    mapRef.current?.remove();
    mapRef.current = null;
  }, []);

  if (units.length === 0) return null;

  return (
    <section className="soft-card mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-extrabold text-navy">خريطة النتائج</h2>
          <p className="muted mt-1 text-xs">دبّوس لكل وحدة · اضغط عليه لفتح التفاصيل.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="btn-ghost !py-2 text-sm"
        >
          {open ? "إخفاء الخريطة" : "عرض الخريطة"}
        </button>
      </div>
      {open && (
        <>
          <div
            ref={containerRef}
            dir="ltr"
            aria-label="خريطة نتائج البحث"
            className="mt-3 h-[260px] w-full overflow-hidden rounded-xl border border-line bg-navy-soft sm:h-[320px]"
          />
          <div className="mt-3 flex flex-wrap gap-2" aria-label="وحدات الخريطة">
            {units.map((unit) => (
              <Link key={unit.id} href={unit.href} className="chip transition hover:border-gold">
                {unit.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
