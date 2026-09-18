"use client";
/**
 * TICKET DE CAISSE — src/components/ReceiptModal.tsx
 * 
 * Reçu au format imprimante thermique : en-tête boutique, n° de facture,
 * client, lignes d'articles, totaux, mode de paiement (Wave/OM 767866536) et
 * pied de page. Le bouton "Imprimer" ouvre la boîte d'impression du navigateur
 * (les classes "print:hidden" masquent l'interface pour ne garder que le ticket).
 */
import React, { useRef } from "react";
import { Order, StoreSettings } from "@/types";
import { formatMoney, formatDate } from "@/lib/utils";
import { X, Printer, CheckCircle, Phone } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  settings?: StoreSettings | null;
}

export function ReceiptModal({ isOpen, onClose, order, settings }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const storePhone = settings?.phone || "767866536";
  const storeName = settings?.storeName || "AGRO SERVICE YARWAYE";
  const address = settings?.address || "Malika Qrt Malika / Mer - BP 17000 - Keur Massar, Dakar, Sénégal";
  const currency = settings?.currency || "FCFA";

  // Déclenche l’impression navigateur ; le CSS @media print ne garde que le reçu.
  const handlePrint = () => {
    window.print();
  };

  // Traduit le code technique du paiement en libellé imprimé sur le ticket.
  const getPaymentLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Espèces (Comptoir)";
      case "wave_om_767866536":
        return `Wave / Orange Money (${storePhone})`;
      case "card":
        return "Carte Bancaire / TPE";
      case "credit":
        return "Crédit Client (À régler)";
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 print:m-0 print:border-none print:shadow-none">
        {/* Barre d'actions (masquée à l'impression grâce à print:hidden) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base">Reçu de Caisse</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu du ticket : c'est la seule zone imprimée (classe receipt-print).
            max-h/overflow sont neutralisés à l'impression pour ne pas couper le reçu. */}
        <div
          ref={receiptRef}
          className="receipt-print p-6 bg-white font-mono text-xs text-slate-800 space-y-4 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible"
        >
          {/* En-tête : nom de la boutique, adresse et contact 767866536 */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <h1 className="text-lg font-black tracking-wider uppercase text-slate-900">
              {storeName}
            </h1>
            <p className="text-[11px] text-slate-600 font-sans mt-0.5">{address}</p>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Phone className="w-3.5 h-3.5" />
              <span>Contact / Wave / OM: {storePhone}</span>
            </div>
          </div>

          {/* Bloc d'informations : n° de facture, date, caissier, client */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">N° Facture :</span>
              <span className="font-bold text-slate-800">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Heure :</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Caissier :</span>
              <span>{order.cashierName || "Personnel Yarwaye"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Client :</span>
              <span className="font-medium">{order.customerName}</span>
            </div>
            {order.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500">Tél Client :</span>
                <span>{order.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Détail des articles achetés (nom, PU, quantité, total) */}
          <div>
            <div className="flex justify-between font-bold border-b border-slate-300 pb-1 mb-2 text-[11px]">
              <span className="w-1/2">ARTICLE</span>
              <span className="w-1/4 text-center">QTÉ</span>
              <span className="w-1/4 text-right">TOTAL</span>
            </div>

            <div className="space-y-2">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="w-1/2">
                      <p className="font-medium text-slate-900 leading-snug">{item.productName}</p>
                      <p className="text-[10px] text-slate-500">
                        {formatMoney(item.unitPrice, currency)} / u
                      </p>
                    </div>
                    <div className="w-1/4 text-center text-slate-700 font-semibold">
                      x {item.quantity}
                    </div>
                    <div className="w-1/4 text-right font-bold text-slate-900">
                      {formatMoney(item.total, currency)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-slate-400">Détails articles inclus</div>
              )}
            </div>
          </div>

          {/* Totaux : sous-total, remise, taxes, net à payer */}
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total :</span>
              <span>{formatMoney(order.subtotal, currency)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Remise Yarwaye :</span>
                <span>- {formatMoney(order.discount, currency)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Taxes :</span>
                <span>{formatMoney(order.tax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black border-t-2 border-slate-800 pt-2 text-slate-900">
              <span>NET À PAYER :</span>
              <span>{formatMoney(order.total, currency)}</span>
            </div>
          </div>

          {/* Mode et statut de paiement (Wave/OM, espèces, crédit) */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Mode de paiement :</span>
              <span className="font-bold text-slate-800">{getPaymentLabel(order.paymentMethod)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Statut du règlement :</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle className="w-3.5 h-3.5" />
                {order.paymentStatus === "paid"
                  ? "PAYÉ EN INTÉGRALITÉ"
                  : order.paymentStatus === "pending"
                  ? "EN ATTENTE"
                  : order.paymentStatus === "refunded"
                  ? "REMBOURSÉ"
                  : "INCONNU"}
              </span>
            </div>
          </div>

          {/* Code-barres fantaisie + message de fin paramétrable */}
          <div className="text-center pt-2 border-t border-dashed border-slate-300 space-y-2">
            {/* Faux code-barres purement décoratif */}
            <div className="font-mono tracking-[0.3em] text-xs font-bold text-slate-700 py-1 bg-slate-100 rounded">
              ||||| | |||| ||| ||||||| | {order.orderNumber}
            </div>
            <p className="text-[11px] text-slate-600 italic">
              {settings?.receiptFooter || `Merci de votre achat chez AGRO SERVICE YARWAYE ! Assistance & commandes : ${storePhone}`}
            </p>
          </div>
        </div>

        {/* Pied de la fenêtre (écran uniquement) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> Imprimer le ticket
          </button>
        </div>
      </div>
    </div>
  );
}
