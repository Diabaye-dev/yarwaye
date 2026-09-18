/**
   ROUTE /api/health — sonde de bon fonctionnement + INITIALISATION
   ------------------------------------------------------------
   Double rôle :
   1. vérifier que la base répond ("select 1") ;
   2. préparer une base toute neuve : créer les 8 tables + index, puis insérer
      les données de démonstration. C'est ce qui permet de déployer sur un
      hébergeur gratuit SANS terminal : il suffit d'ouvrir /api/health une fois.

   Idempotent : relancer l'URL ne duplique ni les tables ni les données.
*/
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { bootstrapDatabase } from "@/db/migrate";

export const dynamic = "force-dynamic"; // ne jamais mettre en cache ce diagnostic

export async function GET() {
  try {
    await db.execute(sql`select 1`); // la base est joignable ?

    // Création du schéma + données de démo si nécessaire.
    const rapport = await bootstrapDatabase();

    return Response.json({
      ok: true,
      store: "AGRO SERVICE YARWAYE",
      contact: "767866536",
      initialisation: rapport,
    });
  } catch (err: any) {
    // Message d'erreur actionnable : c'est presque toujours DATABASE_URL.
    return Response.json(
      {
        ok: false,
        error: err?.message ?? "erreur inconnue",
        aide: "Vérifiez que la variable d'environnement DATABASE_URL est définie sur l'hébergeur (et que l'accès réseau autorise votre IP si la base est protégée).",
      },
      { status: 500 }
    );
  }
}
