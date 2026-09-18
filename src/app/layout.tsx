/* ============================================================================
 *  FICHIER : src/app/layout.tsx
 *  LANGAGE : TypeScript + JSX (React) — Framework Next.js (App Router)
 *  RÔLE    : Le GABARIT GÉNÉRAL de toutes les pages du site.
 *            Tout ce qui est écrit ici (balise <html>, <body>, le contexte
 *            d'authentification) entoure automatiquement chaque page.
 *
 *    - metadata  → le titre de l'onglet du navigateur + la description Google
 *    - AuthProvider → rend l'information "quel utilisateur est connecté ?"
 *      disponible dans toute l'application
 * ==========================================================================*/

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "AGRO SERVICE YARWAYE — Agriculture, Agroalimentaire, BTP & Commerce Général (Keur Massar, Dakar) | Tél 767866536",
  description:
    "AGRO SERVICE YARWAYE — Malika QRT Malika / MER, BP 17000 Keur Massar, Dakar. Agriculture, transformation agroalimentaire, commerce général, BTP, pâtisserie et restauration. Commandes & Wave/OM au 767866536.",
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
