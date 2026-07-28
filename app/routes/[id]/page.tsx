import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RouteMap from "@/components/map/RouteMapClient";
import PhotoUploader from "@/components/PhotoUploader";
import DeleteRouteButton from "@/components/DeleteRouteButton";
import { formatDistance, formatDuration, formatElevation } from "@/lib/geo";
import type { RouteRow, RoutePhoto, Summit } from "@/lib/supabase/types";

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: "Fácil",
  moderada: "Moderada",
  dificil: "Difícil",
};

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: route } = await supabase
    .from("routes")
    .select("*, owner:profiles(username)")
    .eq("id", id)
    .single();

  if (!route) notFound();

  const typedRoute = route as unknown as RouteRow & { owner: { username: string } | null };

  const [{ data: photos }, { data: summits }] = await Promise.all([
    supabase.from("route_photos").select("*").eq("route_id", id).order("created_at"),
    supabase.from("summits").select("*").eq("route_id", id),
  ]);

  const photoRows = (photos ?? []) as RoutePhoto[];
  const summitRows = (summits ?? []) as Summit[];

  const signedPhotos = await Promise.all(
    photoRows.map(async (photo) => {
      const { data } = await supabase.storage
        .from("route-photos")
        .createSignedUrl(photo.storage_path, 3600);
      return { ...photo, url: data?.signedUrl ?? null };
    })
  );

  const isOwner = user?.id === typedRoute.user_id;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{typedRoute.name}</h1>
            <p className="text-sm text-neutral-500">
              @{typedRoute.owner?.username ?? "?"}
              {typedRoute.route_date ? ` · ${typedRoute.route_date}` : ""}
            </p>
          </div>
          {isOwner && <DeleteRouteButton routeId={typedRoute.id} />}
        </div>
        {typedRoute.description && (
          <p className="mt-3 whitespace-pre-wrap text-neutral-700">{typedRoute.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Stat label="Distancia" value={formatDistance(typedRoute.distance_m)} />
        <Stat label="Desnivel +" value={formatElevation(typedRoute.elevation_gain_m)} />
        <Stat label="Desnivel -" value={formatElevation(typedRoute.elevation_loss_m)} />
        <Stat label="Duración" value={formatDuration(typedRoute.duration_min)} />
        {typedRoute.difficulty && (
          <Stat label="Dificultad" value={DIFFICULTY_LABEL[typedRoute.difficulty]} />
        )}
      </div>

      {typedRoute.track_geojson && (
        <RouteMap
          routes={[{ id: typedRoute.id, name: typedRoute.name, geometry: typedRoute.track_geojson }]}
          summits={summitRows.map((s) => ({
            id: s.id,
            name: s.name,
            lat: s.lat,
            lng: s.lng,
            elevationM: s.elevation_m,
          }))}
          height="420px"
        />
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Fotos</h2>
          {isOwner && user && <PhotoUploader routeId={typedRoute.id} userId={user.id} />}
        </div>
        {signedPhotos.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay fotos.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {signedPhotos.map(
              (photo) =>
                photo.url && (
                  <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg border border-black/10">
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? typedRoute.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white px-4 py-2">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
