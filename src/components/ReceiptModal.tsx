"use client";

import React, { useRef } from "react";
/* ============================================================================
 *  FICHIER : src/components/ReceiptModal.tsx
 *  LANGAGE : TypeScript + JSX (React)
 *  RÔLE    : Le TICKET DE CAISSE imprimable (format reçu thermique).
 *            Il s'ouvre après une vente ou depuis l'historique des commandes.
 *
 *  Contenu : en-tête de la boutique (nom + adresse Keur Massar + tél
 *  767866536), numéro de facture, date, caissier, liste des articles,
 *  sous-total, remise, total, mode de paiement, code-barres visuel et
 *  message de remerciement.
 *
 *  handlePrint() appelle window.print() du navigateur ; les classes
 *  "print:hidden" masquent les boutons pour n'imprimer que le reçu.
 * ==========================================================================*/

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
  const storeName = settings?.storeName || "Agro Service Yarwaye";
  const address = settings?.address || "Malika QRT Malika / MER - BP 17000 - Keur Massar, Dakar, Sénégal";
  const currency = settings?.currency || "FCFA";

  const handlePrint = () => {
    window.print();
  };

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
        {/* Actions bar (hidden in print) */}
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

        {/* Thermal Slip Content */}
        <div
          ref={receiptRef}
          className="p-6 bg-white font-mono text-xs text-slate-800 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
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

          {/* Metadata */}
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
              <span>{order.cashierName || "Yarwaye Staff"}</span>
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

          {/* Line Items */}
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

          {/* Totals */}
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

          {/* Payment Details */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Mode de paiement :</span>
              <span className="font-bold text-slate-800">{getPaymentLabel(order.paymentMethod)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Statut du règlement :</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle className="w-3.5 h-3.5" />
                {order.paymentStatus === "paid" ? "PAYÉ EN INTÉGRALITÉ" : order.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Barcode & Footer note */}
          <div className="text-center pt-2 border-t border-dashed border-slate-300 space-y-2">
            {/* Visual barcode mock */}
            <div className="font-mono tracking-[0.3em] text-xs font-bold text-slate-700 py-1 bg-slate-100 rounded">
              ||||| | |||| ||| ||||||| | {order.orderNumber}
            </div>
            <p className="text-[11px] text-slate-600 italic">
              {settings?.receiptFooter || `Merci de votre achat chez Yarwaye ! Hotline & Commandes: ${storePhone}`}
            </p>
          </div>
        </div>

        {/* Modal footer (screen only) */}
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
