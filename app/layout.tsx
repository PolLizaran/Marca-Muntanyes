import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marca Muntanyes",
  description: "Registra tus cimas y rutas de montaña, y compártelas con amigos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full w-full overflow-x-hidden bg-neutral-50 text-neutral-900 md:flex">
        <Sidebar />
        <main className="w-full min-w-0 flex-1 overflow-x-hidden px-4 py-4 sm:py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
