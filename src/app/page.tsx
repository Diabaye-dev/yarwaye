"use client";
/**
 * PAGE PRINCIPALE / BACK-OFFICE — src/app/page.tsx
 * 
 * Cœur de l'application de gestion AGRO SERVICE YARWAYE. Composant client
 * ("use client") qui :
 *   1. charge toutes les données depuis les routes /api/* au montage,
 *   2. affiche une barre latérale (sidebar) d'onglets,
 *   3. rend la vue demandée (tableau de bord, caisse, produits, ventes,
 *      clients, fournisseurs, rapports, paramètres, vitrine client),
 *   4. applique des mises à jour optimistes : le state local est modifié
 *      immédiatement, sans attendre un rechargement complet.
 */
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Product, Order, Customer, Supplier, StoreSettings } from "@/types";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Truck,
  TrendingUp,
  Settings,
  Globe,
  Bell,
  Menu,
  X,
  Phone,
  RefreshCw,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import { DashboardOverview } from "@/components/DashboardOverview";
import { PosTerminal } from "@/components/PosTerminal";
import { ProductsView } from "@/components/ProductsView";
import { OrdersView } from "@/components/OrdersView";
import { CustomersView } from "@/components/CustomersView";
import { SuppliersView } from "@/components/SuppliersView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { SettingsView } from "@/components/SettingsView";
import { StorefrontView } from "@/components/StorefrontView";
import { ProductModal } from "@/components/ProductModal";
import { CustomerModal } from "@/components/CustomerModal";
import { UserSwitchModal } from "@/components/UserSwitchModal";

export default function YarwayeShopPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);

  // Les 5 jeux de données du back-office, alimentés par les routes /api/*.
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true); // tant que vrai → écran de chargement

  // Quick modals from header
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

  // Autodiagnostic de la base : un badge visible dans l'en-tête répond à la
  // question « pourquoi rien ne s'enregistre ? » sans ouvrir les logs.
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [dbPanelOpen, setDbPanelOpen] = useState(false);
  const [dbChecking, setDbChecking] = useState(false);

  const checkDbStatus = async () => {
    setDbChecking(true);
    try {
      const res = await fetch("/api/db-status");
      setDbStatus(await res.json());
    } catch {
      setDbStatus({ ok: false, titre: "Route /api/db-status injoignable" });
    } finally {
      setDbChecking(false);
    }
  };

  // Récupère produits + ventes + clients + fournisseurs + paramètres en parallèle (1 trajet réseau).
  const loadAllData = async () => {
    try {
      const [pRes, oRes, cRes, sRes, setRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/orders"),
        fetch("/api/customers"),
        fetch("/api/suppliers"),
        fetch("/api/settings"),
      ]);

      if (pRes.ok) {
        const d = await pRes.json();
        setProducts(d.products || []);
      }
      if (oRes.ok) {
        const d = await oRes.json();
        setOrders(d.orders || []);
      }
      if (cRes.ok) {
        const d = await cRes.json();
        setCustomers(d.customers || []);
      }
      if (sRes.ok) {
        const d = await sRes.json();
        setSuppliers(d.suppliers || []);
      }
      if (setRes.ok) {
        const d = await setRes.json();
        setSettings(d.settings || null);
      }
    } catch (err) {
      console.error("Failed to load store data:", err);
    } finally {
      setIsLoading(false);
      checkDbStatus(); // le badge suit les rafraîchissements de données
    }
  };

  useEffect(() => {
    loadAllData();
    checkDbStatus(); // on vérifie la connexion dès l'ouverture de la page
  }, []);

  const storePhone = settings?.phone || "767866536";
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  // Mises à jour « optimistes » : le state local change tout de suite (réaction immédiate)
  // sans attendre un rechargement complet de la page.
  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleProductStockUpdate = (productId: number, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
  };

  const handleProductDeleted = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCustomerDeleted = (id: number) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSupplierDeleted = (id: number) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  // If Storefront mode is chosen, display the Customer View
  if (activeTab === "storefront") {
    return (
      <StorefrontView
        products={products}
        settings={settings}
        onSwitchToDashboard={() => setActiveTab("overview")}
        onOrderPlaced={handleOrderCreated}
      />
    );
  }

  // Onglets de la barre latérale : label + icône + badge dynamique (alertes stock, nb de ventes).
  const navItems = [
    { id: "overview", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "pos", label: "Caisse & point de vente", icon: ShoppingCart, badge: "Vente" },
    { id: "products", label: "Inventaire & articles", icon: Package, badge: lowStockCount > 0 ? `${lowStockCount} bas` : undefined },
    { id: "orders", label: "Ventes & commandes", icon: FileText, badge: `${orders.length}` },
    { id: "customers", label: "Clients & crédit", icon: Users },
    { id: "suppliers", label: "Fournisseurs", icon: Truck },
    { id: "analytics", label: "Marges & rapports", icon: TrendingUp },
    { id: "settings", label: "Paramètres boutique", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
      {/* Modals */}
      <ProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        onSaved={(newProd) => {
          setProducts((prev) => [newProd, ...prev]);
          setIsNewProductOpen(false);
        }}
      />

      <CustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onSaved={(newCust) => {
          setCustomers((prev) => [newCust, ...prev]);
          setIsNewCustomerOpen(false);
        }}
      />

      <UserSwitchModal
        isOpen={isUserSwitchOpen}
        onClose={() => setIsUserSwitchOpen(false)}
      />

      {/* Top Banner with prominent assistance */}
      <div className="bg-slate-900 text-white text-xs px-4 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-emerald-400">AGRO SERVICE YARWAYE en ligne :</span>
            <span className="text-slate-300">
              Assistance & Wave/OM :{" "}
              <a href={`tel:${storePhone}`} className="text-white font-bold underline font-mono">
                {storePhone}
              </a>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("storefront")}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Ouvrir la vitrine client</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar desktop : marque, navigation par onglets, session courante */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 select-none justify-between">
          <div>
            {/* Brand Logo & Name */}
            <div className="p-5 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-900/30">
Y
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-white text-base tracking-tight truncate">
                {settings?.storeName || "AGRO SERVICE YARWAYE"}
              </h1>
                <p className="text-[11px] text-emerald-400 font-mono font-medium truncate flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {storePhone}
                </p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm font-bold"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badge.includes("bas")
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile Card */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/40">
            <div
              onClick={() => setIsUserSwitchOpen(true)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer border border-slate-700/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || "Y"
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{user?.name || "Personnel Yarwaye"}</p>
                  <p className="text-[10px] text-slate-400 capitalize">
                    {user?.role === "owner"
                      ? "Propriétaire"
                      : user?.role === "manager"
                      ? "Gérant"
                      : user?.role === "cashier"
                      ? "Caissier"
                      : "Propriétaire"}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </aside>

        {/* Même navigation en tiroir sur mobile */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80%] bg-slate-900 text-slate-300 flex flex-col justify-between p-4 z-10 shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black">
                      Y
                    </div>
                    <span className="font-bold text-white text-sm">AGRO SERVICE YARWAYE</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="mt-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsUserSwitchOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  Changer d'utilisateur ({user?.name})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Barre supérieure : titre de l’onglet, actions rapides, session */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:block">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Système commercial</span>
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  {navItems.find((n) => n.id === activeTab)?.label || "Tableau de bord"}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Badge d'état de la base : vert = les enregistrements passent,
                  rouge = cause exacte affichée (variable absente, mot de passe,
                  base en veille, tables manquantes...). */}
              <div className="relative">
                <button
                  onClick={() => {
                    setDbPanelOpen((v) => !v);
                    checkDbStatus();
                  }}
                  title="État de la connexion à la base de données (cliquer pour re-vérifier)"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                    dbStatus === null
                      ? "bg-slate-100 text-slate-500 border-slate-200"
                      : dbStatus.ok
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dbStatus === null ? "bg-slate-400" : dbStatus.ok ? "bg-emerald-500" : "bg-rose-500"
                    } ${dbChecking ? "animate-pulse" : ""}`}
                  />
                  {dbStatus === null
                    ? "vérification…"
                    : dbStatus.ok
                    ? `base${dbStatus.tables ? ` · ${dbStatus.tables} tables` : ""}`
                    : "base KO"}
                </button>

                {dbPanelOpen && dbStatus && (
                  <div className="absolute right-0 mt-2 w-80 p-3 bg-white rounded-xl border border-slate-200 shadow-xl z-50 text-left">
                    <div className="text-xs font-bold text-slate-900">{dbStatus.titre}</div>
                    {dbStatus.detail && (
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{dbStatus.detail}</p>
                    )}
                    {dbStatus.erreur && (
                      <p className="text-[11px] font-mono text-rose-700 mt-1 break-all bg-rose-50 p-1.5 rounded">
                        {dbStatus.erreur}
                      </p>
                    )}
                    {dbStatus.hote && (
                      <p className="text-[10px] text-slate-500 mt-1.5 font-mono break-all">
                        hôte : {dbStatus.hote}
                        {dbStatus.pooler === false && (
                          <span className="text-amber-700 font-sans">
                            {" "}
                            ⚠ sans « -pooler » : risqué en serverless
                          </span>
                        )}
                      </p>
                    )}
                    {dbStatus.action && (
                      <p className="text-[11px] text-emerald-800 mt-2 bg-emerald-50 border border-emerald-200 rounded p-1.5">
                        👉 {dbStatus.action}
                      </p>
                    )}
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => setDbPanelOpen(false)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsNewProductOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition-colors"
              >
                + Produit
              </button>
              <button
                onClick={() => setIsNewCustomerOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
              >
                + Client
              </button>

              <button
                onClick={() => setActiveTab("pos")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Caisse</span>
              </button>

              <button
                onClick={() => setIsUserSwitchOpen(true)}
                title="Changer de session"
                className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                  {user?.name?.charAt(0) || "Y"}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden md:inline">
                  {user?.name}
                </span>
              </button>
            </div>
          </header>

          {/* Zone centrale : la vue correspondant à l’onglet actif */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
            {isLoading ? (
              <div className="py-24 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-xs font-semibold">Chargement des données d'AGRO SERVICE YARWAYE...</p>
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <DashboardOverview
                    products={products}
                    orders={orders}
                    customers={customers}
                    settings={settings}
                    onNavigate={(tab) => setActiveTab(tab)}
                    onOpenNewProduct={() => setIsNewProductOpen(true)}
                    onOpenNewCustomer={() => setIsNewCustomerOpen(true)}
                  />
                )}

                {activeTab === "pos" && (
                  <PosTerminal
                    products={products}
                    customers={customers}
                    settings={settings}
                    onOrderCreated={handleOrderCreated}
                    onProductStockUpdate={handleProductStockUpdate}
                  />
                )}

                {activeTab === "products" && (
                  <ProductsView
                    products={products}
                    settings={settings}
                    onRefresh={loadAllData}
                    onProductDeleted={handleProductDeleted}
                  />
                )}

                {activeTab === "orders" && (
                  <OrdersView
                    orders={orders}
                    settings={settings}
                    onRefresh={loadAllData}
                    onOrderUpdated={handleOrderUpdated}
                  />
                )}

                {activeTab === "customers" && (
                  <CustomersView
                    customers={customers}
                    settings={settings}
                    onRefresh={loadAllData}
                    onCustomerDeleted={handleCustomerDeleted}
                  />
                )}

                {activeTab === "suppliers" && (
                  <SuppliersView
                    suppliers={suppliers}
                    settings={settings}
                    onRefresh={loadAllData}
                    onSupplierDeleted={handleSupplierDeleted}
                  />
                )}

                {activeTab === "analytics" && <AnalyticsView settings={settings} />}

                {activeTab === "settings" && (
                  <SettingsView settings={settings} onRefresh={loadAllData} />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
