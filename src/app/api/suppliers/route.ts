/**
 * ROUTE /api/suppliers — fournisseurs / approvisionnement
 * 
 * GET  : liste + recherche (nom, contact, téléphone, marchandises).
 * POST : crée un fournisseur (nom + téléphone obligatoires).
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { desc, ilike, or } from "drizzle-orm";

// Les routes touchent la base : on interdit toute pré-génération au build
// (sinon Next.js exécuterait le handler pendant "Collecting page data").
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let items;
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      items = await db
        .select()
        .from(suppliers)
        .where(
          or(
            ilike(suppliers.name, q),
            ilike(suppliers.contactPerson, q),
            ilike(suppliers.phone, q),
            ilike(suppliers.categories, q)
          )
        )
        .orderBy(desc(suppliers.createdAt));
    } else {
      items = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
    }

    return NextResponse.json({ suppliers: items });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de récupérer les fournisseurs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, contactPerson, phone, email, address, categories, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Le nom du fournisseur et le téléphone sont obligatoires" }, { status: 400 });
    }

    const [supplier] = await db
      .insert(suppliers)
      .values({
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        categories: categories?.trim() || null,
        notes: notes?.trim() || null,
      })
      .returning();

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de créer le fournisseur" }, { status: 500 });
  }
}
