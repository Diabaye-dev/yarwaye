"use client";

/* ============================================================================
 *  FICHIER : src/components/StorefrontProductModal.tsx
 *  LANGAGE : TypeScript + JSX (React)
 *  RÔLE    : La FICHE PRODUIT DÉTAILLÉE en fenêtre modale (pop-up),
 *            affichée quand un client clique sur "Voir la fiche détaillée".
 *
 *  Elle montre : la grande photo, la référence SKU/EAN, la description,
 *  les DEUX niveaux de prix (détail et gros dès 10 unités), un sélecteur
 *  de quantité qui applique automatiquement le bon tarif, la disponibilité,
 *  et les actions : Ajouter au panier / WhatsApp / Favoris / Appeler.
 * ==========================================================================*/

import React, { useState, useEffect } from "react";
import { Product, StoreSettings } from "@/types";
import { formatMoney } from "@/lib/utils";
import {
  X,
  ShoppingCart,
  Heart,
  MessageCircle,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Minus,
  Plus,
  Package,
  BadgePercent,
  Phone,
} from "lucide-react";

interface StorefrontProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings | null;
  isWishlisted: boolean;
  onAddToCart: (product: Product, quantity: number) => void;
  onToggleWishlist: (productId: number) => void;
}

export function StorefrontProductModal({
  product,
  isOpen,
  onClose,
  settings,
  isWishlisted,
  onAddToCart,
  onToggleWishlist,
}: StorefrontProductModalProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [product?.id, isOpen]);

  if (!isOpen || !product) return null;

  const currency = settings?.currency || "FCFA";
  const storePhone = settings?.phone || "767866536";
  const cleanPhone = storePhone.replace(/\D/g, "");
  const waNumber = cleanPhone.startsWith("221") ? cleanPhone : `221${cleanPhone}`;

  const bulkPrice = Math.round((product.sellingPrice * 0.9) / 100) * 100;
  const isBulk = quantity >= 10;
  const unitPrice = isBulk ? bulkPrice : product.sellingPrice;
  const lineTotal = unitPrice * quantity;
  const savedAmount = isBulk ? (product.sellingPrice - bulkPrice) * quantity : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-slate-700 transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative h-64 md:h-full min-h-72 bg-slate-100">
            <img
              src={
                product.imageUrl ||
                "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=700&auto=format&fit=crop&q=80"
              }
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow">
              {product.category}
            </span>
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-bold">
                Rupture de stock momentanée
              </div>
            )}
            {product.stock > 0 && product.stock <= product.minStockAlert && (
              <span className="absolute bottom-4 left-4 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold shadow">
                Plus que {product.stock} {product.unit} en stock
              </span>
            )}
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Réf. {product.sku} {product.barcode ? `• EAN ${product.barcode}` : ""}
              </p>
              <h2 className="text-lg font-black text-slate-900 leading-snug mt-1">
                {product.name}
              </h2>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-emerald-700">
                {formatMoney(unitPrice, currency)}
              </span>
              <span className="text-xs text-slate-500">/ {product.unit}</span>
              {isBulk && (
                <span className="text-xs line-through text-slate-400">
                  {formatMoney(product.sellingPrice, currency)}
                </span>
              )}
            </div>

            {/* Bulk pricing tiers */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                <BadgePercent className="w-3.5 h-3.5" /> Tarification progressive (Prix de gros)
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-900">
                  1 à 9 {product.unit} — <strong>{formatMoney(product.sellingPrice, currency)}</strong>
                </span>
                <span className="text-emerald-700 font-bold">
                  10 {product.unit} et + — {formatMoney(bulkPrice, currency)} (-10%)
                </span>
              </div>
            </div>

            {product.description && (
              <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
            )}

            {/* Stock & delivery info */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <Package className="w-3.5 h-3.5 text-slate-500 mb-1" />
                <p className="font-semibold text-slate-700">Disponibilité</p>
                <p className="text-slate-500">
                  {product.stock > 0 ? `${product.stock} ${product.unit} disponibles` : "Sur commande"}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <Truck className="w-3.5 h-3.5 text-slate-500 mb-1" />
                <p className="font-semibold text-slate-700">Livraison</p>
                <p className="text-slate-500">Keur Massar & Grand Dakar</p>
              </div>
            </div>

            {/* Quantity selector */}
            <div>
              <p className="text-[11px] font-semibold text-slate-600 mb-1.5">Quantité souhaitée</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock || 999, q + 1))}
                    className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 text-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs">
                  <p className="text-slate-500">Total ligne</p>
                  <p className="font-black text-slate-900">{formatMoney(lineTotal, currency)}</p>
                  {savedAmount > 0 && (
                    <p className="text-emerald-700 font-semibold text-[10px]">
                      Économie de gros : {formatMoney(savedAmount, currency)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                disabled={product.stock <= 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                Ajouter au panier — {formatMoney(lineTotal, currency)}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                    `Bonjour Agro Service Yarwaye ! Je suis intéressé(e) par : "${product.name}" (Réf ${product.sku}) — quantité ${quantity} ${product.unit}. Pouvez-vous me confirmer la disponibilité et la livraison ?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-teal-600" /> Commander sur WhatsApp
                </a>

                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                    isWishlisted
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                  {isWishlisted ? "Dans mes favoris" : "Ajouter aux favoris"}
                </button>
              </div>

              <a
                href={`tel:${storePhone}`}
                className="w-full py-2 text-[11px] text-slate-600 hover:text-emerald-700 font-medium flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3 h-3" /> Une question ? Appelez notre équipe au{" "}
                <strong className="font-mono">{storePhone}</strong>
              </a>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Produit contrôlé par Agro Service Yarwaye — Keur Massar, Dakar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
