/* ============================================================================
 *  FICHIER : src/app/api/products/route.ts
 *  LANGAGE : TypeScript — Next.js Route Handler (API REST)
 *  RÔLE    : Gérer les PRODUITS côté serveur. C'est le pont entre la base
 *            de données PostgreSQL et l'interface utilisateur.
 *
 *  Deux verbes HTTP sont disponibles :
 *
 *    GET  /api/products            → LIRE la liste des produits
 *         Paramètres optionnels dans l'URL :
 *           ?search=riz           → rechercher par nom/SKU/code-barres
 *           ?category=Alimentation→ filtrer par catégorie
 *           ?filter=low_stock     → uniquement les stocks bas
 *
 *    POST /api/products            → CRÉER un nouveau produit
 *         Le corps de la requête (JSON) doit contenir : name, sellingPrice...
 *         Si le stock initial > 0, on écrit aussi une ligne dans le
 *         journal des mouvements de stock (stockMovements).
 *
 *  Les autres opérations (modifier/supprimer) se trouvent dans
 *  src/app/api/products/[id]/route.ts
 * ==========================================================================*/

import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { ilike, or, eq, desc, and, lte } from "drizzle-orm";

// ─────────────────────────── LECTURE : GET /api/products ───────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const filter = searchParams.get("filter") || ""; // 'low_stock', 'active', 'all'

    let conditions = [];

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(products.name, q),
          ilike(products.sku, q),
          ilike(products.barcode, q),
          ilike(products.category, q),
          ilike(products.description, q)
        )
      );
    }

    if (category && category !== "all") {
      conditions.push(eq(products.category, category));
    }

    if (filter === "low_stock") {
      conditions.push(lte(products.stock, products.minStockAlert));
    } else if (filter === "active") {
      conditions.push(eq(products.isActive, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt));

    return NextResponse.json({ products: items });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
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

    if (!name || sellingPrice === undefined) {
      return NextResponse.json({ error: "Name and Selling Price are required" }, { status: 400 });
    }

    // Auto generate SKU if empty
    const finalSku = sku?.trim() || `DIA-${Date.now().toString().slice(-6)}`;
    const parsedStock = Number(stock) || 0;
    const parsedCost = Number(costPrice) || 0;
    const parsedSelling = Number(sellingPrice) || 0;
    const parsedAlert = Number(minStockAlert) || 5;

    const [newProduct] = await db
      .insert(products)
      .values({
        name: name.trim(),
        sku: finalSku,
        barcode: barcode?.trim() || null,
        category: category?.trim() || "Général",
        description: description?.trim() || null,
        costPrice: parsedCost,
        sellingPrice: parsedSelling,
        stock: parsedStock,
        minStockAlert: parsedAlert,
        unit: unit || "pcs",
        imageUrl: imageUrl?.trim() || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      })
      .returning();

    // Record stock movement if initial stock > 0
    if (parsedStock > 0) {
      await db.insert(stockMovements).values({
        productId: newProduct.id,
        productName: newProduct.name,
        type: "in",
        quantity: parsedStock,
        previousStock: 0,
        newStock: parsedStock,
        reason: "Stock initial à la création du produit",
        performedBy: performedBy || "Yarwaye",
      });
    }

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("Products POST error:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "Un produit avec cette référence SKU existe déjà." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
