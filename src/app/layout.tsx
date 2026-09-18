/**
 * MISE EN PAGE RACINE — src/app/layout.tsx (Next.js App Router)
 * 
 * Enveloppe toutes les pages : <html>, <body>, import des styles globaux et
 * montage du AuthProvider pour que la session soit disponible partout.
 * "metadata" définit le titre et la description vus par le navigateur / SEO.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "AGRO SERVICE YARWAYE - Système commercial & point de vente (767866536)",
  description:
    "AGRO SERVICE YARWAYE — Malika Qrt Malika / Mer, BP 17000, Keur Massar, Dakar. Agriculture, transformation, commercialisation, services, commerce général, BTP, pâtisserie et restauration. Contact: 767866536.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-100 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
