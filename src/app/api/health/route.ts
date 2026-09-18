/**
 * ROUTE /api/health — sonde de bon fonctionnement
 * 
 * Réponse JSON { ok: true } si la base répond (requête "select 1").
 * Sert aussi de déclencheur de peuplement : appelle seedDatabase() au cas où
 * la base serait encore vide. Utilisée par la plateforme pour valider le déploiement.
 */
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { seedDatabase } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    // Ensure seeded
    await seedDatabase().catch(() => {});
    return Response.json({ ok: true, store: "AGRO SERVICE YARWAYE", contact: "767866536" });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
