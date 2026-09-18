/**
 * FONCTIONS UTILITAIRES — src/lib/utils.ts
 * 
 * formatMoney() : affiche un montant avec le séparateur de milliers français
 *                 et la devise de la boutique (FCFA par défaut).
 * formatDate()  : date longue avec heure (ex: 18 sept. 2026, 14:05).
 * formatDateShort() : version compacte (jour + mois).
 */
/** Formate un montant a la francaise : 12 500 FCFA (protection NaN). */
export function formatMoney(amount: number, currency: string = "FCFA"): string {
  if (isNaN(amount)) return `0 ${currency}`;
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

/** Date longue + heure : tableaux, recus, historique. */
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

/** Version courte (jour + mois) pour les espaces reduits. */
export function formatDateShort(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}
