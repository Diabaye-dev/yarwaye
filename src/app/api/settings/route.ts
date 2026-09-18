/**
 * ROUTE /api/settings — paramètres de la boutique
 * 
 * GET : renvoie la ligne unique de configuration (nom, 767866536, Wave/OM,
 *       adresse de Malika/Keur Massar, mentions du reçu...). Si elle manque,
 *       elle est créée avec des valeurs par défaut.
 * PUT : sauvegarde les modifications saisies dans l'écran "Paramètres".
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Les routes touchent la base : on interdit toute pré-génération au build
// (sinon Next.js exécuterait le handler pendant "Collecting page data").
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [settings] = await db.select().from(storeSettings).limit(1);
    if (!settings) {
      // Première ouverture : on crée la ligne de configuration par défaut.
      const [newSettings] = await db
        .insert(storeSettings)
        .values({
          storeName: "AGRO SERVICE YARWAYE",
          phone: "767866536",
          whatsapp: "767866536",
          email: "contact@yarwaye.sn",
          address: "Malika Qrt Malika / Mer - BP 17000 - Keur Massar, Dakar, Sénégal",
          currency: "FCFA",
          taxRate: 0,
          receiptHeader: "AGRO SERVICE YARWAYE",
          receiptFooter:
            "Agriculture • Transformation • Commerce • BTP • Pâtisserie • Restauration. Assistance Wave/OM: 767866536. Merci de votre confiance !",
          waveNumber: "767866536",
          orangeMoneyNumber: "767866536",
        })
        .returning();
      return NextResponse.json({ settings: newSettings });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de récupérer les paramètres" }, { status: 500 });
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
    return NextResponse.json({ error: "Impossible de mettre à jour les paramètres" }, { status: 500 });
  }
}
