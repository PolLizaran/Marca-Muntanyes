"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "./LogoutButton";

export interface NavLink {
  href: string;
  label: string;
  icon: string;
}

export default function SidebarClient({
  loggedIn,
  username,
  links,
}: {
  loggedIn: boolean;
  username: string | null;
  links: NavLink[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes (adjusted during render,
  // per https://react.dev/learn/you-might-not-need-an-effect).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-black/10 bg-white px-4 py-3 md:hidden">
        <button
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-black/10 text-lg"
        >
          ☰
        </button>
        <Link href={loggedIn ? "/dashboard" : "/"} className="font-bold text-emerald-800">
          🏔️ Marca Muntanyes
        </Link>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] transform flex-col border-r border-black/10 bg-white transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:w-56 md:translate-x-0 md:shrink-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href={loggedIn ? "/dashboard" : "/"} className="font-bold text-emerald-800">
            🏔️ Marca Muntanyes
          </Link>
          <button
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="text-lg text-neutral-500 md:hidden"
          >
            ✕
          </button>
        </div>

        {loggedIn ? (
          <>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                      active
                        ? "bg-emerald-50 font-medium text-emerald-800"
                        : "text-neutral-700 hover:bg-black/5"
                    }`}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-col gap-2 border-t border-black/10 px-4 py-4 text-sm">
              {username && (
                <Link href={`/u/${username}`} className="text-neutral-500 hover:underline">
                  @{username}
                </Link>
              )}
              <LogoutButton />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2 px-4 py-4 text-sm">
            <Link href="/login" className="hover:underline">
              Entrar
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-emerald-700 px-3 py-2 text-center text-white hover:bg-emerald-800"
            >
              Crear cuenta
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
