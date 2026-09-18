/**
   CONNEXION À LA BASE DE DONNÉES — src/db/index.ts
   ------------------------------------------------------------
   Crée un "Pool" (réserve de connexions) pg vers PostgreSQL en lisant la
   variable d'environnement DATABASE_URL, puis l'enveloppe dans le client
   Drizzle ORM exporté sous le nom "db".
   Toutes les routes API importent ensuite : import { db } from "@/db";

   ⚠️ POINT IMPORTANT — initialisation PARESSEUSE (lazy)
   Next.js EXECUTE tous les modules pendant `next build` (étape "Collecting
   page data"). Si on lisait DATABASE_URL et qu'on créait le Pool tout de suite,
   un build sans variable d'environnement (premier déploiement Vercel, CI,
   aperçu de branche…) faisait échouer `npm run build` avec le message
   « DATABASE_URL est manquante ».
   D'où createDb() appelé uniquement à la première utilisation : le build passe
   toujours, et l'erreur n'apparaît que si une requête est réellement émise.

   Trois réglages pour un hébergement gratuit (Vercel, Render, Railway…) :
     1. SSL       : exigé par les PostgreSQL managés (Neon, Supabase) ;
     2. pool mini : chaque fonction serverless peut ouvrir sa connexion -> on
                    limite à 3 pour ne pas saturer une petite base ;
     3. timeouts  : courts, pour survivre à la mise en veille de la base.
*/
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: ReturnType<typeof createDb>;
};

/** Crée (ou réutilise) le pool de connexions à partir de l'environnement. */
function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // Message actionnel : c'est presque toujours une variable oubliée sur
    // l'hébergeur (Vercel -> Settings -> Environment Variables).
    throw new Error(
      "DATABASE_URL est manquante. Ajoutez-la dans Vercel (Settings → Environment Variables, cochée pour Production ET Preview), ou copiez .env.example vers .env en local."
    );
  }

  // SSL actif sauf demande contraire (?sslmode=disable pour une base locale).
  const wantsSsl = !/sslmode=(disable|allow)/.test(databaseUrl);
  // rejectUnauthorized:false par défaut : les offres gratuites utilisent parfois
  // des CA internes. À durcir avec DATABASE_SSL_STRICT=1 une fois en production.
  const ssl = wantsSsl
    ? { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === "1" }
    : undefined;

  // Les chaînes Neon/Supabase arrivent avec ?sslmode=require&channel_binding=require.
  // Ces paramètres sont déjà couverts par l'option `ssl` ci-dessus : on les retire
  // de l'URL pour éviter un double réglage et l'avertissement de dépréciation du
  // pilote `pg`.
  const cleanedUrl = databaseUrl
    .replace(/([?&])sslmode=[^&]*/g, "$1")
    .replace(/([?&])channel_binding=[^&]*/g, "$1")
    .replace(/[?&]+$/, "")
    .replace(/&&+/g, "&")
    .replace(/\?&/, "?");

  return new Pool({
    connectionString: cleanedUrl,
    ssl,
    max: Number(process.env.DATABASE_POOL_MAX ?? 3), // connexions simultanées
    idleTimeoutMillis: 10_000, // fermeture des connexions inutiles
    connectionTimeoutMillis: 10_000, // échec rapide si la base s'éveille
    allowExitOnIdle: true, // ne bloque pas la fin d'une fonction serverless
  });
}

/** Client Drizzle : le SQL est généré pour nous (select/insert/update/delete). */
function createDb() {
  return drizzle(createPool());
}

function getDb() {
  // En production, on ne garde qu'un seul client par processus Node : sans ce
  // cache, chaque requête ouvrirait un nouveau pool et épuiserait la base.
  if (!globalForDb.__arenaNextJsPostgresqlDb) {
    globalForDb.__arenaNextJsPostgresqlDb = createDb();
  }
  return globalForDb.__arenaNextJsPostgresqlDb;
}

/**
 * `db` est un *proxy* : aucun accès à la base n'est fait tant qu'on ne
 * l'utilise pas (important pour le build). db.select(), db.insert()...
 * déclenchent alors la vraie connexion.
 */
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, property) {
    const instance = getDb() as unknown as Record<string | symbol, unknown>;
    const value = instance[property];
    // Les méthodes doivent rester liées à leur objet, sinon `this` est perdu.
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

/** Pool partagé, créé à la demande (utile pour un /api/health détaillé). */
export const pool = new Proxy({} as Pool, {
  get(_target, property) {
    if (!globalForDb.__arenaNextJsPostgresqlPool) {
      globalForDb.__arenaNextJsPostgresqlPool = createPool();
    }
    const instance = globalForDb.__arenaNextJsPostgresqlPool as unknown as Record<
      string | symbol,
      unknown
    >;
    const value = instance[property];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
