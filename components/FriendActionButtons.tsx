"use client";

import { useTransition } from "react";
import { respondToRequest, removeFriendship } from "@/app/friends/actions";

export function AcceptDeclineButtons({ friendshipId }: { friendshipId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        disabled={isPending}
        onClick={() => startTransition(() => respondToRequest(friendshipId, true))}
        className="rounded-md bg-emerald-700 px-3 py-1 text-sm text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        Aceptar
      </button>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => respondToRequest(friendshipId, false))}
        className="rounded-md border border-black/20 px-3 py-1 text-sm hover:bg-black/5 disabled:opacity-50"
      >
        Rechazar
      </button>
    </div>
  );
}

export function RemoveFriendButton({ friendshipId }: { friendshipId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm("¿Eliminar esta amistad?")) startTransition(() => removeFriendship(friendshipId));
      }}
      className="text-sm text-red-600 underline disabled:opacity-50"
    >
      Eliminar
    </button>
  );
}
