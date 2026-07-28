"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteRouteButton({ routeId }: { routeId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Seguro que quieres borrar esta ruta y sus fotos?")) return;
    setDeleting(true);
    await supabase.from("routes").delete().eq("id", routeId);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm text-red-600 underline disabled:opacity-50"
    >
      {deleting ? "Borrando..." : "Borrar ruta"}
    </button>
  );
}
