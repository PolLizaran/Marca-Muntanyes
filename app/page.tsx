import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="flex flex-col items-center gap-8 py-16 text-center">
      <h1 className="text-4xl font-bold text-emerald-800">🏔️ Marca Muntanyes</h1>
      <p className="max-w-xl text-lg text-neutral-600">
        Registra las cimas y rutas que has hecho, míralas en un mapa, sube tus fotos y
        compártelo todo con tus amigos de montaña.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-emerald-700 px-5 py-2.5 text-white hover:bg-emerald-800"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-emerald-700 px-5 py-2.5 text-emerald-800 hover:bg-emerald-50"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}
