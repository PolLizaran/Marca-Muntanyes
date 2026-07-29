import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDistance, formatElevation } from "@/lib/geo";
import type { RouteRow } from "@/lib/supabase/types";

type RouteWithOwner = RouteRow & { owner: { username: string } | null };

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: "Fácil",
  moderada: "Moderada",
  dificil: "Difícil",
};

function RouteCard({ route }: { route: RouteWithOwner }) {
  return (
    <li className="min-w-0 rounded-lg border border-black/10 bg-white p-4">
      <Link href={`/routes/${route.id}`} className="block truncate font-semibold hover:underline">
        {route.name}
      </Link>
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-neutral-600">
        <span>{route.route_date ?? "Sin fecha"}</span>
        <span>· {formatDistance(route.distance_m)}</span>
        <span>· +{formatElevation(route.elevation_gain_m)}</span>
        {route.difficulty && <span>· {DIFFICULTY_LABEL[route.difficulty]}</span>}
      </div>
    </li>
  );
}

export default async function RoutesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: routes } = await supabase
    .from("routes")
    .select("*, owner:profiles(username)")
    .order("route_date", { ascending: false, nullsFirst: false });

  const routeRows = (routes ?? []) as unknown as RouteWithOwner[];
  const myRoutes = routeRows.filter((r) => r.user_id === user?.id);
  const friendRoutes = routeRows.filter((r) => r.user_id !== user?.id);

  return (
    <div className="flex w-full min-w-0 flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Rutas realizadas</h1>
        <Link
          href="/routes/new"
          className="shrink-0 rounded-md bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800"
        >
          + Nueva ruta
        </Link>
      </div>

      <section className="min-w-0">
        <h2 className="mb-3 text-lg font-semibold">Tus rutas ({myRoutes.length})</h2>
        {myRoutes.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Todavía no has registrado ninguna ruta.{" "}
            <Link href="/routes/new" className="text-emerald-800 underline">
              Registra la primera
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {myRoutes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </ul>
        )}
      </section>

      {friendRoutes.length > 0 && (
        <section className="min-w-0">
          <h2 className="mb-3 text-lg font-semibold">Rutas de amigos ({friendRoutes.length})</h2>
          <ul className="flex flex-col gap-3">
            {friendRoutes.map((route) => (
              <li key={route.id} className="min-w-0 rounded-lg border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/routes/${route.id}`}
                    className="truncate font-semibold hover:underline"
                  >
                    {route.name}
                  </Link>
                  <span className="shrink-0 text-xs text-neutral-500">
                    @{route.owner?.username ?? "?"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-neutral-600">
                  <span>{route.route_date ?? "Sin fecha"}</span>
                  <span>· {formatDistance(route.distance_m)}</span>
                  <span>· +{formatElevation(route.elevation_gain_m)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
