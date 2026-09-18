import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, customers, suppliers, orders, orderItems, stockMovements, storeSettings } from "@/db/schema";
import { seedDatabase } from "@/db/seed";

export async function POST() {
  try {
    // Clear and reseed
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(stockMovements);
    await db.delete(products);
    await db.delete(customers);
    await db.delete(suppliers);
    await db.delete(users);
    await db.delete(storeSettings);

    await seedDatabase();

    return NextResponse.json({ success: true, message: "Base de données Yarwaye réinitialisée avec succès !" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to reseed database" }, { status: 500 });
  }
}
