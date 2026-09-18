"use client";
/**
 * FENÊTRE "Ajustement de stock" — src/components/StockAdjustModal.tsx
 * 
 * Permet d'entrer (+) ou de sortir (-) une quantité pour un article, avec un
 * motif pré-défini (réassort, avarie, retour client...) et un aperçu du stock
 * résultant. Envoie POST /api/products/[id]/stock.
 */
import React, { useState } from "react";
import { Product } from "@/types";
import { X, ArrowDown, ArrowUp, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdated: (updatedProduct: Product) => void;
}

export function StockAdjustModal({ isOpen, onClose, product, onUpdated }: StockAdjustModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Réapprovisionnement fournisseur");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = product.stock;
  const delta = mode === "in" ? quantity : -quantity;
  const previewStock = Math.max(0, currentStock + delta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeQuantity: delta,
          type: mode === "in" ? "in" : "out",
          reason: reason,
          performedBy: user?.name || "Personnel Yarwaye",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'ajustement");

      onUpdated(data.product);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Ajustement de Stock</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm truncate">{product.name}</h3>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
              <span>SKU: <strong className="text-slate-700">{product.sku}</strong></span>
              <span>Stock Actuel: <strong className="text-emerald-700 font-bold">{product.stock} {product.unit}</strong></span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode("in");
                setReason("Réapprovisionnement fournisseur");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "in" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowUp className="w-4 h-4" /> Entrée (+ Appro)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("out");
                setReason("Sortie / Avarie / Régularisation");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "out" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowDown className="w-4 h-4" /> Sortie (- Déstockage)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantité à {mode === "in" ? "ajouter" : "déduire"}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 text-base font-bold text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motif du mouvement
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
            >
              {mode === "in" ? (
                <>
                  <option value="Réapprovisionnement fournisseur">Réapprovisionnement fournisseur</option>
                  <option value="Retour client / Échange">Retour client / Échange</option>
                  <option value="Correction inventaire (+)">Correction inventaire (+)</option>
                  <option value="Arrivage direct conteneur Yarwaye">Arrivage direct conteneur Yarwaye</option>
                </>
              ) : (
                <>
                  <option value="Sortie / Avarie / Endommagé">Sortie / Avarie / Endommagé</option>
                  <option value="Article périmé ou cassé">Article périmé ou cassé</option>
                  <option value="Correction inventaire (-)">Correction inventaire (-)</option>
                  <option value="Prélèvement démonstration vitrine">Prélèvement démonstration vitrine</option>
                </>
              )}
            </select>
          </div>

          {/* Impact preview */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-emerald-800 font-medium">Nouveau stock après validation :</span>
            <span className="font-extrabold text-sm text-emerald-900">{previewStock} {product.unit}</span>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors ${
                mode === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {isSubmitting ? "Validation..." : "Confirmer le mouvement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
