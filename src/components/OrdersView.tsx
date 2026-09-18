"use client";

/* ============================================================================
 *  FICHIER : src/components/OrdersView.tsx
 *  LANGAGE : TypeScript + JSX (React)
 *  RÔLE    : L'écran "Ventes & Commandes" — l'historique de toutes les
 *            transactions enregistrées par Agro Service Yarwaye.
 *
 *  Fonctionnalités :
 *    - Tableau : référence, date, client, mode de paiement, montant, statut
 *    - Filtres par statut (complétée / en cours / annulée) et par paiement
 *    - Détail d'une commande (modale avec la liste des articles)
 *    - Réimpression du ticket de caisse (ReceiptModal)
 *    - Remboursement / annulation → le stock est AUTOMATIQUEMENT réintégré
 *      via handleUpdateStatus() qui appelle PATCH /api/orders/:id
 * ==========================================================================*/

import React, { useState } from "react";
import { Order, StoreSettings } from "@/types";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  FileText,
  Search,
  Printer,
  RotateCcw,
  CheckCircle,
  Clock,
  Ban,
  Phone,
  Eye,
  Trash2,
} from "lucide-react";
import { ReceiptModal } from "./ReceiptModal";

interface OrdersViewProps {
  orders: Order[];
  settings: StoreSettings | null;
  onRefresh: () => void;
  onOrderUpdated: (order: Order) => void;
}

export function OrdersView({ orders, settings, onRefresh, onOrderUpdated }: OrdersViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone && o.customerPhone.includes(search));

    const matchStatus = statusFilter === "all" || o.orderStatus === statusFilter;
    const matchPayment = paymentFilter === "all" || o.paymentMethod === paymentFilter;

    return matchSearch && matchStatus && matchPayment;
  });

  const handleUpdateStatus = async (orderId: number, orderStatus: string, paymentStatus?: string) => {
    setIsUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus, paymentStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        onOrderUpdated(data.order);
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (e) {
      alert("Erreur de mise à jour");
    } finally {
      setIsUpdating(null);
    }
  };

  const currency = settings?.currency || "FCFA";
  const storePhone = settings?.phone || "767866536";

  return (
    <div className="space-y-6">
      <ReceiptModal
        isOpen={Boolean(activeReceiptOrder)}
        onClose={() => setActiveReceiptOrder(null)}
        order={activeReceiptOrder}
        settings={settings}
      />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            Ventes & Historique des Commandes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total {orders.length} transactions enregistrées chez Agro Service Yarwaye (Hotline: {storePhone})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n° facture, nom du client ou téléphone..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:outline-hidden"
          >
            <option value="all">Tous les états</option>
            <option value="completed">Terminée / Livrée</option>
            <option value="processing">En traitement</option>
            <option value="cancelled">Annulée / Remboursée</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:outline-hidden"
          >
            <option value="all">Tous les règlements</option>
            <option value="cash">Espèces</option>
            <option value="wave_om_767866536">Wave / OM ({storePhone})</option>
            <option value="card">Carte bancaire</option>
            <option value="credit">Crédit client</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Réf Vente</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Paiement</th>
                <th className="py-3 px-4 text-right">Montant Total</th>
                <th className="py-3 px-4 text-center">Statut Commande</th>
                <th className="py-3 px-4 text-center">Caissier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => {
                const isPaid = order.paymentStatus === "paid";
                const isCompleted = order.orderStatus === "completed";
                const isCancelled = order.orderStatus === "cancelled";

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{order.customerName}</div>
                      {order.customerPhone && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          {order.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          order.paymentMethod === "wave_om_767866536"
                            ? "bg-teal-100 text-teal-800 border border-teal-200"
                            : order.paymentMethod === "credit"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {order.paymentMethod === "wave_om_767866536"
                          ? `Wave/OM ${storePhone}`
                          : order.paymentMethod === "cash"
                          ? "Espèces"
                          : order.paymentMethod === "credit"
                          ? "Crédit / Tab"
                          : "Carte"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                      {formatMoney(order.total, currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : isCancelled
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : isCancelled ? (
                          <Ban className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {order.orderStatus === "completed"
                          ? "Complétée"
                          : order.orderStatus === "cancelled"
                          ? "Annulée"
                          : "En cours"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 text-[11px]">
                      {order.cashierName || "Yarwaye"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveReceiptOrder(order)}
                          title="Imprimer le ticket de caisse"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          title="Voir le détail des articles"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isCompleted && (
                          <button
                            disabled={isUpdating === order.id}
                            onClick={() => {
                              if (confirm(`Rembourser et annuler la vente ${order.orderNumber} ? Le stock sera réintégré.`)) {
                                handleUpdateStatus(order.id, "cancelled", "refunded");
                              }
                            }}
                            title="Rembourser / Annuler la vente"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Aucune commande trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-base">Commande {selectedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-400 font-mono">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-white/20 rounded-full text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Client :</span>
                  <strong className="text-slate-800">{selectedOrder.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Téléphone :</span>
                  <strong className="text-slate-800">{selectedOrder.customerPhone || "—"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Règlement :</span>
                  <span className="font-semibold text-emerald-700">{selectedOrder.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Caissier :</span>
                  <strong className="text-slate-800">{selectedOrder.cashierName}</strong>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Articles commandés :
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((it, i) => (
                      <div key={i} className="flex justify-between items-center p-3 text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{it.productName}</p>
                          <p className="text-[10px] text-slate-500">
                            {formatMoney(it.unitPrice, currency)} x {it.quantity}
                          </p>
                        </div>
                        <span className="font-bold font-mono text-slate-900">
                          {formatMoney(it.total, currency)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-xs text-slate-400 text-center">Aucun détail article disponible</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total :</span>
                  <span>{formatMoney(selectedOrder.subtotal, currency)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Remise accordée :</span>
                    <span>- {formatMoney(selectedOrder.discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm border-t border-slate-200 pt-2 text-slate-900">
                  <span>Total Réglé :</span>
                  <span>{formatMoney(selectedOrder.total, currency)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => {
                  setActiveReceiptOrder(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimer Ticket
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
