"use client";

/* ============================================================================
 *  FICHIER : src/components/ProductsView.tsx
 *  LANGAGE : TypeScript + JSX (React)
 *  RÔLE    : L'écran "Inventaire & Articles" — gestion complète du catalogue.
 *
 *  Fonctionnalités :
 *    - Tableau détaillé (photo, nom, SKU, catégorie, prix achat/vente, stock)
 *    - Recherche multicritère + filtres catégorie / niveau de stock
 *    - Bouton "Nouveau Produit" (ouvre ProductModal)
 *    - Bouton "Ajuster le stock" (ouvre StockAdjustModal, + / −)
 *    - Modification, suppression, et EXPORT CSV de l'inventaire
 *
 *  exportCSV() génère un fichier Excel-compatible téléchargé par le navigateur.
 * ==========================================================================*/

import React, { useState, useMemo } from "react";
import { Product, StoreSettings } from "@/types";
import { formatMoney } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Package,
  CheckCircle,
  Download,
} from "lucide-react";
import { ProductModal } from "./ProductModal";
import { StockAdjustModal } from "./StockAdjustModal";

interface ProductsViewProps {
  products: Product[];
  settings: StoreSettings | null;
  onRefresh: () => void;
  onProductDeleted: (id: number) => void;
}

export function ProductsView({ products, settings, onRefresh, onProductDeleted }: ProductsViewProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low_stock" | "out_of_stock">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search)) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

      const matchCat = selectedCategory === "all" || p.category === selectedCategory;

      let matchStock = true;
      if (stockFilter === "low_stock") {
        matchStock = p.stock > 0 && p.stock <= p.minStockAlert;
      } else if (stockFilter === "out_of_stock") {
        matchStock = p.stock <= 0;
      }

      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, selectedCategory, stockFilter]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer définitivement "${name}" du catalogue ?`)) return;

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        onProductDeleted(id);
      }
    } catch (e) {
      alert("Erreur de suppression");
    } finally {
      setIsDeleting(null);
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "SKU", "Article", "Catégorie", "Prix Achat", "Prix Vente", "Stock", "Unité"];
    const rows = filtered.map((p) => [
      p.id,
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.costPrice,
      p.sellingPrice,
      p.stock,
      p.unit,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventaire_Boutique_Yarwaye_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currency = settings?.currency || "FCFA";
  const lowStockTotal = products.filter((p) => p.stock <= p.minStockAlert).length;

  return (
    <div className="space-y-6">
      {/* Modals */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSaved={() => {
          onRefresh();
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
      />

      <StockAdjustModal
        isOpen={Boolean(adjustingProduct)}
        onClose={() => setAdjustingProduct(null)}
        product={adjustingProduct}
        onUpdated={() => {
          onRefresh();
          setAdjustingProduct(null);
        }}
      />

      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            Catalogue & Inventaire Yarwaye
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {products.length} articles répertoriés • {lowStockTotal} en alerte stock bas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Nouveau Produit
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par désignation, référence SKU ou code-barres..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "Toutes les catégories" : c}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="text-xs border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 focus:outline-hidden"
            >
              <option value="all">Tous les niveaux de stock</option>
              <option value="low_stock">⚠️ Stock Faible ({lowStockTotal})</option>
              <option value="out_of_stock">❌ En Rupture (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Products */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 text-right">Prix d'Achat</th>
                <th className="py-3 px-4 text-right">Prix Vente</th>
                <th className="py-3 px-4 text-center">Quantité Stock</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const isLow = p.stock <= p.minStockAlert && p.stock > 0;
                const isOut = p.stock <= 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&auto=format&fit=crop&q=80"}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{p.description || "Aucune note"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <div>{p.sku}</div>
                      {p.barcode && <div className="text-[10px] text-slate-400">{p.barcode}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatMoney(p.costPrice, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatMoney(p.sellingPrice, currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                          isOut
                            ? "bg-rose-100 text-rose-800"
                            : isLow
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isOut ? (
                        <span className="text-[10px] font-bold text-rose-600 uppercase">Rupture</span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Stock Bas
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> En Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAdjustingProduct(p)}
                          title="Ajuster le stock (+/-)"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsModalOpen(true);
                          }}
                          title="Modifier l'article"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={isDeleting === p.id}
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Supprimer"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Aucun article ne correspond à votre filtre.
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
