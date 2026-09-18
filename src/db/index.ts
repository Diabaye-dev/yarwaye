/**
 * CONNEXION À LA BASE DE DONNÉES — src/db/index.ts
 * ------------------------------------------------------------
 * Crée un "Pool" (réserve de connexions) pg vers PostgreSQL en lisant la
 * variable d'environnement DATABASE_URL, puis l'enveloppe dans le client
 * Drizzle ORM exporté sous le nom "db".
 * Toutes les routes API importent ensuite : import { db } from "@/db";
 *
 * Trois réglages importants pour un déploiement gratuit (Vercel, Render...) :
 *   1. SSL      : les PostgreSQL managés (Neon, Supabase) l'exigent ;
 *   2. pool mini : le serveur est « sans état » et chaque requête peut ouvrir
 *                  une connexion -> on limite à 3 pour ne pas saturer une base
 *                  gratuite (souvent plafonnée à ~100 connexions) ;
 *   3. timeout   : on referme vite les connexions inactives.
 *
 * En local, seul DATABASE_URL change : rien n'est cassé.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL est manquante. Copiez .env.example vers .env et indiquez votre chaîne PostgreSQL."
  );
}

// SSL activé par défaut, désactivable avec ?sslmode=disable (base locale).
const wantsSsl = !/sslmode=(disable|allow)/.test(databaseUrl);
// En production sur un hébergeur, le certificat est valide ; on garde
// rejectUnauthorized:false par défaut pour accepter les CAs internes des
// offres gratuites, activable via DATABASE_SSL_STRICT=1.
const ssl = wantsSsl
  ? { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === "1" }
  : undefined;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl,
    max: Number(process.env.DATABASE_POOL_MAX ?? 3), // connexions simultanées
    idleTimeoutMillis: 10_000, // fermeture des connexions inactives
    connectionTimeoutMillis: 10_000, // échec rapide si la base est endormie
    allowExitOnIdle: true, // ne bloque pas l'arrêt d'une fonction serverless
  });

// En développement, on garde le pool en mémoire globale pour éviter que le
// rechargement à chaud (hot reload) n'ouvre un nouveau pool à chaque fois.
if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

// "db" : le client Drizzle. db.select(), db.insert(), db.update()... produisent
// le SQL correspondant, on n'écrit donc jamais de requête à la main.
export const db = drizzle(pool);
