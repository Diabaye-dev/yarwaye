/**
 * CONNEXION À LA BASE DE DONNÉES — src/db/index.ts
 * 
 * Crée un "Pool" (pool de connexions) pg vers PostgreSQL en lisant la
 * variable d'environnement DATABASE_URL, puis l'enveloppe dans le client
 * Drizzle ORM exporté sous le nom "db".
 * Toutes les routes API importent ensuite : import { db } from "@/db";
 * 
 * Le cache via globalThis évite d'ouvrir un nouveau pool à chaque rechargement
 * à chaud (hot reload) du serveur en développement.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

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
