/**
 * ROUTE /api/customers/[id] — fiche client unitaire
 * 
 * GET   : client + historique de ses commandes (utile au compte client).
 * PUT   : met à jour la fiche (dont le solde du carnet de crédit).
 * DELETE : supprimé le client du répertoire.
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = Number(id);

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({ customer, orders: customerOrders });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de récupérer le client" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = Number(id);
    const body = await req.json();

    const { name, phone, email, address, creditBalance, notes } = body;

    const [updated] = await db
      .update(customers)
      .set({
        name: name !== undefined ? name.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        email: email !== undefined ? (email?.trim() || null) : undefined,
        address: address !== undefined ? (address?.trim() || null) : undefined,
        creditBalance: creditBalance !== undefined ? Number(creditBalance) : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
      })
      .where(eq(customers.id, customerId))
      .returning();

    return NextResponse.json({ customer: updated });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de mettre à jour le client" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = Number(id);

    await db.delete(customers).where(eq(customers.id, customerId));
    return NextResponse.json({ success: true, message: "Client supprimé" });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de supprimer le client" }, { status: 500 });
  }
}
