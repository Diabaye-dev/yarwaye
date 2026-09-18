/**
 * ROUTE /api/products/[id]/stock — ajustement rapide de stock
 * 
 * POST : incrémente/décrémente le stock (réassort, avarie, retour client...)
 *        et écrit une ligne dans "stock_movements" (qui, avant, nouveau stock,
 *        motif, opérateur). C'est la base du journal d'audit des inventaires.
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);
    const body = await req.json();

    const { changeQuantity, type, reason, performedBy } = body;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const qty = Number(changeQuantity);
    if (isNaN(qty) || qty === 0) {
      return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
    }

    const newStock = Math.max(0, product.stock + qty); // jamais de stock negatif

    const [updatedProduct] = await db
      .update(products)
      .set({
        stock: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    const [movement] = await db
      .insert(stockMovements)
      .values({
        productId,
        productName: product.name,
        type: type || (qty > 0 ? "in" : "out"),
        quantity: qty,
        previousStock: product.stock,
        newStock: newStock,
        reason: reason || (qty > 0 ? "Réapprovisionnement" : "Ajustement inventaire"),
        performedBy: performedBy || "Yarwaye",
      })
      .returning();

    return NextResponse.json({ product: updatedProduct, movement });
  } catch (error) {
    return NextResponse.json({ error: "Impossible d'ajuster le stock" }, { status: 500 });
  }
}
