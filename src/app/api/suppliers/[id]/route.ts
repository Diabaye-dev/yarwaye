/**
 * ROUTE /api/suppliers/[id] — fournisseur unitaire (lecture / édition / suppression)
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
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
    const supplierId = Number(id);

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    if (!supplier) {
      return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ supplier });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de récupérer le fournisseur" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplierId = Number(id);
    const body = await req.json();

    const { name, contactPerson, phone, email, address, categories, notes } = body;

    const [updated] = await db
      .update(suppliers)
      .set({
        name: name !== undefined ? name.trim() : undefined,
        contactPerson: contactPerson !== undefined ? (contactPerson?.trim() || null) : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        email: email !== undefined ? (email?.trim() || null) : undefined,
        address: address !== undefined ? (address?.trim() || null) : undefined,
        categories: categories !== undefined ? (categories?.trim() || null) : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
      })
      .where(eq(suppliers.id, supplierId))
      .returning();

    return NextResponse.json({ supplier: updated });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de mettre à jour le fournisseur" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplierId = Number(id);

    await db.delete(suppliers).where(eq(suppliers.id, supplierId));
    return NextResponse.json({ success: true, message: "Fournisseur supprimé" });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de supprimer le fournisseur" }, { status: 500 });
  }
}
