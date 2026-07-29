import { createClient } from "@/lib/supabase/server";
import SidebarClient, { type NavLink } from "./SidebarClient";

const LINKS: NavLink[] = [
  { href: "/dashboard", label: "Mapa", icon: "🗺️" },
  { href: "/routes", label: "Rutas", icon: "🥾" },
  { href: "/summits/new", label: "Nueva cima", icon: "⛰️" },
  { href: "/friends", label: "Amigos", icon: "👥" },
];

export default async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
  }

  return <SidebarClient loggedIn={!!user} username={username} links={LINKS} />;
}
