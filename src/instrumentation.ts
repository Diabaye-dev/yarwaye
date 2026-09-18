/**
   POINT D'ENTRÉE SERVEUR — src/instrumentation.ts
   ------------------------------------------------------------
   Fonction prévue par Next.js : register() est exécutée UNE FOIS au
   démarrage de chaque instance du serveur (avant la première requête).

   On s'en sert pour préparer la base automatiquement :
   - création des tables et des index si absents (CREATE TABLE IF NOT EXISTS),
   - insertion des données de démonstration si la boutique est vide.

   Résultat : sur un hébergeur gratuit, aucun terminal et aucune commande
   `drizzle-kit push` n'est nécessaire — le site s'initialise tout seul.

   Le try/catch est volontaire : si la base est momentanément indisponible
   (Neon qui se réveille, variable absente pendant un build), on n'empêche
   pas l'application de démarrer ; /api/health retentera l'initialisation.
*/
export async function register() {
  // Uniquement côté serveur Node (jamais pendant le build statique ni au bord
  // du navigateur).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { bootstrapDatabase } = await import("@/db/migrate");
    const rapport = await bootstrapDatabase();
    console.log("[yarwaye] base prête ->", rapport.tables, "| produits:", rapport.produits);
  } catch (err: any) {
    console.warn("[yarwaye] initialisation reportée :", err?.message ?? err);
  }
}
