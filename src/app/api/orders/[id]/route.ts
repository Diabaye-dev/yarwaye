/**
 * ROUTE /api/orders/[id] — détail d'une vente
 * 
 * GET    : commande + ses lignes (pour la fiche détaillée / le reçu).
 * PATCH  : change le statut (annulation, remboursement, mise en attente).
 *          Si l'on annule une vente terminée, le stock est RÉINTÉGRÉ
 *          automatiquement et le mouvement est tracé dans stock_movements.
 * DELETE : supprimé la commande et ses lignes.
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, stockMovements } from "@/db/schema";
import { eq } from "drizzle-orm";

// Les routes touchent la base : on interdit toute pré-génération au build
// (sinon Next.js exécuterait le handler pendant "Collecting page data").
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return NextResponse.json({ order: { ...order, items } });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de récupérer la commande" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    const body = await req.json();
    const { orderStatus, paymentStatus, notes } = body;

    const [existing] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Annulation d’une vente terminée -> on RÉINTÈGRE le stock article par article.
    if (
      (orderStatus === "cancelled" || paymentStatus === "refunded") &&
      existing.orderStatus === "completed" &&
      existing.paymentStatus !== "refunded"
    ) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const item of items) {
        const [prod] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (prod) {
          const restoredStock = prod.stock + item.quantity;
          await db.update(products).set({ stock: restoredStock }).where(eq(products.id, prod.id));
          await db.insert(stockMovements).values({
            productId: prod.id,
            productName: prod.name,
            type: "in",
            quantity: item.quantity,
            previousStock: prod.stock,
            newStock: restoredStock,
            reason: `Annulation/Remboursement commande ${existing.orderNumber}`,
            performedBy: "Système Yarwaye",
          });
        }
      }
    }

    const updateData: any = {};
    if (orderStatus !== undefined) updateData.orderStatus = orderStatus;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (notes !== undefined) updateData.notes = notes;

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    return NextResponse.json({ order: { ...updated, items } });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de mettre à jour la commande" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await db.delete(orders).where(eq(orders.id, orderId));

    return NextResponse.json({ success: true, message: "Commande supprimée" });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de supprimer la commande" }, { status: 500 });
  }
}
