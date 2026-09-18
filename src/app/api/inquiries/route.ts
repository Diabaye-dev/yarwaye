/**
 * ROUTE /api/inquiries — demandes de la vitrine client
 * 
 * Reçoit les demandes de devis / réservation / chantier envoyées par un
 * visiteur. La demande est enregistrée dans la fiche client (nouvelle ou
 * existante) sous forme de note horodatée : le gérant la retrouve ensuite
 * dans l'onglet "Clients & crédit".
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

// Les routes touchent la base : on interdit toute pré-génération au build
// (sinon Next.js exécuterait le handler pendant "Collecting page data").
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, subject, message, type } = body;

    if (!name?.trim() || !phone?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Le nom, le téléphone et le message sont obligatoires" },
        { status: 400 }
      );
    }

    // On rattache la demande à une fiche client (existante ou créée) pour relance.
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone.trim()))
      .limit(1);

    let customerId: number | null = null;

    // Client déjà connu : on ajoute la demande à ses notes, datées.
    if (existing.length > 0) {
      customerId = existing[0].id;
      const noteLine = `[Demande vitrine ${new Date().toLocaleDateString("fr-FR")}] ${subject || type || "Contact"}: ${message.trim()}`;
      await db
        .update(customers)
        .set({
          name: name.trim() || existing[0].name,
          email: email?.trim() || existing[0].email,
          notes: existing[0].notes ? `${existing[0].notes}\n${noteLine}` : noteLine,
        })
        .where(eq(customers.id, existing[0].id));
    } else {
      const [created] = await db
        .insert(customers)
        .values({
          name: name.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
          notes: `[Demande vitrine] ${subject || type || "Contact"}: ${message.trim()}`,
        })
        .returning();
      customerId = created.id;
    }

    return NextResponse.json({
      success: true,
      customerId,
      message:
        "Votre demande a bien été enregistrée. AGRO SERVICE YARWAYE vous recontactera au plus vite sur 767866536.",
    });
  } catch (error) {
    console.error("Inquiry error:", error);
    return NextResponse.json({ error: "Impossible d'enregistrer la demande" }, { status: 500 });
  }
}
