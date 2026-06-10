import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Darwin Content Manager",
  description: "Adaptá inspiración al estilo de tu marca con IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-zinc-950 text-zinc-100 antialiased">
        <Nav />
        <main className="max-w-3xl mx-auto px-4 pb-16 pt-8">{children}</main>
      </body>
    </html>
  );
}
