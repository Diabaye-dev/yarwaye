"use client";
/**
 * VUE "Marges & rapports" — src/components/AnalyticsView.tsx
 * 
 * Appelle /api/analytics au montage, affiche un état de chargement, puis
 * présente : cartes KPI, répartition des encaissements (espèces / Wave-OM),
 * top 5 meilleures ventes et journal d'audit des mouvements de stock.
 */
import React, { useState, useEffect } from "react";
import { StoreSettings, StockMovement } from "@/types";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  Smartphone,
  Banknote,
  ArrowUpRight,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  todayRevenue: number;
  ordersCount: number;
  todayOrdersCount: number;
  estimatedGrossProfit: number;
  inventoryValueCost: number;
  inventoryValueRetail: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalCreditOwed: number;
  paymentBreakdown: Record<string, { count: number; total: number }>;
  topSelling: Array<{ name: string; quantity: number; revenue: number }>;
  categoryCounts: Record<string, number>;
  recentMovements: StockMovement[];
}

export function AnalyticsView({ settings }: { settings: StoreSettings | null }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const currency = settings?.currency || "FCFA";
  const storePhone = settings?.phone || "767866536";

  if (isLoading || !data) {
    return (
      <div className="py-24 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
        <p className="text-xs">Chargement des indicateurs financiers Yarwaye...</p>
      </div>
    );
  }

  const potentialMargin = data.inventoryValueRetail - data.inventoryValueCost;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Statistiques & Performance Financière
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            AGRO SERVICE YARWAYE • Indicateurs de rentabilité, trésorerie et flux de stocks
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser les métriques
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl text-white shadow-md">
          <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold">
            <span>Chiffre d'Affaires Global</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black mt-2">{formatMoney(data.totalRevenue, currency)}</div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-100/90 pt-2 border-t border-white/10">
            <span>Aujourd'hui : {formatMoney(data.todayRevenue, currency)}</span>
            <span>{data.ordersCount} ventes</span>
          </div>
        </div>

        {/* Estimated Gross Margin */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Marge Brute Réalisée</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatMoney(data.estimatedGrossProfit, currency)}
          </div>
          <div className="mt-3 text-[11px] text-emerald-700 font-semibold pt-2 border-t border-slate-100">
            Rentabilité saine sur articles vendus
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Valeur Marchande du Stock</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatMoney(data.inventoryValueRetail, currency)}
          </div>
          <div className="mt-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Coût d'achat: {formatMoney(data.inventoryValueCost, currency)}
          </div>
        </div>

        {/* Outstanding Debts / Carnet */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Créances Clients (Dettes)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatMoney(data.totalCreditOwed, currency)}
          </div>
          <div className="mt-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            À recouvrer auprès des clients
          </div>
        </div>
      </div>

      {/* Middle Grid: Payment Methods & Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-teal-600" />
            Modes de Paiement Encaissés
          </h2>
          <p className="text-xs text-slate-500">
            Répartition des encaissements comptoir et mobile money sur {storePhone}
          </p>

          <div className="space-y-3 pt-2">
            {/* Wave / OM */}
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
              <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  Wave / Orange Money ({storePhone})
                </span>
                <span>{formatMoney(data.paymentBreakdown?.wave_om_767866536?.total || 0, currency)}</span>
              </div>
              <p className="text-[11px] text-teal-700 mt-1">
                {data.paymentBreakdown?.wave_om_767866536?.count || 0} règlements instantanés
              </p>
            </div>

            {/* Cash */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  Espèces en Caisse (Cash)
                </span>
                <span>{formatMoney(data.paymentBreakdown?.cash?.total || 0, currency)}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {data.paymentBreakdown?.cash?.count || 0} paiements billets/pièces
              </p>
            </div>

            {/* Card & Credit */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Carte Bancaire / TPE</span>
                <span className="font-bold text-slate-800">
                  {formatMoney(data.paymentBreakdown?.card?.total || 0, currency)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Carnet Crédit Accordé</span>
                <span className="font-bold text-slate-800">
                  {formatMoney(data.paymentBreakdown?.credit?.total || 0, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Best Sellers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            Top 5 des Meilleures Ventes
          </h2>
          <p className="text-xs text-slate-500">
            Articles les plus demandés et générateurs de flux
          </p>

          <div className="divide-y divide-slate-100">
            {data.topSelling && data.topSelling.length > 0 ? (
              data.topSelling.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.quantity} unités vendues</p>
                    </div>
                  </div>
                  <span className="font-bold font-mono text-emerald-700">
                    {formatMoney(item.revenue, currency)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400 text-xs">Aucune vente enregistrée pour le moment</p>
            )}
          </div>
        </div>
      </div>

      {/* Stock movements audit */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-slate-700" />
          Journal d'Audit des Mouvements de Stock
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Produit</th>
                <th className="py-2.5 px-3 text-center">Type</th>
                <th className="py-2.5 px-3 text-center">Variation</th>
                <th className="py-2.5 px-3 text-center">Nouveau Stock</th>
                <th className="py-2.5 px-3">Motif & Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentMovements && data.recentMovements.length > 0 ? (
                data.recentMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{m.productName}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          m.type === "in"
                            ? "bg-emerald-100 text-emerald-800"
                            : m.type === "sale"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {m.type === "in" ? "Entrée" : m.type === "sale" ? "Vente" : "Ajustement"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold font-mono">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-700 font-mono">
                      {m.newStock}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      <span>{m.reason}</span> • <span className="font-medium text-slate-700">{m.performedBy}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    Aucun mouvement récent
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
