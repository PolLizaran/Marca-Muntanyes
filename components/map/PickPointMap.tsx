"use client";

import { MapContainer, Marker, useMapEvents } from "react-leaflet";
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

export default function PickPointMap({
  point,
  onPick,
  height = "360px",
}: {
  point: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
  height?: string;
}) {
  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg border border-black/10">
      <MapContainer
        center={point ?? [42.6, 1.3]}
        zoom={point ? 13 : 8}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <BaseTileLayer />
        <ClickCatcher onClick={onPick} />
        {point && <Marker position={point} />}
      </MapContainer>
    </div>
  );
}
