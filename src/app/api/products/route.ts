/**
 * ROUTE /api/products — catalogue (lecture + création)
 * 
 * GET  : liste les produits avec filtres optionnels
 *        ?search= (nom/SKU/code-barres), ?category=, ?filter=low_stock|active
 * POST : crée un produit ; si un stock initial est saisi, un mouvement de
 *        stock "in" est enregistré pour garder une trace d'audit.
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { ilike, or, eq, desc, and, lte } from "drizzle-orm";

// Les routes touchent la base : on interdit toute pré-génération au build
// (sinon Next.js exécuterait le handler pendant "Collecting page data").
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const filter = searchParams.get("filter") || ""; // 'low_stock', 'active', 'all'

    // Filtres optionnels cumulables : recherche texte, catégorie, niveau de stock.
    let conditions = [];

    // Recherche large : nom, SKU, code-barres, catégorie, description.
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

    // Raccourci « alerte stock » : stock <= seuil d’alerte du produit.
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
    return NextResponse.json({ error: "Impossible de récupérer les produits" }, { status: 500 });
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
      return NextResponse.json({ error: "Le nom et le prix de vente sont obligatoires" }, { status: 400 });
    }

    // Si la référence est laissee vide, on en génère une (YAR-<timestamp>).
    const finalSku = sku?.trim() || `YAR-${Date.now().toString().slice(-6)}`;
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

    // Un stock initial > 0 est considéré comme une entrée de stock tracée.
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
    // 23505 = contrainte d’unicité SQL : le SKU existe déjà.
    if (error.code === "23505") {
      return NextResponse.json({ error: "Un produit avec cette référence SKU existe déjà." }, { status: 400 });
    }
    return NextResponse.json({ error: "Impossible de créer le produit" }, { status: 500 });
  }
}
