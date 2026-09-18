"use client";
/**
 * CAISSE / POINT DE VENTE — src/components/PosTerminal.tsx
 * 
 * Écran d'encaissement rapide utilisé au comptoir :
 *   - à gauche : catalogue filtrable (recherche + catégories),
 *   - à droite : panier, client, remise, mode de paiement, total.
 * La validation appelle POST /api/orders : le stock est déduit côté serveur
 * et localement (mise à jour optimiste), puis le ticket s'ouvre.
 */
import React, { useState, useMemo } from "react";
import { Product, Customer, Order, StoreSettings } from "@/types";
import { formatMoney } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Phone,
  Banknote,
  Smartphone,
  CreditCard,
  User,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ReceiptModal } from "./ReceiptModal";

interface CartItem {
  product: Product;
  quantity: number;
}

interface PosTerminalProps {
  products: Product[];
  customers: Customer[];
  settings: StoreSettings | null;
  onOrderCreated: (order: Order) => void;
  onProductStockUpdate: (productId: number, newStock: number) => void;
}

export function PosTerminal({
  products,
  customers,
  settings,
  onOrderCreated,
  onProductStockUpdate,
}: PosTerminalProps) {
  const { user } = useAuth();
  // Recherche instantanée du catalogue (nom, SKU, code-barres).
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]); // lignes en cours d’encaissement
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("Client Comptoir");
  const [customerPhone, setCustomerPhone] = useState(settings?.phone || "767866536");
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "wave_om_767866536" | "card" | "credit">("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null); // dernier reçu à afficher
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Liste déroulante des catégories, déduite du catalogue (sans doublons).
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  // Produits filtrés : texte + catégorie, uniquement les articles actifs.
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search));
      const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchSearch && matchCategory && p.isActive;
    });
  }, [products, search, selectedCategory]);

  // Ajout au panier : refuse les ruptures et plafonne à la quantité en stock.
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("Cet article est en rupture de stock.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stock maximum atteint (${product.stock} ${product.unit}).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // + / − sur une ligne ; à 0, la ligne est retirée du panier.
  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Stock disponible limité à ${item.product.stock}.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Sélection d’un client connu : nom et téléphone sont pré-remplis.
  const handleCustomerChange = (customerIdVal: string) => {
    setSelectedCustomerId(customerIdVal);
    if (!customerIdVal) {
      setCustomerName("Client Comptoir");
      setCustomerPhone(settings?.phone || "767866536");
    } else {
      const cust = customers.find((c) => c.id === Number(customerIdVal));
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
      }
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0); // somme des lignes du panier du panier
  const total = Math.max(0, subtotal - discount); // total après application de la remise

  // ENCAISSEMENT : envoie la commande à /api/orders, décrémente le stock localement
  // (mise à jour optimiste) puis ouvre le ticket de caisse.
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      customerId: selectedCustomerId ? Number(selectedCustomerId) : null,
      customerName: customerName.trim() || "Client Comptoir",
      customerPhone: customerPhone.trim() || settings?.phone || "767866536",
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        unitPrice: item.product.sellingPrice,
        costPrice: item.product.costPrice,
        quantity: item.quantity,
      })),
      subtotal,
      discount,
      tax: 0,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "credit" ? "pending" : "paid",
      cashierName: user?.name || "Personnel Yarwaye",
      notes: paymentMethod === "wave_om_767866536" ? `Paiement Mobile Wave/OM vers ${settings?.phone || "767866536"}` : null,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'encaissement");

      // Update product stock in parent state
      for (const item of cart) {
        onProductStockUpdate(item.product.id, item.product.stock - item.quantity);
      }

      onOrderCreated(data.order);
      setLastCreatedOrder(data.order);
      setIsReceiptOpen(true);
      clearCart();
      setFeedback("Vente enregistrée avec succès !");
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const storePhone = settings?.phone || "767866536";

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Recu genéré apres la vente (imprimable) */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={lastCreatedOrder}
        settings={settings}
      />

      {/* COLONNE GAUCHE : catalogue cliquable, on ajoute en un tap */}
      <div className="flex-1 flex flex-col space-y-4">
        {feedback && (
          <div className="p-3 bg-emerald-600 text-white font-medium text-xs rounded-xl flex items-center justify-between shadow-md transition-all">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {feedback}
            </span>
            <button
              onClick={() => setIsReceiptOpen(true)}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold"
            >
              Voir le reçu
            </button>
          </div>
        )}

        {/* Search & Categories */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, SKU ou code-barres (ex: riz, solaire, 6001...)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Effacer
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat === "all" ? "Tous les articles" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= p.minStockAlert;
            const inCartItem = cart.find((i) => i.product.id === p.id);

            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`group relative flex flex-col justify-between p-3 rounded-xl border bg-white transition-all cursor-pointer select-none text-left ${
                  isOutOfStock
                    ? "opacity-50 border-slate-200 cursor-not-allowed bg-slate-50"
                    : inCartItem
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200/80 hover:border-emerald-400 hover:shadow-md"
                }`}
              >
                {/* Image */}
                <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-100 mb-2">
                  <img
                    src={p.imageUrl || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80"}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {inCartItem && (
                    <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                      {inCartItem.quantity}
                    </span>
                  )}
                  {isLowStock && (
                    <span className="absolute bottom-1.5 left-1.5 bg-amber-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      Stock bas ({p.stock})
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="absolute inset-0 bg-slate-900/60 text-white text-[11px] font-bold flex items-center justify-center">
                      Épuisé
                    </span>
                  )}
                </div>

                {/* Details */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {p.category}
                  </span>
                  <h3 className="font-semibold text-slate-900 text-xs line-clamp-2 leading-tight mt-0.5">
                    {p.name}
                  </h3>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-700">
                    {formatMoney(p.sellingPrice, settings?.currency || "FCFA")}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Stock: {p.stock}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
              <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Aucun produit trouvé</p>
              <p className="text-xs text-slate-400 mt-1">
                Modifiez vos critères de recherche ou ajoutez un produit.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* COLONNE DROITE : panier, client, remise, paiement, total */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-800">Panier d'encaissement</h2>
            <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Vider
            </button>
          )}
        </div>

        {/* Client du ticket (comptoir ou fiche enregistree) */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg py-1.5 px-2 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Client Comptoir / Passager</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) {c.creditBalance > 0 ? `[Dette: ${c.creditBalance}]` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nom du client"
              className="flex-1 text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
            />
            <div className="relative flex-1">
              <Phone className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="767866536"
                className="w-full text-[11px] pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-72">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">Le panier est vide.</p>
              <p className="text-[11px] text-slate-400">Cliquez sur un article pour l'ajouter.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-semibold text-slate-800 truncate">{item.product.name}</h4>
                  <p className="text-[10px] text-slate-500">
                    {formatMoney(item.product.sellingPrice, settings?.currency || "FCFA")} x {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold px-1.5 text-xs text-slate-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="w-20 text-right font-bold text-slate-900">
                  {formatMoney(item.product.sellingPrice * item.quantity, settings?.currency || "FCFA")}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Payment Section */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
          {/* Subtotal & Discount */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total</span>
              <span className="font-semibold">{formatMoney(subtotal, settings?.currency || "FCFA")}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 text-xs">Remise accordée :</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-24 px-2 py-1 text-right text-xs bg-white border border-slate-200 rounded font-semibold text-emerald-800"
              />
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800 text-sm">TOTAL À PAYER</span>
              <span className="font-black text-lg text-emerald-700">
                {formatMoney(total, settings?.currency || "FCFA")}
              </span>
            </div>
          </div>

          {/* Choix du reglement ; Wave/OM rappelle le 767866536 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Mode de paiement client
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  paymentMethod === "cash"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Banknote className="w-3.5 h-3.5" /> Espèces
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("wave_om_767866536")}
                className={`flex items-center gap-1 px-2 py-2 rounded-lg text-[11px] font-semibold border transition-all ${
                  paymentMethod === "wave_om_767866536"
                    ? "bg-teal-600 text-white border-teal-600 shadow-xs ring-1 ring-teal-400"
                    : "bg-white text-teal-800 border-teal-200 hover:bg-teal-50"
                }`}
                title={`Wave ou Orange Money vers le ${storePhone}`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Wave/OM ({storePhone})
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  paymentMethod === "card"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Carte Bancaire
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("credit")}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  paymentMethod === "credit"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Crédit / Carnet
              </button>
            </div>
            {paymentMethod === "wave_om_767866536" && (
              <p className="text-[10px] text-teal-700 font-medium mt-1 bg-teal-50 p-1.5 rounded border border-teal-200">
                📲 Demander au client d'envoyer le paiement Wave / Orange Money au :{" "}
                <strong className="underline font-bold">{storePhone}</strong>
              </p>
            )}
          </div>

          {/* Validation de la vente */}
          <button
            type="button"
            disabled={cart.length === 0 || isSubmitting}
            onClick={handleCheckout}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Encaissement en cours...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Valider l'Encaissement ({formatMoney(total, settings?.currency || "FCFA")})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
