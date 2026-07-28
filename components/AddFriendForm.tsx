"use client";

import { useActionState, useRef } from "react";
import { sendFriendRequest } from "@/app/friends/actions";

export default function AddFriendForm() {
  const [state, formAction, isPending] = useActionState(sendFriendRequest, { error: null });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <input
          type="text"
          name="username"
          placeholder="nombre_de_usuario"
          required
          className="flex-1 rounded-md border border-black/20 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          Añadir
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
