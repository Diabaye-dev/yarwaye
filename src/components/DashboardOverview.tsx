"use client";

import React, { useState } from "react";
/* ============================================================================
 *  FICHIER : src/components/DashboardOverview.tsx
 *  LANGAGE : TypeScript + JSX (React)
 *  RÔLE    : Le TABLEAU DE BORD principal (onglet "Tableau de Bord").
 *
 *  Il présente en un coup d'œil :
 *    - Le bandeau d'accueil avec la hotline 767866536
 *    - 4 cartes d'indicateurs : ventes du jour, chiffre d'affaires global,
 *      alertes de stock bas, dettes clients (carnet de crédit)
 *    - 4 raccourcis d'actions rapides (POS, + Produit, + Client, Rapports)
 *    - La liste des dernières ventes avec bouton d'impression de ticket
 *    - Les alertes de réassort et la carte de contact de la boutique
 * ==========================================================================*/

import { Product, Order, Customer, StoreSettings } from "@/types";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Phone,
  Printer,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ReceiptModal } from "./ReceiptModal";

interface DashboardOverviewProps {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  settings: StoreSettings | null;
  onNavigate: (tab: string) => void;
  onOpenNewProduct: () => void;
  onOpenNewCustomer: () => void;
}

export function DashboardOverview({
  products,
  orders,
  customers,
  settings,
  onNavigate,
  onOpenNewProduct,
  onOpenNewCustomer,
}: DashboardOverviewProps) {
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  const currency = settings?.currency || "FCFA";
  const storePhone = settings?.phone || "767866536";

  // Calculations
  const completedOrders = orders.filter((o) => o.orderStatus === "completed");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = completedOrders.filter((o) => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const lowStockProducts = products.filter((p) => p.stock <= p.minStockAlert);
  const totalDebt = customers.reduce((sum, c) => sum + c.creditBalance, 0);

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-6">
      <ReceiptModal
        isOpen={Boolean(activeReceiptOrder)}
        onClose={() => setActiveReceiptOrder(null)}
        order={activeReceiptOrder}
        settings={settings}
      />

      {/* Hotline Announcement Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <Phone className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg">Agro Service Yarwaye</span>
              <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Actif
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Ligne directe, Wave & Orange Money :{" "}
              <strong className="text-white underline font-mono text-sm">{storePhone}</strong> • Marché Central Yarwaye
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => onNavigate("pos")}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            <ShoppingCart className="w-4 h-4" /> Point de Vente / POS
          </button>
          <button
            onClick={() => onNavigate("storefront")}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all whitespace-nowrap"
          >
            🌐 Vue Client
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Ventes du Jour</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatMoney(todayRevenue, currency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{todayOrders.length} transaction(s) aujourd'hui</span>
            <span className="text-emerald-700 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Direct
            </span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Chiffre d'Affaires Global</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatMoney(totalRevenue, currency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{completedOrders.length} commandes validées</span>
            <span className="font-mono text-blue-700 font-semibold">Agro Service Yarwaye</span>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => onNavigate("products")}
          className={`p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer ${
            lowStockProducts.length > 0
              ? "bg-amber-50/60 border-amber-200"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={lowStockProducts.length > 0 ? "text-amber-800" : "text-slate-500"}>
              Alerte Stocks Critiques
            </span>
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-black mt-2 ${lowStockProducts.length > 0 ? "text-amber-900" : "text-slate-900"}`}>
            {lowStockProducts.length} article(s)
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-medium flex items-center justify-between">
            <span>Seuil minimum atteint</span>
            <span className="underline">Gérer &gt;</span>
          </div>
        </div>

        {/* Carnet de Crédit / Outstanding Debts */}
        <div
          onClick={() => onNavigate("customers")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Dettes Clients (Carnet)</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatMoney(totalDebt, currency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{customers.filter((c) => c.creditBalance > 0).length} client(s) redevable(s)</span>
            <span className="text-rose-600 underline font-semibold">Recouvrer &gt;</span>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate("pos")}
          className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-xs text-left transition-all group flex items-center gap-3"
        >
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">Nouveau Ticket POS</div>
            <div className="text-[10px] text-slate-400">Encaisser vente</div>
          </div>
        </button>

        <button
          onClick={onOpenNewProduct}
          className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-xs text-left transition-all group flex items-center gap-3"
        >
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">+ Ajouter Produit</div>
            <div className="text-[10px] text-slate-400">Nouvel arrivage</div>
          </div>
        </button>

        <button
          onClick={onOpenNewCustomer}
          className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-xs text-left transition-all group flex items-center gap-3"
        >
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">+ Nouveau Client</div>
            <div className="text-[10px] text-slate-400">Fiche & carnet</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate("analytics")}
          className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-xs text-left transition-all group flex items-center gap-3"
        >
          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">Rapports & Marges</div>
            <div className="text-[10px] text-slate-400">Bilan financier</div>
          </div>
        </button>
      </div>

      {/* Main Content Grid: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Dernières Ventes Enregistrées
            </h2>
            <button
              onClick={() => onNavigate("orders")}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Toutes les ventes <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentOrders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold flex items-center justify-center text-xs">
                    #
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{order.orderNumber}</span>
                      <span className="text-[10px] font-normal text-slate-500">• {order.customerName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatDate(order.createdAt)} • {order.paymentMethod === "wave_om_767866536" ? `Wave/OM ${storePhone}` : order.paymentMethod}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold font-mono text-sm text-slate-900">
                    {formatMoney(order.total, currency)}
                  </span>
                  <button
                    onClick={() => setActiveReceiptOrder(order)}
                    title="Imprimer le ticket"
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {recentOrders.length === 0 && (
              <p className="py-8 text-center text-slate-400 text-xs">Aucune vente pour le moment.</p>
            )}
          </div>
        </div>

        {/* Low stock notifications & Quick store contact (1 col) */}
        <div className="space-y-6">
          {/* Low stock card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Alertes Réassort
              </h2>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {lowStockProducts.length}
              </span>
            </div>

            <div className="space-y-2">
              {lowStockProducts.slice(0, 4).map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between text-xs">
                  <div className="pr-2 truncate">
                    <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-amber-800">
                      Reste : <strong className="font-bold">{p.stock} {p.unit}</strong> (Seuil: {p.minStockAlert})
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate("products")}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shrink-0"
                  >
                    + Stock
                  </button>
                </div>
              ))}

              {lowStockProducts.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  ✨ Tous les niveaux de stocks sont optimaux !
                </div>
              )}
            </div>
          </div>

          {/* Quick Contact & Merchant Info */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-md space-y-3">
            <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider">
              Coordonnées Agro Service Yarwaye
            </h3>
            <p className="text-xs text-slate-300">
              Hotline, WhatsApp & encaissements Wave / Orange Money sur le numéro officiel :
            </p>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <span className="block text-[10px] text-emerald-300 uppercase tracking-widest font-bold">Ligne Officielle</span>
              <a href={`tel:${storePhone}`} className="text-xl font-black tracking-wider font-mono text-white hover:text-emerald-300 transition-colors">
                {storePhone}
              </a>
            </div>
            <div className="flex gap-2 pt-1">
              <a
                href={`tel:${storePhone}`}
                className="flex-1 py-1.5 text-center text-xs font-bold bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white"
              >
                Appeler
              </a>
              <a
                href={`https://wa.me/221${storePhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 text-center text-xs font-bold bg-teal-600 hover:bg-teal-500 rounded-lg text-white"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
