import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RouteMap from "@/components/map/RouteMapClient";
import { formatDistance, formatElevation } from "@/lib/geo";
import type { RouteRow, Summit } from "@/lib/supabase/types";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  // RLS restricts these to rows visible to the current user (self or accepted friend).
  const [{ data: routes }, { data: summits }] = await Promise.all([
    supabase
      .from("routes")
      .select("*")
      .eq("user_id", profile.id)
      .order("route_date", { ascending: false, nullsFirst: false }),
    supabase.from("summits").select("*").eq("user_id", profile.id),
  ]);

  const routeRows = (routes ?? []) as RouteRow[];
  const summitRows = (summits ?? []) as Summit[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">@{profile.username}</h1>

      {routeRows.length === 0 && summitRows.length === 0 ? (
        <p className="text-neutral-500">
          No hay actividad visible. Puede que necesites ser amigo de este usuario para verla.
        </p>
      ) : (
        <>
          <RouteMap
            routes={routeRows
              .filter((r) => r.track_geojson)
              .map((r) => ({ id: r.id, name: r.name, geometry: r.track_geojson! }))}
            summits={summitRows.map((s) => ({
              id: s.id,
              name: s.name,
              lat: s.lat,
              lng: s.lng,
              elevationM: s.elevation_m,
            }))}
            height="420px"
          />
          <ul className="flex flex-col gap-3">
            {routeRows.map((route) => (
              <li key={route.id} className="min-w-0">
                <Link
                  href={`/routes/${route.id}`}
                  className="block min-w-0 rounded-lg border border-black/10 bg-white p-4 hover:bg-neutral-50"
                >
                  <span className="block truncate font-semibold">{route.name}</span>
                  <div className="mt-1 text-sm text-neutral-600">
                    {route.route_date ?? "Sin fecha"} · {formatDistance(route.distance_m)} ·{" "}
                    {formatElevation(route.elevation_gain_m)} de desnivel positivo
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
