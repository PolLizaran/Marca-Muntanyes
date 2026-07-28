import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RouteMap, { type MapRoute, type MapSummit } from "@/components/map/RouteMapClient";
import { formatDistance, formatElevation } from "@/lib/geo";
import type { RouteRow, Summit } from "@/lib/supabase/types";

type RouteWithOwner = RouteRow & { owner: { username: string } | null };
type SummitWithOwner = Summit & { owner: { username: string } | null };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: routes }, { data: summits }] = await Promise.all([
    supabase
      .from("routes")
      .select("*, owner:profiles(username)")
      .order("route_date", { ascending: false, nullsFirst: false })
      .limit(50),
    supabase
      .from("summits")
      .select("*, owner:profiles(username)")
      .order("reached_at", { ascending: false, nullsFirst: false })
      .limit(100),
  ]);

  const routeRows = (routes ?? []) as unknown as RouteWithOwner[];
  const summitRows = (summits ?? []) as unknown as SummitWithOwner[];

  const mapRoutes: MapRoute[] = routeRows
    .filter((r) => r.track_geojson)
    .map((r) => ({
      id: r.id,
      name: r.name,
      geometry: r.track_geojson!,
      color: r.user_id === user?.id ? "#dc2626" : "#2563eb",
    }));

  const mapSummits: MapSummit[] = summitRows.map((s) => ({
    id: s.id,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    elevationM: s.elevation_m,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-3 text-2xl font-bold">Tu mapa</h1>
        <RouteMap routes={mapRoutes} summits={mapSummits} height="480px" />
        <p className="mt-2 text-xs text-neutral-500">
          <span className="text-red-600">●</span> tus rutas &nbsp;
          <span className="text-blue-600">●</span> rutas de amigos
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-xl font-semibold">Actividad reciente</h2>
        {routeRows.length === 0 && summitRows.length === 0 ? (
          <p className="text-neutral-500">
            Aún no hay rutas ni cimas. ¡
            <Link href="/routes/new" className="text-emerald-800 underline">
              Registra la primera
            </Link>
            !
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {routeRows.map((route) => (
              <li key={route.id} className="rounded-lg border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/routes/${route.id}`} className="font-semibold hover:underline">
                    {route.name}
                  </Link>
                  <span className="text-xs text-neutral-500">
                    @{route.owner?.username ?? "?"}
                  </span>
                </div>
                <div className="mt-1 text-sm text-neutral-600">
                  {route.route_date ?? "Sin fecha"} · {formatDistance(route.distance_m)} ·{" "}
                  {formatElevation(route.elevation_gain_m)} de desnivel positivo
                </div>
              </li>
            ))}
            {summitRows.map((summit) => (
              <li key={summit.id} className="rounded-lg border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">⛰️ {summit.name}</span>
                  <span className="text-xs text-neutral-500">
                    @{summit.owner?.username ?? "?"}
                  </span>
                </div>
                <div className="mt-1 text-sm text-neutral-600">
                  {summit.reached_at?.slice(0, 10) ?? "Sin fecha"} ·{" "}
                  {formatElevation(summit.elevation_m)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
