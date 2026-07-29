import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatElevation } from "@/lib/geo";
import type { Summit } from "@/lib/supabase/types";

type SummitWithOwner = Summit & { owner: { username: string } | null };

function SummitCard({ summit, showOwner }: { summit: SummitWithOwner; showOwner: boolean }) {
  return (
    <li className="min-w-0 rounded-lg border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-semibold">⛰️ {summit.name}</span>
        {showOwner && (
          <span className="shrink-0 text-xs text-neutral-500">
            @{summit.owner?.username ?? "?"}
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-neutral-600">
        <span>{summit.reached_at?.slice(0, 10) ?? "Sin fecha"}</span>
        <span>· {formatElevation(summit.elevation_m)}</span>
      </div>
      {summit.route_id && (
        <Link href={`/routes/${summit.route_id}`} className="mt-1 inline-block text-sm text-emerald-800 underline">
          Ver ruta asociada
        </Link>
      )}
    </li>
  );
}

export default async function SummitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: summits } = await supabase
    .from("summits")
    .select("*, owner:profiles(username)")
    .order("reached_at", { ascending: false, nullsFirst: false });

  const summitRows = (summits ?? []) as unknown as SummitWithOwner[];
  const mySummits = summitRows.filter((s) => s.user_id === user?.id);
  const friendSummits = summitRows.filter((s) => s.user_id !== user?.id);

  return (
    <div className="flex w-full min-w-0 flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Cimas</h1>
        <Link
          href="/summits/new"
          className="shrink-0 rounded-md bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800"
        >
          + Nueva cima
        </Link>
      </div>

      <section className="min-w-0">
        <h2 className="mb-3 text-lg font-semibold">Tus cimas ({mySummits.length})</h2>
        {mySummits.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Todavía no has registrado ninguna cima.{" "}
            <Link href="/summits/new" className="text-emerald-800 underline">
              Registra la primera
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mySummits.map((summit) => (
              <SummitCard key={summit.id} summit={summit} showOwner={false} />
            ))}
          </ul>
        )}
      </section>

      {friendSummits.length > 0 && (
        <section className="min-w-0">
          <h2 className="mb-3 text-lg font-semibold">Cimas de amigos ({friendSummits.length})</h2>
          <ul className="flex flex-col gap-3">
            {friendSummits.map((summit) => (
              <SummitCard key={summit.id} summit={summit} showOwner />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
