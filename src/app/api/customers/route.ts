/**
 * ROUTE /api/customers — clients
 * 
 * GET  : liste + recherche ?search= (nom, téléphone, e-mail, adresse).
 * POST : crée une fiche client (nom et téléphone obligatoires).
 * Sert aussi à enregistrer les demandes envoyées depuis la vitrine client.
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
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
        .from(customers)
        .where(
          or(
            ilike(customers.name, q),
            ilike(customers.phone, q),
            ilike(customers.email, q),
            ilike(customers.address, q)
          )
        )
        .orderBy(desc(customers.createdAt));
    } else {
      items = await db.select().from(customers).orderBy(desc(customers.createdAt));
    }

    return NextResponse.json({ customers: items });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de récupérer les clients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, address, creditBalance = 0, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Le nom et le numéro de téléphone sont obligatoires" }, { status: 400 });
    }

    const [customer] = await db
      .insert(customers)
      .values({
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        creditBalance: Number(creditBalance) || 0,
        notes: notes?.trim() || null,
      })
      .returning();

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de créer le client" }, { status: 500 });
  }
}
