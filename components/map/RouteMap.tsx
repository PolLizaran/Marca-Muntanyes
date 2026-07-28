"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-icons";
import { BaseTileLayer } from "./BaseTileLayer";

export interface MapRoute {
  id: string;
  name: string;
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
  color?: string;
}

export interface MapSummit {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevationM?: number | null;
}

function toLatLngLines(
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString
): [number, number][][] {
  const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  return lines.map((line) => line.map(([lng, lat]) => [lat, lng] as [number, number]));
}

function FitBounds({ routes, summits }: { routes: MapRoute[]; summits: MapSummit[] }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      ...routes.flatMap((r) => toLatLngLines(r.geometry).flat()),
      ...summits.map((s) => [s.lat, s.lng] as [number, number]),
    ];
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(points, { padding: [32, 32] });
  }, [map, routes, summits]);

  return null;
}

export default function RouteMap({
  routes = [],
  summits = [],
  height = "400px",
}: {
  routes?: MapRoute[];
  summits?: MapSummit[];
  height?: string;
}) {
  const center = useMemo<[number, number]>(() => [42.0, 2.0], []); // Pirineus / Catalunya by default

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg border border-black/10">
      <MapContainer center={center} zoom={8} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <BaseTileLayer />
        {routes.map((route) =>
          toLatLngLines(route.geometry).map((positions, i) => (
            <Polyline
              key={`${route.id}-${i}`}
              positions={positions}
              pathOptions={{ color: route.color ?? "#dc2626", weight: 4 }}
            >
              <Popup>{route.name}</Popup>
            </Polyline>
          ))
        )}
        {summits.map((summit) => (
          <Marker key={summit.id} position={[summit.lat, summit.lng]}>
            <Popup>
              <strong>{summit.name}</strong>
              {summit.elevationM ? <div>{summit.elevationM} m</div> : null}
            </Popup>
          </Marker>
        ))}
        <FitBounds routes={routes} summits={summits} />
      </MapContainer>
    </div>
  );
}
