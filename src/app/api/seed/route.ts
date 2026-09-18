/**
 * ROUTE /api/seed — réinitialisation des données de démonstration
 * 
 * POST : vide toutes les tables dans le bon ordre (enfants avant parents)
 *        puis rejoue seedDatabase(). Pratique pour repartir d'un jeu propre.
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, customers, suppliers, orders, orderItems, stockMovements, storeSettings } from "@/db/schema";
import { seedDatabase } from "@/db/seed";

export async function POST() {
  try {
    // On vide dans le bon ordre (tables enfants d’abord) pour éviter les orphelins.
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(stockMovements);
    await db.delete(products);
    await db.delete(customers);
    await db.delete(suppliers);
    await db.delete(users);
    await db.delete(storeSettings);

    await seedDatabase();

    return NextResponse.json({ success: true, message: "Base de données AGRO SERVICE YARWAYE réinitialisée avec succès !" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Impossible de réinitialiser la base de données" }, { status: 500 });
  }
}
