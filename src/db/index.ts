/* ============================================================================
 *  FICHIER : src/db/index.ts
 *  LANGAGE : TypeScript
 *  RÔLE    : Créer et exporter la CONNEXION à la base de données PostgreSQL.
 *
 *  Comment ça marche :
 *    1. On lit l'adresse de la base dans la variable d'environnement
 *       DATABASE_URL (fichier .env) :
 *       postgresql://postgres:postgres@127.0.0.1:5432/app_db
 *    2. On crée un "Pool" (un réservoir de connexions réutilisables).
 *    3. On exporte `db` : c'est cet objet qu'on utilise partout dans l'application
 *       pour lire/écrire des données, par exemple :
 *          await db.select().from(products)
 *          await db.insert(orders).values({...})
 * ==========================================================================*/

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Adresse de la base de données.
// - Sur Vercel/Neon : la variable d'environnement DATABASE_URL est utilisée.
// - En local (ou si la variable manque au build), on utilise l'adresse par défaut
//   pour que la compilation ne bloque jamais ("throw" = cause fréchente d'échec
//   du `npm run build` sur les plateformes d'hébergement).
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
