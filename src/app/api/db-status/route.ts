/**
   ROUTE /api/db-status — autodiagnostic de la connexion
   ------------------------------------------------------------
   But : répondre en un coup d'œil à « pourquoi rien ne s'enregistre ? ».
   Renvoie l'état réel de la base (variable présente, connexion possible,
   nombre de tables) et, en cas d'échec, le message exact + la correction.

   Lecture seule : aucune écriture, donc utilisable même si la base est morte.
*/
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL;

  // Cas 1 : variable absente -> toutes les écritures échouent (500).
  if (!url) {
    return NextResponse.json(
      {
        ok: false,
        code: "MISSING_ENV",
        titre: "DATABASE_URL non définie",
        detail:
          "L'application tourne sans clé de connexion : les lectures peuvent provenir d'un cache, mais AUCUNE écriture n'est possible.",
        action:
          "Vercel → Settings → Environment Variables → ajoutez DATABASE_URL (cochez Production ET Preview), puis Deployments → Redeploy.",
      },
      { status: 503 }
    );
  }

  const masked = url.replace(/:[^:@/]+@/, ":••••@");
  const usesPooler = /-pooler\./.test(url);

  try {
    // Import paresseux : si la base est injoignable, on capture l'erreur au lieu
    // de faire tomber tout le handler.
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");

    await db.execute(sql`select 1`);

    // Avec le pilote node-postgres, db.execute() renvoie un QueryResult :
    // les lignes sont dans .rows (d'où ce passage par rows plutôt qu'un destructuring).
    const resultat: any = await db.execute(
      sql`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const nbTables: number = Number(resultat?.rows?.[0]?.n ?? 0);

    const base = {
      ok: nbTables >= 8,
      titre:
        nbTables >= 8
          ? "Base connectée et prête"
          : `Base connectée mais incomplète (${nbTables}/8 tables)`,
      hote: masked.split("@")[1]?.split("?")[0] ?? "?",
      pooler: usesPooler,
      tables: nbTables,
      detail:
        nbTables >= 8
          ? undefined
          : "Ouvrez /api/health une fois : l'application crée les tables et insère les données de démonstration.",
      action:
        nbTables >= 8
          ? undefined
          : "Ouvrir l'URL /api/health dans l'onglet, puis recharger la page admin.",
    };
    return NextResponse.json(base);
  } catch (err: any) {
    // Drizzle emballe l'erreur du pilote ("Failed query: select 1") : on descend
    // dans la chaîne des .cause pour récupérer le vrai message PostgreSQL
    // ("password authentication failed", "self-signed certificate", etc.),
    // sans quoi le diagnostic serait inutilisable.
    let root: any = err;
    while (root?.cause && root.cause?.message) root = root.cause;
    const msg: string = [err?.message, root?.message].filter(Boolean).join(" — ").slice(0, 600);

    // Cas 3 : mot de passe / hôte / SSL refusés. On traduit le message SQL brut.
    let aide = "Vérifiez la chaîne copiée depuis Neon (bouton Connect, « Pooled connection string »).";
    if (/password authentication failed/i.test(msg))
      aide = "Mot de passe incorrect : réinitialisez-le dans Neon → Roles → neondb_owner, puis mettez à jour Vercel et redéployez.";
    else if (/ENOTFOUND|getaddrinfo|Could not find/i.test(msg))
      aide = "Hôte introuvable : l'URL contient-elle bien le suffixe -pooler et l'extension .neon.tech ?";
    else if (/timeout|ETIMEDOUT/i.test(msg))
      aide = "Base en veille ou bloquée : vérifiez l'IP Allow list dans Neon et réessayez (1re requête ~3 s).";
    else if (/SSL|tls/i.test(msg))
      aide = "SSL refusé : gardez ?sslmode=require dans l'URL.";

    return NextResponse.json(
      { ok: false, titre: "Connexion à la base impossible", erreur: msg.slice(0, 300), action: aide },
      { status: 503 }
    );
  }
}
