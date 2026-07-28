"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Polyline, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-icons";
import { BaseTileLayer } from "./BaseTileLayer";

function ClickCatcher({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function DrawRouteMap({
  points,
  onAddPoint,
  height = "420px",
}: {
  points: [number, number][];
  onAddPoint: (lat: number, lng: number) => void;
  height?: string;
}) {
  const center = useMemo<[number, number]>(
    () => (points[0] ?? [42.0, 2.0]) as [number, number],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg border border-black/10">
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <BaseTileLayer />
        <ClickCatcher onClick={onAddPoint} />
        {points.length > 1 && <Polyline positions={points} pathOptions={{ color: "#dc2626", weight: 4 }} />}
        {points.map((p, i) => (
          <Marker key={i} position={p} />
        ))}
      </MapContainer>
    </div>
  );
}
