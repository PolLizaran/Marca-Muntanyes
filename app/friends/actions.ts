"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendFriendRequest(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const addresseeUsername = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  if (!addresseeUsername) return { error: "Escribe un nombre de usuario." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No has iniciado sesión." };

  const { data: addressee } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", addresseeUsername)
    .single();

  if (!addressee) return { error: "No existe ningún usuario con ese nombre." };
  if (addressee.id === user.id) return { error: "No puedes añadirte a ti mismo." };

  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: addressee.id });

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe una relación con este usuario." : error.message,
    };
  }

  revalidatePath("/friends");
  return { error: null };
}

export async function respondToRequest(friendshipId: string, accept: boolean) {
  const supabase = await createClient();
  await supabase
    .from("friendships")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", friendshipId);

  revalidatePath("/friends");
}

export async function removeFriendship(friendshipId: string) {
  const supabase = await createClient();
  await supabase.from("friendships").delete().eq("id", friendshipId);
  revalidatePath("/friends");
}
