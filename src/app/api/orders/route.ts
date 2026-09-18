/* ============================================================================
 *  FICHIER : src/app/api/orders/route.ts
 *  LANGAGE : TypeScript — Next.js Route Handler (API REST)
 *  RÔLE    : Gérer les COMMANDES / VENTES.
 *
 *    GET  /api/orders      → liste des commandes (avec leurs articles)
 *         ?status=completed, ?payment=cash, ?limit=50 (optionnels)
 *
 *    POST /api/orders      → ENREGISTRER UNE NOUVELLE VENTE.
 *         C'est la fonction la plus importante du magasin, elle fait 4 choses :
 *           1. Crée la commande (avec un numéro unique type "ASY-2025-1234")
 *           2. Insère chaque article dans order_items
 *           3. DÉCRÉMENTE le stock des produits vendus
 *           4. Écrit la vente dans le journal des mouvements de stock
 *           5. Met à jour le client (total dépensé + points fidélité + dette)
 * ==========================================================================*/

import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, stockMovements, customers } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

// ──────────────────────── LECTURE : GET /api/orders ────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const payment = searchParams.get("payment");
    const limit = Number(searchParams.get("limit")) || 100;

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(orders.orderStatus, status));
    }
    if (payment && payment !== "all") {
      conditions.push(eq(orders.paymentMethod, payment));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allOrders = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    // Fetch items for these orders
    const allItems = await db.select().from(orderItems);
    const itemsByOrder = new Map<number, typeof allItems>();
    for (const item of allItems) {
      if (!itemsByOrder.has(item.orderId)) {
        itemsByOrder.set(item.orderId, []);
      }
      itemsByOrder.get(item.orderId)!.push(item);
    }

    const populated = allOrders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.id) || [],
    }));

    return NextResponse.json({ orders: populated });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount = 0,
      tax = 0,
      paymentMethod = "cash",
      paymentStatus = "paid",
      cashierName = "Yarwaye Staff",
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one product item" }, { status: 400 });
    }

    const calcSubtotal = items.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0);
    const finalSubtotal = subtotal !== undefined ? Number(subtotal) : calcSubtotal;
    const finalTotal = Math.max(0, finalSubtotal - Number(discount) + Number(tax));

    // Generate unique Yarwaye order number
    const orderNum = `DIA-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;

    const [createdOrder] = await db
      .insert(orders)
      .values({
        orderNumber: orderNum,
        customerId: customerId ? Number(customerId) : null,
        customerName: customerName?.trim() || "Client Comptoir",
        customerPhone: customerPhone?.trim() || "767866536",
        subtotal: finalSubtotal,
        discount: Number(discount),
        tax: Number(tax),
        total: finalTotal,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        orderStatus: "completed",
        cashierName: cashierName,
        notes: notes?.trim() || null,
      })
      .returning();

    // Insert order items and deduct stock
    const insertedItems = [];
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const unitP = Number(item.unitPrice) || 0;
      const costP = Number(item.costPrice) || 0;
      const itemTotal = qty * unitP;

      const [orderItem] = await db
        .insert(orderItems)
        .values({
          orderId: createdOrder.id,
          productId: Number(item.productId),
          productName: item.productName || "Article",
          productSku: item.productSku || null,
          unitPrice: unitP,
          costPrice: costP,
          quantity: qty,
          total: itemTotal,
        })
        .returning();

      insertedItems.push(orderItem);

      // Decrement product stock
      const [prod] = await db
        .select()
        .from(products)
        .where(eq(products.id, Number(item.productId)))
        .limit(1);

      if (prod) {
        const newStock = Math.max(0, prod.stock - qty);
        await db
          .update(products)
          .set({ stock: newStock, updatedAt: new Date() })
          .where(eq(products.id, prod.id));

        // Record stock movement
        await db.insert(stockMovements).values({
          productId: prod.id,
          productName: prod.name,
          type: "sale",
          quantity: -qty,
          previousStock: prod.stock,
          newStock: newStock,
          reason: `Vente ${createdOrder.orderNumber}`,
          performedBy: cashierName,
        });
      }
    }

    // Customer tracking
    if (customerId) {
      const [cust] = await db.select().from(customers).where(eq(customers.id, Number(customerId))).limit(1);
      if (cust) {
        const loyaltyEarned = Math.floor(finalTotal / 1000);
        const creditDelta = paymentMethod === "credit" ? finalTotal : 0;

        await db
          .update(customers)
          .set({
            totalSpent: cust.totalSpent + finalTotal,
            loyaltyPoints: cust.loyaltyPoints + loyaltyEarned,
            creditBalance: cust.creditBalance + creditDelta,
          })
          .where(eq(customers.id, cust.id));
      }
    }

    return NextResponse.json(
      {
        order: {
          ...createdOrder,
          items: insertedItems,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
