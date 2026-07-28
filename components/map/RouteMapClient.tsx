"use client";

import dynamic from "next/dynamic";

export type { MapRoute, MapSummit } from "./RouteMap";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-black/10 bg-neutral-100 text-sm text-neutral-500">
      Cargando mapa...
    </div>
  ),
});

export default RouteMap;
