"use client";

/* ============================================================================
 *  FICHIER : src/components/CustomersView.tsx
 *  LANGAGE : TypeScript + JSX (React)
 *  RÔLE    : L'écran "Clients & Crédit" — répertoire des clients et gestion
 *            du CARNET DE CRÉDIT (les dettes des clients envers la boutique).
 *
 *  Fonctionnalités :
 *    - Fiches clients : téléphone, email, adresse, total dépensé, points
 *      de fidélité et montant de la dette éventuelle
 *    - Recherche multicritère + filtre "Débiteurs uniquement"
 *    - Création / modification / suppression (CustomerModal)
 *    - Bouton WhatsApp (ouvre une discussion pré-remplie)
 *    - Modale "Encaisser" : enregistre un remboursement partiel ou total
 *      de la dette (handleRepayDebt → PUT /api/customers/:id)
 * ==========================================================================*/

import React, { useState } from "react";
import { Customer, StoreSettings } from "@/types";
import { formatMoney } from "@/lib/utils";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Award,
  DollarSign,
  MessageCircle,
  Edit2,
  Trash2,
} from "lucide-react";
import { CustomerModal } from "./CustomerModal";

interface CustomersViewProps {
  customers: Customer[];
  settings: StoreSettings | null;
  onRefresh: () => void;
  onCustomerDeleted: (id: number) => void;
}

export function CustomersView({ customers, settings, onRefresh, onCustomerDeleted }: CustomersViewProps) {
  const [search, setSearch] = useState("");
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [repayModalCustomer, setRepayModalCustomer] = useState<Customer | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()));

    const matchDebt = !filterDebtOnly || c.creditBalance > 0;
    return matchSearch && matchDebt;
  });

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer la fiche client de "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        onCustomerDeleted(id);
      }
    } catch (e) {
      alert("Erreur de suppression");
    }
  };

  const handleRepayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModalCustomer || repayAmount <= 0) return;

    setIsSubmittingRepay(true);
    try {
      const newBalance = Math.max(0, repayModalCustomer.creditBalance - repayAmount);
      const res = await fetch(`/api/customers/${repayModalCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditBalance: newBalance,
          notes: `${repayModalCustomer.notes || ""}\n[Remboursement de ${repayAmount} FCFA le ${new Date().toLocaleDateString()}]`.trim(),
        }),
      });

      if (res.ok) {
        onRefresh();
        setRepayModalCustomer(null);
        setRepayAmount(0);
      }
    } catch (e) {
      alert("Erreur lors de l'encaissement de la dette");
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  const currency = settings?.currency || "FCFA";
  const totalDebt = customers.reduce((sum, c) => sum + c.creditBalance, 0);

  return (
    <div className="space-y-6">
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
        onSaved={() => {
          onRefresh();
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
      />

      {/* Debt repayment modal */}
      {repayModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-700 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Règlement Carnet de Crédit</h3>
              <button
                onClick={() => setRepayModalCustomer(null)}
                className="p-1 hover:bg-white/20 rounded-full"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRepayDebt} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Client :</p>
                <p className="font-bold text-sm text-slate-800">{repayModalCustomer.name}</p>
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  Dette restante : {formatMoney(repayModalCustomer.creditBalance, currency)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant versé aujourd'hui ({currency})
                </label>
                <input
                  type="number"
                  min="100"
                  max={repayModalCustomer.creditBalance}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRepayModalCustomer(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRepay || repayAmount <= 0}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  {isSubmittingRepay ? "Traitement..." : "Encaisser le versement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Répertoire Clients & Carnet de Crédit Yarwaye
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {customers.length} clients enregistrés • Total créances clients :{" "}
            <strong className="text-rose-600 font-bold">{formatMoney(totalDebt, currency)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Nouveau Client
          </button>
        </div>
      </div>

      {/* Search & Debt Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone (ex: 767866536), adresse..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <button
          onClick={() => setFilterDebtOnly(!filterDebtOnly)}
          className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            filterDebtOnly
              ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-200"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Filtrer Débiteurs uniquement ({customers.filter((c) => c.creditBalance > 0).length})
        </button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const hasDebt = customer.creditBalance > 0;
          const cleanPhone = customer.phone.replace(/\D/g, "");

          return (
            <div
              key={customer.id}
              className={`p-5 rounded-2xl bg-white border transition-all ${
                hasDebt
                  ? "border-rose-200 shadow-xs hover:border-rose-400"
                  : "border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-400"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{customer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-medium text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {customer.phone}
                    </span>
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone.startsWith("221") ? cleanPhone : "221" + cleanPhone}?text=Bonjour%20${encodeURIComponent(customer.name)}%2C%20de%20la%20part%20de%20Boutique%20Yarwaye`}
                        target="_blank"
                        rel="noreferrer"
                        title="Envoyer message WhatsApp"
                        className="text-teal-600 hover:text-teal-700 p-0.5 rounded"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCustomer(customer);
                      setIsModalOpen(true);
                    }}
                    title="Modifier"
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id, customer.name)}
                    title="Supprimer"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {customer.address && (
                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                  <span className="truncate">{customer.address}</span>
                </p>
              )}

              {/* Stats Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Dépensé</span>
                  <span className="font-extrabold text-slate-800">
                    {formatMoney(customer.totalSpent, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-500" /> Points Fidélité
                  </span>
                  <span className="font-bold text-amber-600">
                    {customer.loyaltyPoints} pts
                  </span>
                </div>
              </div>

              {/* Debt Box */}
              {hasDebt ? (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">Crédit à Recouvrer</span>
                    <span className="text-sm font-black text-rose-700">
                      {formatMoney(customer.creditBalance, currency)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setRepayModalCustomer(customer);
                      setRepayAmount(customer.creditBalance);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
                  >
                    Encaisser
                  </button>
                </div>
              ) : (
                <div className="mt-3 p-2 rounded-xl bg-slate-50 text-[11px] text-slate-500 text-center">
                  Aucune dette en cours • Compte à jour
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm">Aucun client correspondant à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
