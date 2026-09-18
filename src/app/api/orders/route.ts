/**
 * ROUTE /api/orders — ventes / tickets de caisse
 * 
 * GET  : liste les commandes avec filtres ?status=, ?payment=, ?search=,
 *        ?phone= ; chaque commande est enrichie de ses lignes (items).
 * POST : encaisse une vente :
 *          1. calcule sous-total / remise / total,
 *          2. génère une référence unique (YAR-XX...),
 *          3. insère les lignes, déduit le stock de chaque produit,
 *          4. journalise un mouvement de stock "sale",
 *          5. met à jour le client (dépense totale, points fidélité, dette).
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, stockMovements, customers } from "@/db/schema";
import { desc, eq, and, or, ilike } from "drizzle-orm";

// Les routes touchent la base : on interdit toute pré-génération au build
// (sinon Next.js exécuterait le handler pendant "Collecting page data").
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const payment = searchParams.get("payment");
    const search = searchParams.get("search");
    const phone = searchParams.get("phone");
    const limit = Number(searchParams.get("limit")) || 100;

    // On construit dynamiquement la clause WHERE selon les filtres reçus.
    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(orders.orderStatus, status));
    }
    if (payment && payment !== "all") {
      conditions.push(eq(orders.paymentMethod, payment));
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(orders.orderNumber, q),
          ilike(orders.customerName, q),
          ilike(orders.customerPhone, q)
        )
      );
    }
    if (phone && phone.trim()) {
      conditions.push(ilike(orders.customerPhone, `%${phone.trim()}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allOrders = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    // On regroupe les lignes par commande dans une Map (évite N requêtes).
    const allItems = await db.select().from(orderItems);
    const itemsByOrder = new Map<number, typeof allItems>();
    for (const item of allItems) {
      if (!itemsByOrder.has(item.orderId)) {
        itemsByOrder.set(item.orderId, []);
      }
      itemsByOrder.get(item.orderId)!.push(item);
    }

    // Chaque commande est renvoyee avec ses items : utile au reçu et au détail.
    const populated = allOrders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.id) || [],
    }));

    return NextResponse.json({ orders: populated });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Impossible de récupérer les commandes" }, { status: 500 });
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
      cashierName = "Personnel Yarwaye",
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "La commande doit contenir au moins un article" }, { status: 400 });
    }

    // Sous-total recalculé côté serveur (le client ne peut pas falsifier les prix).
    const calcSubtotal = items.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0);
    const finalSubtotal = subtotal !== undefined ? Number(subtotal) : calcSubtotal;
    const finalTotal = Math.max(0, finalSubtotal - Number(discount) + Number(tax)); // remise + taxes

    // Reference unique du ticket, ex : YAR-26 4731.
    const orderNum = `YAR-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;

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

    // 1) insérer les lignes, 2) décrémenter le stock, 3) journaliser le mouvement.
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

      // On relit le produit pour connaître son stock AVANT la vente.
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

        // Trace d audit : -1 quantité, motif "Vente YAR-XXXX".
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

    // Fidele : +1 point par 1 000 FCFA et, si paiement a crédit, la dette augmente.
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
    return NextResponse.json({ error: "Impossible de créer la commande" }, { status: 500 });
  }
}
