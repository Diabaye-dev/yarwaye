/* ============================================================================
 *  FICHIER : src/app/api/settings/route.ts
 *  LANGAGE : TypeScript — Next.js Route Handler (API REST)
 *  RÔLE    : Paramètres de la boutique AGRO SERVICE YARWAYE.
 *
 *    GET /api/settings → lit les coordonnées (nom, tél 767866536, adresse
 *                        Keur Massar, devise, textes du ticket de caisse)
 *    PUT /api/settings → enregistre les modifications faites dans
 *                        l'écran "Paramètres Boutique"
 * ==========================================================================*/

import { NextResponse } from "next/server";
import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Lecture des paramètres (crée une ligne par défaut si la table est vide)
export async function GET() {
  try {
    const [settings] = await db.select().from(storeSettings).limit(1);
    if (!settings) {
      // Default fallback
      const [newSettings] = await db
        .insert(storeSettings)
        .values({
          storeName: "Agro Service Yarwaye",
          phone: "767866536",
          whatsapp: "767866536",
          email: "contact@agroserviceyarwaye.sn",
          address: "Malika QRT Malika / MER - BP 17000 - Keur Massar, Dakar, Sénégal",
          currency: "FCFA",
          taxRate: 0,
          receiptHeader: "AGRO SERVICE YARWAYE - AGRICULTURE & COMMERCE GÉNÉRAL",
          receiptFooter: "Contact & Wave/OM: 767866536. Merci pour votre achat !",
          waveNumber: "767866536",
          orangeMoneyNumber: "767866536",
        })
        .returning();
      return NextResponse.json({ settings: newSettings });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const [existing] = await db.select().from(storeSettings).limit(1);

    if (existing) {
      const [updated] = await db
        .update(storeSettings)
        .set({
          storeName: body.storeName || existing.storeName,
          phone: body.phone || existing.phone,
          whatsapp: body.whatsapp || existing.whatsapp,
          email: body.email || existing.email,
          address: body.address || existing.address,
          currency: body.currency || existing.currency,
          taxRate: body.taxRate !== undefined ? Number(body.taxRate) : existing.taxRate,
          receiptHeader: body.receiptHeader || existing.receiptHeader,
          receiptFooter: body.receiptFooter || existing.receiptFooter,
          waveNumber: body.waveNumber || existing.waveNumber,
          orangeMoneyNumber: body.orangeMoneyNumber || existing.orangeMoneyNumber,
          updatedAt: new Date(),
        })
        .where(eq(storeSettings.id, existing.id))
        .returning();

      return NextResponse.json({ settings: updated });
    } else {
      const [created] = await db.insert(storeSettings).values(body).returning();
      return NextResponse.json({ settings: created });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
