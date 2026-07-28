import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
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

  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur sticky top-0 z-[500]">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={user ? "/dashboard" : "/"} className="font-bold text-lg text-emerald-800">
          🏔️ Marca Muntanyes
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:underline">
                Mapa
              </Link>
              <Link href="/routes/new" className="hover:underline">
                Nueva ruta
              </Link>
              <Link href="/summits/new" className="hover:underline">
                Nueva cima
              </Link>
              <Link href="/friends" className="hover:underline">
                Amigos
              </Link>
              {username && (
                <Link href={`/u/${username}`} className="hover:underline text-neutral-500">
                  @{username}
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Entrar
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-800"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
