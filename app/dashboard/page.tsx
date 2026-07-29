import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RouteMap, { type MapRoute, type MapSummit } from "@/components/map/RouteMapClient";
import { formatDistance, formatElevation } from "@/lib/geo";
import type { RouteRow, Summit } from "@/lib/supabase/types";

type RouteWithOwner = RouteRow & { owner: { username: string } | null };
type SummitWithOwner = Summit & { owner: { username: string } | null };

const RECENT_LIMIT = 6;

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

  type ActivityItem =
    | { kind: "route"; date: string | null; data: RouteWithOwner }
    | { kind: "summit"; date: string | null; data: SummitWithOwner };

  const activity: ActivityItem[] = [
    ...routeRows.map((r): ActivityItem => ({ kind: "route", date: r.route_date, data: r })),
    ...summitRows.map((s): ActivityItem => ({ kind: "summit", date: s.reached_at, data: s })),
  ]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, RECENT_LIMIT);

  return (
    <div className="flex w-full min-w-0 flex-col gap-8">
      <div className="min-w-0">
        <h1 className="mb-3 text-2xl font-bold">Tu mapa</h1>
        <RouteMap routes={mapRoutes} summits={mapSummits} height="60vh" />
        <p className="mt-2 text-xs text-neutral-500">
          <span className="text-red-600">●</span> tus rutas &nbsp;
          <span className="text-blue-600">●</span> rutas de amigos
        </p>
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Actividad reciente</h2>
          <Link href="/routes" className="text-sm text-emerald-800 underline">
            Ver todas las rutas
          </Link>
        </div>
        {activity.length === 0 ? (
          <p className="text-neutral-500">
            Aún no hay rutas ni cimas. ¡
            <Link href="/routes/new" className="text-emerald-800 underline">
              Registra la primera
            </Link>
            !
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {activity.map((item) =>
              item.kind === "route" ? (
                <li key={`route-${item.data.id}`} className="min-w-0">
                  <Link
                    href={`/routes/${item.data.id}`}
                    className="block min-w-0 rounded-lg border border-black/10 bg-white p-4 hover:bg-neutral-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold">{item.data.name}</span>
                      <span className="shrink-0 text-xs text-neutral-500">
                        @{item.data.owner?.username ?? "?"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {item.data.route_date ?? "Sin fecha"} · {formatDistance(item.data.distance_m)} ·{" "}
                      {formatElevation(item.data.elevation_gain_m)} de desnivel positivo
                    </div>
                  </Link>
                </li>
              ) : (
                <li
                  key={`summit-${item.data.id}`}
                  className="rounded-lg border border-black/10 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">⛰️ {item.data.name}</span>
                    <span className="shrink-0 text-xs text-neutral-500">
                      @{item.data.owner?.username ?? "?"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">
                    {item.data.reached_at?.slice(0, 10) ?? "Sin fecha"} ·{" "}
                    {formatElevation(item.data.elevation_m)}
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
