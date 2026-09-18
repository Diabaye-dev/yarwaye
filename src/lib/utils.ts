/* ============================================================================
 *  FICHIER : src/lib/utils.ts
 *  LANGAGE : TypeScript
 *  RÔLE    : Petites fonctions utilitaires réutilisées partout dans l'app.
 *
 *    - formatMoney()  → transforme 17500 en "17 500 FCFA"
 *    - formatDate()   → transforme une date ISO en "18 sept. 2026, 14:30"
 *    - formatDateShort() → version courte "18 sept."
 * ==========================================================================*/

// Met en forme un montant monétaire avec l'espace des milliers + la devise
export function formatMoney(amount: number, currency: string = "FCFA"): string {
  if (isNaN(amount)) return `0 ${currency}`;
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}
