/* ============================================================================
 *  FICHIER : src/app/api/db-status/route.ts
 *  LANGAGE : TypeScript — Next.js Route Handler
 *  RÔLE    : Route de DIAGNOSTIC de la base de données.
 *            À ouvrir dans le navigateur pour vérifier que le site arrive
 *            bien à se connecter à PostgreSQL (utile après un déploiement
 *            sur Vercel/Neon).
 *
 *            GET /api/db-status
 *            Réponse : {
 *              ok: true,
 *              databaseConfigured: true,
 *              products: 12,
 *              orders: 4,
 *              customers: 4,
 *              ...
 *            }
 * ==========================================================================*/

import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, orders, customers, suppliers, users, storeSettings } from "@/db/schema";
import { sql } from "drizzle-orm";

// Force l'exécution à chaque requête (pas de mise en cache)
export const dynamic = "force-dynamic";

export async function GET() {
  // 1. La variable d'environnement DATABASE_URL est-elle définie ?
  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  try {
    // 2. Test simple : la base répond-elle ?
    await db.execute(sql`select 1`);

    // 3. Comptage des enregistrements dans chaque table
    const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const [customerCount] = await db.select({ count: sql<number>`count(*)` }).from(customers);
    const [supplierCount] = await db.select({ count: sql<number>`count(*)` }).from(suppliers);
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);

    // 4. Récupération des paramètres de la boutique (nom + téléphone)
    const [settings] = await db
      .select({
        storeName: storeSettings.storeName,
        phone: storeSettings.phone,
        address: storeSettings.address,
      })
      .from(storeSettings)
      .limit(1);

    return NextResponse.json({
      ok: true,
      status: "success",
      message: "Connexion à la base de données établie avec succès ✅",
      databaseConfigured,
      store: settings
        ? {
            name: settings.storeName,
            phone: settings.phone,
            address: settings.address,
          }
        : null,
      counts: {
        products: Number(productCount?.count ?? 0),
        orders: Number(orderCount?.count ?? 0),
        customers: Number(customerCount?.count ?? 0),
        suppliers: Number(supplierCount?.count ?? 0),
        users: Number(userCount?.count ?? 0),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // En cas d'échec, on renvoie les détails pour faciliter le diagnostic
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: "Impossible de se connecter à la base de données ❌",
        databaseConfigured,
        error: error?.message ?? "Erreur inconnue",
        hint: databaseConfigured
          ? "La variable DATABASE_URL est définie mais la connexion échoue. Vérifiez que l'adresse est correcte et que la base est accessible."
          : "La variable d'environnement DATABASE_URL est absente. Ajoutez-la dans Vercel → Settings → Environment Variables (scope Production), puis redéployez.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
