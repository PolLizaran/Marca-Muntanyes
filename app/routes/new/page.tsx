"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { parseTrackFile } from "@/lib/gpx";
import { computeTrackStats, formatDistance, formatElevation } from "@/lib/geo";
import type { Difficulty, RouteSource } from "@/lib/supabase/types";

const DrawRouteMap = dynamic(() => import("@/components/map/DrawRouteMap"), { ssr: false });

type Mode = "file" | "manual";

export default function NewRoutePage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("file");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [routeDate, setRouteDate] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [durationMin, setDurationMin] = useState("");

  const [source, setSource] = useState<RouteSource>("manual");
  const [geometry, setGeometry] = useState<GeoJSON.LineString | GeoJSON.MultiLineString | null>(null);
  const [stats, setStats] = useState<{ distanceM: number; elevationGainM: number | null; elevationLossM: number | null } | null>(null);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const parsed = await parseTrackFile(file);
      setGeometry(parsed.geometry);
      setStats(parsed.stats);
      setSource(/\.kml$/i.test(file.name) ? "kml" : "gpx");
      if (!name && parsed.name) setName(parsed.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido leer el archivo.");
    }
  }

  function addDrawPoint(lat: number, lng: number) {
    setDrawPoints((prev) => [...prev, [lat, lng]]);
  }

  function undoDrawPoint() {
    setDrawPoints((prev) => prev.slice(0, -1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let finalGeometry = geometry;
    let finalStats = stats;
    let finalSource = source;

    if (mode === "manual") {
      if (drawPoints.length < 2) {
        setError("Marca al menos dos puntos en el mapa para dibujar la ruta.");
        return;
      }
      const coords = drawPoints.map(([lat, lng]) => [lng, lat]);
      finalGeometry = { type: "LineString", coordinates: coords };
      finalStats = computeTrackStats(coords);
      finalSource = "manual";
    } else if (!finalGeometry) {
      setError("Sube un archivo GPX o KML con la traza.");
      return;
    }

    if (!name.trim()) {
      setError("Ponle un nombre a la ruta.");
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("Tu sesión ha caducado. Vuelve a entrar.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("routes")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        route_date: routeDate || null,
        source: finalSource,
        track_geojson: finalGeometry,
        distance_m: finalStats?.distanceM ?? null,
        elevation_gain_m: finalStats?.elevationGainM ?? null,
        elevation_loss_m: finalStats?.elevationLossM ?? null,
        duration_min: durationMin ? Number(durationMin) : null,
        difficulty: difficulty || null,
      })
      .select("id")
      .single();

    setLoading(false);
    if (insertError || !data) {
      setError(insertError?.message ?? "No se ha podido guardar la ruta.");
      return;
    }

    router.push(`/routes/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Nueva ruta</h1>

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`rounded-md px-4 py-2 text-sm ${mode === "file" ? "bg-emerald-700 text-white" : "border border-black/20"}`}
        >
          Subir GPX/KML
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`rounded-md px-4 py-2 text-sm ${mode === "manual" ? "bg-emerald-700 text-white" : "border border-black/20"}`}
        >
          Dibujar en el mapa
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "file" ? (
          <div>
            <label className="flex flex-col gap-1 text-sm">
              Archivo GPX o KML
              <input
                type="file"
                accept=".gpx,.kml"
                onChange={handleFile}
                className="rounded-md border border-black/20 px-3 py-2"
              />
            </label>
            {stats && (
              <p className="mt-2 text-sm text-neutral-600">
                {formatDistance(stats.distanceM)} · +{formatElevation(stats.elevationGainM)} / -
                {formatElevation(stats.elevationLossM)}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm text-neutral-600">
              Haz clic en el mapa para ir marcando el recorrido ({drawPoints.length} puntos).
            </p>
            <DrawRouteMap points={drawPoints} onAddPoint={addDrawPoint} />
            <button
              type="button"
              onClick={undoDrawPoint}
              disabled={drawPoints.length === 0}
              className="mt-2 text-sm text-neutral-600 underline disabled:opacity-40"
            >
              Deshacer último punto
            </button>
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm">
          Nombre de la ruta
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-black/20 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Descripción
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-md border border-black/20 px-3 py-2"
          />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Fecha
            <input
              type="date"
              value={routeDate}
              onChange={(e) => setRouteDate(e.target.value)}
              className="rounded-md border border-black/20 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Duración (min)
            <input
              type="number"
              min={0}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="rounded-md border border-black/20 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Dificultad
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
              className="rounded-md border border-black/20 px-3 py-2"
            >
              <option value="">-</option>
              <option value="facil">Fácil</option>
              <option value="moderada">Moderada</option>
              <option value="dificil">Difícil</option>
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar ruta"}
        </button>
      </form>
    </div>
  );
}
