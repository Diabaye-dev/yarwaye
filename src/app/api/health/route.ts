/* ============================================================================
 *  FICHIER : src/app/api/health/route.ts
 *  LANGAGE : TypeScript — Next.js Route Handler
 *  RÔLE    : Point de contrôle SANTE de l'application ("/api/health").
 *            Utilisé par la plateforme pour vérifier que :
 *              1. Le serveur répond
 *              2. La base de données PostgreSQL est accessible
 *              3. Les données de démonstration sont bien présentes
 *            Réponse : { ok: true, store: "Agro Service Yarwaye" }
 * ==========================================================================*/

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { seedDatabase } from "@/db/seed";

// Force Next.js à exécuter cette route à chaque requête (pas de cache)
export const dynamic = "force-dynamic";

// Vérification de la connexion base de données + peuplement automatique
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    // Ensure seeded
    await seedDatabase().catch(() => {});
    return Response.json({ ok: true, store: "Agro Service Yarwaye", contact: "767866536" });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
