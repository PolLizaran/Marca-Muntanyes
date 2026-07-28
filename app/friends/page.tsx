import { createClient } from "@/lib/supabase/server";
import AddFriendForm from "@/components/AddFriendForm";
import { AcceptDeclineButtons, RemoveFriendButton } from "@/components/FriendActionButtons";
import type { Friendship, Profile } from "@/lib/supabase/types";

type FriendshipWithProfiles = Friendship & {
  requester: Pick<Profile, "id" | "username"> | null;
  addressee: Pick<Profile, "id" | "username"> | null;
};

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("friendships")
    .select("*, requester:requester_id(id, username), addressee:addressee_id(id, username)")
    .order("created_at", { ascending: false });

  const friendships = (data ?? []) as unknown as FriendshipWithProfiles[];

  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === user.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester_id === user.id);
  const accepted = friendships.filter((f) => f.status === "accepted");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="mb-3 text-2xl font-bold">Amigos</h1>
        <AddFriendForm />
      </div>

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Solicitudes recibidas</h2>
          <ul className="flex flex-col gap-2">
            {incoming.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-black/10 bg-white p-3"
              >
                <span>@{f.requester?.username}</span>
                <AcceptDeclineButtons friendshipId={f.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Solicitudes enviadas</h2>
          <ul className="flex flex-col gap-2">
            {outgoing.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-black/10 bg-white p-3"
              >
                <span>@{f.addressee?.username}</span>
                <span className="text-sm text-neutral-500">Pendiente</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Tus amigos ({accepted.length})</h2>
        {accepted.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no tienes amigos añadidos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {accepted.map((f) => {
              const other = f.requester_id === user.id ? f.addressee : f.requester;
              return (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-black/10 bg-white p-3"
                >
                  <span>@{other?.username}</span>
                  <RemoveFriendButton friendshipId={f.id} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
