"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PickPointMap = dynamic(() => import("@/components/map/PickPointMap"), { ssr: false });

export default function NewSummitPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [elevation, setElevation] = useState("");
  const [notes, setNotes] = useState("");
  const [reachedAt, setReachedAt] = useState("");
  const [point, setPoint] = useState<[number, number] | null>(null);
  const [routeId, setRouteId] = useState("");
  const [myRoutes, setMyRoutes] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("routes")
      .select("id, name")
      .order("created_at", { ascending: false })
      .then(({ data }) => setMyRoutes(data ?? []));
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!point) {
      setError("Marca la ubicación de la cima en el mapa.");
      return;
    }
    if (!name.trim()) {
      setError("Ponle un nombre a la cima.");
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

    const { error: insertError } = await supabase.from("summits").insert({
      user_id: user.id,
      route_id: routeId || null,
      name: name.trim(),
      elevation_m: elevation ? Number(elevation) : null,
      lat: point[0],
      lng: point[1],
      notes: notes.trim() || null,
      reached_at: reachedAt || null,
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Nueva cima</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm text-neutral-600">Haz clic en el mapa para marcar la cima.</p>
          <PickPointMap point={point} onPick={(lat, lng) => setPoint([lat, lng])} />
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Nombre de la cima
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-black/20 px-3 py-2"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Altitud (m)
            <input
              type="number"
              value={elevation}
              onChange={(e) => setElevation(e.target.value)}
              className="rounded-md border border-black/20 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Fecha
            <input
              type="date"
              value={reachedAt}
              onChange={(e) => setReachedAt(e.target.value)}
              className="rounded-md border border-black/20 px-3 py-2"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Ruta asociada (opcional)
          <select
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className="rounded-md border border-black/20 px-3 py-2"
          >
            <option value="">-- Sin ruta asociada --</option>
            {myRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Notas
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-md border border-black/20 px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cima"}
        </button>
      </form>
    </div>
  );
}
