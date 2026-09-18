/* ============================================================================
 *  FICHIER : src/app/api/products/[id]/route.ts
 *  LANGAGE : TypeScript — Next.js Route Handler (API REST dynamique)
 *  RÔLE    : Opérations sur UN SEUL PRODUIT identifié par son "id"
 *            dans l'URL (exemple : /api/products/5).
 *
 *    GET    /api/products/5 → lire la fiche du produit n°5 (+ ses mouvements)
 *    PUT    /api/products/5 → MODIFIER ce produit (nom, prix, stock...)
 *                             Si le stock change, l'ajustement est journalisé.
 *    DELETE /api/products/5 → SUPPRIMER définitivement ce produit
 * ==========================================================================*/

import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { eq } from "drizzle-orm";

// ──────────────────── GET : lecture d'un produit précis ────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Also get stock movements for this product
    const movements = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId));

    return NextResponse.json({ product, movements });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const {
      name,
      sku,
      barcode,
      category,
      description,
      costPrice,
      sellingPrice,
      stock,
      minStockAlert,
      unit,
      imageUrl,
      isActive,
      performedBy,
    } = body;

    const newStock = stock !== undefined ? Number(stock) : existing.stock;

    // Track stock change if stock was directly edited
    if (stock !== undefined && newStock !== existing.stock) {
      const diff = newStock - existing.stock;
      await db.insert(stockMovements).values({
        productId,
        productName: name || existing.name,
        type: diff > 0 ? "in" : "adjustment",
        quantity: diff,
        previousStock: existing.stock,
        newStock: newStock,
        reason: "Mise à jour manuelle de la fiche produit",
        performedBy: performedBy || "Yarwaye",
      });
    }

    const [updated] = await db
      .update(products)
      .set({
        name: name !== undefined ? name.trim() : existing.name,
        sku: sku !== undefined ? sku.trim() : existing.sku,
        barcode: barcode !== undefined ? (barcode?.trim() || null) : existing.barcode,
        category: category !== undefined ? category.trim() : existing.category,
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        costPrice: costPrice !== undefined ? Number(costPrice) : existing.costPrice,
        sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : existing.sellingPrice,
        stock: newStock,
        minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : existing.minStockAlert,
        unit: unit !== undefined ? unit : existing.unit,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    console.error("Product PUT error:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ce code SKU est déjà utilisé par un autre article." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json({ success: true, message: "Produit supprimé avec succès" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
