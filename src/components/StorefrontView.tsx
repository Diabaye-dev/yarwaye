"use client";

/* ============================================================================
 *  FICHIER : src/components/StorefrontView.tsx
 *  LANGAGE : TypeScript + JSX (React)
 *  RÔLE    : La VITRINE CLIENTE complète (la boutique en ligne publique),
 *            affichée quand on clique sur "Ouvrir la Boutique Client".
 *
 *  Ce composant est un mini-site e-commerce autonome :
 *
 *    1. CONFIGURATION (en haut du fichier)
 *       ZONES  → les zones de livraison et leurs frais (Keur Massar, Dakar...)
 *       PROMOS → les codes promo utilisables (YARWAYE10, AGRO5, GROS15)
 *       SERVICES / FAQ → le contenu éditorial de la vitrine
 *
 *    2. ÉTATS (useState) → panier, favoris, recherche, filtres, étapes
 *       du tunnel de commande, suivi de commande, espace client...
 *
 *    3. PERSISTANCE (useEffect) → le panier et les favoris sont sauvegardés
 *       dans le localStorage du navigateur (ils survivent au rafraîchissement)
 *
 *    4. CALCULS (useMemo) → produits filtrés/triés, sous-total, remise,
 *       frais de livraison, total à payer
 *
 *    5. ACTIONS → addToCart, handleCheckout (valider la commande),
 *       handleTrackOrder (suivre une commande), handleAccountLookup...
 *
 *    6. RENDU (return JSX) → les écrans : Accueil, Catalogue, Services,
 *       Suivi, Espace client, Contact, Footer, Panier (drawer), Modales
 * ==========================================================================*/

import React, { useState, useEffect, useMemo } from "react";
import { Product, StoreSettings, Order, Customer } from "@/types";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Phone,
  MessageCircle,
  Heart,
  Truck,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Clock,
  Mail,
  Star,
  Plus,
  Minus,
  Trash2,
  BadgePercent,
  Package,
  User,
  RefreshCw,
  Send,
  LayoutDashboard,
  Sparkles,
  Building2,
  Wheat,
  Factory,
  Cake,
  HardHat,
  Quote,
  Check,
  ArrowRight,
  Eye,
} from "lucide-react";
import { StorefrontProductModal } from "./StorefrontProductModal";

/* ---------------------------------- Config --------------------------------- */

const ZONES = [
  { id: "keur_massar", name: "Keur Massar / Malika", fee: 1000, delay: "Sous 2 à 4 heures" },
  { id: "guediawaye", name: "Guédiawaye / Yeumbeul", fee: 2000, delay: "Sous 24 heures" },
  { id: "parcelles", name: "Parcelles / Grand Dakar", fee: 2500, delay: "Sous 24 heures" },
  { id: "dakar_centre", name: "Dakar Centre / Plateau / Ouakam", fee: 3500, delay: "Sous 24 à 48 heures" },
  { id: "region", name: "Thiès / Mbour / Régions", fee: 10000, delay: "Sous 48 à 72 heures" },
  { id: "retrait", name: "Retrait sur place — Malika, Keur Massar", fee: 0, delay: "Immédiat aux horaires d'ouverture" },
];

const PROMOS: Record<string, { percent: number; label: string; min: number }> = {
  YARWAYE10: { percent: 10, label: "-10% sur votre première commande", min: 0 },
  AGRO5: { percent: 5, label: "-5% commande agroalimentaire", min: 25000 },
  GROS15: { percent: 15, label: "-15% grande commande (dès 100 000 FCFA)", min: 100000 },
};

const SERVICES = [
  {
    icon: Wheat,
    title: "Agriculture & Intrants",
    desc: "Semences améliorées, engrais, phytosanitaires et conseil agronomique pour les producteurs du bassin de Keur Massar.",
    img: "images/field-maize.jpg",
  },
  {
    icon: Factory,
    title: "Transformation Agroalimentaire",
    desc: "Farines, huiles végétales, sucres et produits transformés conditionnés pour boulangeries, restaurants et industries.",
    img: "images/shop-counter.jpg",
  },
  {
    icon: Building2,
    title: "Commerce Général & Gros",
    desc: "Achat-vente en gros et demi-gros de céréales, épicerie et marchandises diverses avec tarifs dégressifs.",
    img: "images/hero-agro.jpg",
  },
  {
    icon: HardHat,
    title: "Matériaux BTP",
    desc: "Ciment, fers à béton, graviers et fournitures de chantier livrés sur tout le Grand Dakar.",
    img: "images/hero-agro.jpg",
  },
  {
    icon: Cake,
    title: "Pâtisserie & Restauration",
    desc: "Plateaux de fête, fournitures de boulangerie et service traiteur pour vos cérémonies et événements.",
    img: "images/shop-counter.jpg",
  },
  {
    icon: Truck,
    title: "Prestations de Services",
    desc: "Livraison assurée, pesée certifiée, mise en relation transporteurs et accompagnement administratif des commandes.",
    img: "images/field-maize.jpg",
  },
];

const FAQ = [
  {
    q: "Comment passer une commande sur la vitrine Agro Service Yarwaye ?",
    a: "Ajoutez vos articles au panier, choisissez votre zone de livraison ou le retrait sur place à Malika (Keur Massar), puis validez. Notre équipe vous rappelle sous 2 heures au numéro indiqué pour confirmer la disponibilité et la livraison.",
  },
  {
    q: "Quels sont les moyens de paiement acceptés ?",
    a: "Nous acceptons les espèces à la livraison, les virements Wave et Orange Money vers notre ligne officielle 767866536, ainsi que les paiements par carte bancaire et les règlements par chèque pour les entreprises (sur accord préalable).",
  },
  {
    q: "Livrez-vous en dehors de Keur Massar ?",
    a: "Oui. Nous livrons sur tout le Grand Dakar (Guédiawaye, Parcelles, Plateau, Ouakam…) et expédions vers Thiès, Mbour et les régions via nos transporteurs partenaires. Les frais sont calculés automatiquement dans le panier.",
  },
  {
    q: "Comment bénéficier des prix de gros ?",
    a: "À partir de 10 unités du même article, le tarif de gros (-10%) s'applique automatiquement dans votre panier. Pour les volumes professionnels (plus d'une tonne), demandez un devis personnalisé via la page Contact.",
  },
  {
    q: "Puis-je suivre l'avancement de ma commande ?",
    a: "Oui, munissez-vous de votre numéro de commande (format ASY-2025-XXX) et de votre numéro de téléphone dans la rubrique « Suivre ma commande » pour voir l'état en temps réel : reçue, en préparation, expédiée ou livrée.",
  },
];

/* --------------------------------- Helpers --------------------------------- */

function getBulkPrice(product: Product) {
  return Math.round((product.sellingPrice * 0.9) / 100) * 100;
}

interface CartItem {
  product: Product;
  quantity: number;
}

type View = "home" | "catalog" | "services" | "tracking" | "account" | "contact";

interface StorefrontViewProps {
  products: Product[];
  settings: StoreSettings | null;
  onSwitchToDashboard: () => void;
  onOrderPlaced: (order: Order) => void;
}

/* -------------------------------- Component -------------------------------- */

export function StorefrontView({
  products,
  settings,
  onSwitchToDashboard,
  onOrderPlaced,
}: StorefrontViewProps) {
  const storePhone = settings?.phone || "767866536";
  const currency = settings?.currency || "FCFA";
  const cleanPhone = storePhone.replace(/\D/g, "");
  const waNumber = cleanPhone.startsWith("221") ? cleanPhone : `221${cleanPhone}`;

  /* Navigation */
  const [view, setView] = useState<View>("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* Catalog */
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"relevance" | "price_asc" | "price_desc" | "name" | "newest">("relevance");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(200000);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  /* Cart & wishlist */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);

  /* Checkout */
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "infos" | "payment" | "done">("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryZone, setDeliveryZone] = useState("keur_massar");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wave_om_767866536" | "cash" | "card">("wave_om_767866536");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  /* Tracking */
  const [trackRef, setTrackRef] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackNotFound, setTrackNotFound] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  /* Account */
  const [accPhone, setAccPhone] = useState("");
  const [accCustomer, setAccCustomer] = useState<Customer | null>(null);
  const [accOrders, setAccOrders] = useState<Order[]>([]);
  const [accLoading, setAccLoading] = useState(false);
  const [accError, setAccError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", address: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  /* Contact form */
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSubject, setContactSubject] = useState("Demande de devis professionnel");
  const [contactMessage, setContactMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* ------------------------------ Persistence ------------------------------ */

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("asy_cart");
      const savedWishlist = localStorage.getItem("asy_wishlist");
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch {
      /* ignore corrupted storage */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("asy_cart", JSON.stringify(cart));
      localStorage.setItem("asy_wishlist", JSON.stringify(wishlist));
    } catch {
      /* storage unavailable */
    }
  }, [cart, wishlist]);

  /* --------------------------------- Data --------------------------------- */

  const categories = useMemo(() => {
    return ["all", ...Array.from(new Set(products.map((p) => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.isActive);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "all") list = list.filter((p) => p.category === selectedCategory);
    if (onlyAvailable) list = list.filter((p) => p.stock > 0);
    if (showWishlistOnly) list = list.filter((p) => wishlist.includes(p.id));
    list = list.filter((p) => p.sellingPrice <= maxPrice);

    switch (sortBy) {
      case "price_asc":
        list = [...list].sort((a, b) => a.sellingPrice - b.sellingPrice);
        break;
      case "price_desc":
        list = [...list].sort((a, b) => b.sellingPrice - a.sellingPrice);
        break;
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
        break;
      case "newest":
        list = [...list].sort((a, b) => b.id - a.id);
        break;
      default:
        break;
    }

    return list;
  }, [products, search, selectedCategory, sortBy, onlyAvailable, maxPrice, showWishlistOnly, wishlist]);

  const featuredProducts = useMemo(
    () => products.filter((p) => p.isActive).slice(0, 8),
    [products]
  );

  /* --------------------------------- Cart --------------------------------- */

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(product.stock || 999, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock || 999, quantity) }];
    });
    setCartFeedback(`${product.name} ajouté au panier !`);
    setTimeout(() => setCartFeedback(null), 2600);
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id === productId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            return { ...i, quantity: Math.min(i.product.stock || 999, newQty) };
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  /* Totals */
  const subtotal = cart.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const promo = appliedPromo ? PROMOS[appliedPromo] : null;
  const discount = promo && subtotal >= promo.min ? Math.round((subtotal * promo.percent) / 100) : 0;
  const zone = ZONES.find((z) => z.id === deliveryZone) || ZONES[0];
  const deliveryFee = subtotal > 100000 ? 0 : zone.fee;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!PROMOS[code]) {
      alert("Ce code promo n'est pas valide.");
      return;
    }
    if (subtotal < PROMOS[code].min) {
      alert(`Ce code nécessite un minimum de ${formatMoney(PROMOS[code].min, currency)}.`);
      return;
    }
    setAppliedPromo(code);
    setPromoInput("");
  };

  /* ------------------------------- Checkout -------------------------------- */

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmittingOrder(true);
    try {
      const payload = {
        customerName: customerName.trim() || "Client Vitrine Web",
        customerPhone: customerPhone.trim() || storePhone,
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          productSku: i.product.sku,
          unitPrice: i.product.sellingPrice,
          costPrice: i.product.costPrice,
          quantity: i.quantity,
        })),
        subtotal,
        discount,
        tax: deliveryFee,
        total,
        paymentMethod:
          paymentMethod === "cash" ? "cash" : paymentMethod === "card" ? "card" : "wave_om_767866536",
        paymentStatus: "pending",
        cashierName: "Vitrine Web Agro Service Yarwaye",
        notes: [
          `Mode de réception : ${zone.name}`,
          deliveryAddress ? `Adresse : ${deliveryAddress}` : null,
          customerEmail ? `Email : ${customerEmail}` : null,
          appliedPromo ? `Code promo appliqué : ${appliedPromo}` : null,
          orderNotes ? `Précisions client : ${orderNotes}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de valider la commande");

      setOrderSuccess(data.order);
      onOrderPlaced(data.order);
      setCheckoutStep("done");
      setCart([]);
      setAppliedPromo(null);
    } catch (err: any) {
      alert(`Une erreur est survenue : ${err.message}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  /* ------------------------------- Tracking ------------------------------- */

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRef.trim()) return;

    setIsTracking(true);
    setTrackedOrder(null);
    setTrackNotFound(false);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const ref = trackRef.trim().toLowerCase();
      const phoneDigits = trackPhone.replace(/\D/g, "");
      const found = (data.orders || []).find((o: Order) => {
        const matchRef = o.orderNumber.toLowerCase().includes(ref);
        const matchPhone = phoneDigits ? (o.customerPhone || "").replace(/\D/g, "").includes(phoneDigits) : true;
        return matchRef && matchPhone;
      });

      if (found) setTrackedOrder(found);
      else setTrackNotFound(true);
    } catch {
      setTrackNotFound(true);
    } finally {
      setIsTracking(false);
    }
  };

  /* -------------------------------- Account ------------------------------- */

  const handleAccountLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccLoading(true);
    setAccError(null);
    setAccCustomer(null);
    setAccOrders([]);
    try {
      const digits = accPhone.replace(/\D/g, "");
      const [cRes, oRes] = await Promise.all([
        fetch(`/api/customers?search=${encodeURIComponent(digits)}`),
        fetch("/api/orders"),
      ]);
      const cData = await cRes.json();
      const oData = await oRes.json();

      const found: Customer | undefined = (cData.customers || []).find((c: Customer) =>
        c.phone.replace(/\D/g, "").includes(digits)
      );

      if (found) {
        setAccCustomer(found);
        setProfileForm({
          name: found.name,
          email: found.email || "",
          address: found.address || "",
        });
        setAccOrders(
          (oData.orders || []).filter(
            (o: Order) =>
              o.customerId === found.id ||
              (o.customerPhone || "").replace(/\D/g, "").includes(digits)
          )
        );
      } else {
        setAccError(
          "Aucun compte client trouvé pour ce numéro. Passez une première commande ou contactez-nous au " +
            storePhone +
            "."
        );
      }
    } catch {
      setAccError("Connexion impossible. Veuillez réessayer.");
    } finally {
      setAccLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accCustomer) return;
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const res = await fetch(`/api/customers/${accCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        const data = await res.json();
        setAccCustomer(data.customer);
        setProfileMsg("Vos informations ont été mises à jour avec succès.");
      } else {
        setProfileMsg("Erreur lors de la mise à jour du profil.");
      }
    } catch {
      setProfileMsg("Erreur lors de la mise à jour du profil.");
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(""), 4000);
    }
  };

  /* ------------------------------ Navigation ------------------------------ */

  const goTo = (v: View) => {
    setView(v);
    setIsMobileMenuOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openWhatsApp = (message: string) =>
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank");

  const openContactWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    openWhatsApp(
      `Bonjour Agro Service YARWAYE !\n\nNom : ${contactName}\nTéléphone : ${contactPhone}\nSujet : ${contactSubject}\n\nMessage :\n${contactMessage}`
    );
    setContactName("");
    setContactPhone("");
    setContactMessage("");
  };

  /* --------------------------------- Render ------------------------------- */

  return (
    <div className="min-h-screen bg-[#F7F6F1] text-slate-900 antialiased">
      {/* ============================= Announcement ============================ */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>
              Livraison <strong className="text-emerald-300">offerte dès 100 000 FCFA</strong> sur le Grand Dakar •
              Paiement Wave / Orange Money au <strong className="font-mono">{storePhone}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href={`tel:${storePhone}`} className="flex items-center gap-1.5 hover:text-emerald-300 font-medium">
              <Phone className="w-3 h-3" /> {storePhone}
            </a>
            <span className="hidden sm:block text-white/30">|</span>
            <button
              onClick={onSwitchToDashboard}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-emerald-200 font-semibold transition-colors"
            >
              <LayoutDashboard className="w-3 h-3" /> Espace Gérance
            </button>
          </div>
        </div>
      </div>

      {/* ================================ Header ============================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Logo */}
            <button onClick={() => goTo("home")} className="flex items-center gap-2.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-lime-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                ASY
              </div>
              <div className="leading-tight">
                <span className="block font-black tracking-tight text-slate-900 text-sm sm:text-base">
                  AGRO SERVICE YARWAYE
                </span>
                <span className="block text-[10px] text-emerald-700 font-medium">
                  Agriculture • Agroalimentaire • BTP • Commerce général
                </span>
              </div>
            </button>

            {/* Search desktop */}
            <div className="hidden lg:flex flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (view !== "catalog") setView("catalog");
                }}
                placeholder="Rechercher : maïs, engrais, farine, ciment, huile..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => goTo("tracking")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Truck className="w-4 h-4 text-emerald-600" /> Suivre ma commande
              </button>

              <button
                onClick={() => goTo("account")}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span className="hidden md:inline">Mon espace</span>
              </button>

              <button
                onClick={() => {
                  setShowWishlistOnly(true);
                  goTo("catalog");
                }}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Mes favoris"
              >
                <Heart className="w-4 h-4" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Panier</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-lime-500 text-emerald-950 text-[10px] font-black rounded-full flex items-center justify-center shadow">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Category nav */}
          <nav className="hidden lg:flex items-center gap-1 pb-2.5 overflow-x-auto">
            {[
              { id: "home", label: "Accueil" },
              { id: "catalog", label: "Tous les produits" },
              ...categories
                .filter((c) => c !== "all")
                .slice(0, 5)
                .map((c) => ({ id: `cat:${c}`, label: c })),
              { id: "services", label: "Nos services" },
              { id: "contact", label: "Contact & Devis" },
            ].map((item) => {
              const isActive =
                view === item.id || (item.id.startsWith("cat:") && selectedCategory === item.id.slice(4));
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id.startsWith("cat:")) {
                      setSelectedCategory(item.id.slice(4));
                      setView("catalog");
                    } else {
                      setSelectedCategory("all");
                      goTo(item.id as View);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[85%] bg-white h-full shadow-2xl p-5 space-y-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-black text-sm">Menu Agro Service</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative pt-2">
              <Search className="w-4 h-4 absolute left-3 top-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setView("catalog");
                }}
                placeholder="Rechercher un produit..."
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-100 rounded-xl focus:outline-hidden"
              />
            </div>

            {[
              { id: "home", label: "Accueil", icon: Sparkles },
              { id: "catalog", label: "Catalogue produits", icon: Package },
              { id: "tracking", label: "Suivre ma commande", icon: Truck },
              { id: "account", label: "Mon espace client", icon: User },
              { id: "services", label: "Nos services", icon: LayoutDashboard },
              { id: "contact", label: "Contact & Devis", icon: MessageCircle },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id as View)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </button>
              );
            })}

            <a
              href={`tel:${storePhone}`}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
            >
              <Phone className="w-3.5 h-3.5" /> Appeler {storePhone}
            </a>
          </div>
        </div>
      )}

      {/* Cart feedback toast */}
      {cartFeedback && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] px-5 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {cartFeedback}
          <button onClick={() => setIsCartOpen(true)} className="underline text-emerald-300 ml-1">
            Voir le panier
          </button>
        </div>
      )}

      {/* ================================= HOME =============================== */}
      {view === "home" && (
        <>
          {/* Hero */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0">
              <img src="images/hero-agro.jpg" alt="Dépôt Agro Service Yarwaye" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-emerald-950/40" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
              <div className="max-w-2xl space-y-6 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> Malika QRT Malika / MER — BP 17000, Keur Massar, Dakar
                </div>

                <h1 className="text-3xl sm:text-5xl font-black leading-[1.1] tracking-tight">
                  Le partenaire agricole & agroalimentaire de référence à{" "}
                  <span className="text-emerald-400">Keur Massar</span>
                </h1>

                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                  Céréales, intrants agricoles, produits transformés, matériaux BTP, pâtisserie et restauration.
                  Commandez en ligne, payez par Wave ou Orange Money au{" "}
                  <strong className="text-emerald-300 font-mono">{storePhone}</strong> et faites-vous livrer partout au
                  Grand Dakar.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => goTo("catalog")}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-sm shadow-xl transition-transform hover:-translate-y-0.5"
                  >
                    Découvrir le catalogue <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openWhatsApp("Bonjour Agro Service YARWAYE ! Je souhaite passer une commande.")}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/25 backdrop-blur-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Commander sur WhatsApp
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
                  {[
                    { value: `${products.length}+`, label: "Références disponibles" },
                    { value: "2 500+", label: "Clients servis" },
                    { value: "24h", label: "Livraison Grand Dakar" },
                    { value: "6j/7", label: "Équipe à votre écoute" },
                  ].map((stat, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                      <div className="text-xl font-black text-white">{stat.value}</div>
                      <div className="text-[10px] text-emerald-200/90 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Trust badges */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Truck, title: "Livraison assurée", desc: "Keur Massar, Dakar & régions" },
                { icon: ShieldCheck, title: "Qualité contrôlée", desc: "Produits vérifiés et pesés" },
                { icon: BadgePercent, title: "Prix de gros", desc: "Tarifs dégressifs dès 10 unités" },
                { icon: Phone, title: "Ligne directe", desc: `Conseils au ${storePhone}` },
              ].map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{badge.title}</div>
                      <div className="text-[10px] text-slate-500">{badge.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Categories strip */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Nos rayons <span className="text-emerald-600">d'activité</span>
              </h2>
              <button
                onClick={() => goTo("catalog")}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                Tout voir <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {categories
                .filter((c) => c !== "all")
                .map((cat) => {
                  const count = products.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        goTo("catalog");
                      }}
                      className="px-4 py-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-xs font-bold text-slate-700 whitespace-nowrap"
                    >
                      {cat}
                      <span className="ml-2 text-[10px] font-semibold text-slate-400">({count})</span>
                    </button>
                  );
                })}
            </div>
          </section>

          {/* Featured products */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Produits <span className="text-emerald-600">populaires</span>
              </h2>
              <button
                onClick={() => goTo("catalog")}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Voir les {products.length} produits <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  currency={currency}
                  isWishlisted={wishlist.includes(prod.id)}
                  onAddToCart={() => addToCart(prod, 1)}
                  onQuickView={() => setQuickViewProduct(prod)}
                  onToggleWishlist={() => toggleWishlist(prod.id)}
                />
              ))}
            </div>
          </section>

          {/* Promo band */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12">
            <div className="relative overflow-hidden rounded-3xl">
              <img src="images/shop-counter.jpg" alt="Intérieur boutique" className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-900/85 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="px-6 sm:px-10 max-w-xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/20 border border-lime-300/30 text-lime-200 text-[10px] font-bold uppercase tracking-wider">
                    <BadgePercent className="w-3 h-3" /> Offre de bienvenue
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    -10% sur votre première commande en ligne
                  </h3>
                  <p className="text-emerald-100/90 text-sm">
                    Utilisez le code <strong className="font-mono text-lime-300">YARWAYE10</strong> lors de la validation
                    de votre panier. Cumulable avec la livraison offerte dès 100 000 FCFA.
                  </p>
                  <button
                    onClick={() => goTo("catalog")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 font-bold text-xs shadow-lg transition-colors"
                  >
                    J'en profite <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Une expertise <span className="text-emerald-600">multisectorielle</span>
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                Agro Service Yarwaye accompagne producteurs, commerçants, restaurateurs et entreprises du bâtiment sur
                l'ensemble de la chaîne de valeur.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SERVICES.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <div
                    key={idx}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className="h-32 overflow-hidden">
                      <img
                        src={service.img}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{service.title}</h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{service.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Delivery zones */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Zones & frais de <span className="text-emerald-600">livraison</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Nos livreurs interviennent quotidiennement sur le Grand Dakar. Pour toute commande supérieure à
                    100 000 FCFA, la livraison est entièrement offerte dans les zones urbaines.
                  </p>
                  <button
                    onClick={() => openWhatsApp("Bonjour Agro Service YARWAYE ! Je souhaite un devis de livraison.")}
                    className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Demander un devis livraison
                  </button>
                </div>

                <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ZONES.map((z) => (
                    <div
                      key={z.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-xs text-slate-800">{z.name}</span>
                        </div>
                        <span
                          className={`text-xs font-black ${
                            z.fee === 0 ? "text-emerald-600" : "text-slate-800"
                          }`}
                        >
                          {z.fee === 0 ? "Gratuit" : formatMoney(z.fee, currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" /> Délai indicatif : {z.delay}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center mb-8">
              Ils nous font <span className="text-emerald-600">confiance</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  name: "Mamadou Ndiaye",
                  role: "Agriculteur — Keur Massar",
                  text: "Des engrais de qualité livrés directement à ma parcelle et des conseils agronomiques vraiment utiles. Le paiement Wave au 767866536 est très pratique.",
                },
                {
                  name: "Awa Sarr",
                  role: "Gérante de boulangerie — Guédiawaye",
                  text: "Je m'approvisionne chaque semaine en farine et en sucre. Les tarifs de gros sont compétitifs et la livraison est toujours ponctuelle.",
                },
                {
                  name: "Cheikh Fall",
                  role: "Entreprise de BTP — Dakar",
                  text: "Ciment et fers à béton livrés sur chantier sans retard. Une équipe sérieuse avec laquelle nous travaillons depuis deux ans.",
                },
              ].map((testimonial, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <Quote className="w-6 h-6 text-emerald-200 mb-3" />
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">"{testimonial.text}"</p>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="font-bold text-xs text-slate-900">{testimonial.name}</div>
                    <div className="text-[10px] text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-8">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center mb-6">
              Questions <span className="text-emerald-600">fréquentes</span>
            </h2>

            <div className="space-y-2.5">
              {FAQ.map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-xs font-bold text-slate-800">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                        openFaq === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* =============================== CATALOG =============================== */}
      {view === "catalog" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters sidebar */}
            <aside className="lg:w-64 shrink-0 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Filtres</h3>

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Mot-clé..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Categories */}
                <div>
                  <p className="text-[11px] font-bold text-slate-600 mb-2">Catégories</p>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                          selectedCategory === cat
                            ? "bg-emerald-600 text-white font-bold"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {cat === "all" ? "Toutes les catégories" : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max price */}
                <div>
                  <p className="text-[11px] font-bold text-slate-600 mb-2">
                    Prix maximum : <span className="text-emerald-700">{formatMoney(maxPrice, currency)}</span>
                  </p>
                  <input
                    type="range"
                    min={3000}
                    max={200000}
                    step={1000}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                {/* Availability */}
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  Uniquement les articles en stock
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWishlistOnly}
                    onChange={(e) => setShowWishlistOnly(e.target.checked)}
                    className="w-4 h-4 accent-rose-500"
                  />
                  Mes favoris uniquement ({wishlist.length})
                </label>

                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                    setMaxPrice(200000);
                    setOnlyAvailable(false);
                    setShowWishlistOnly(false);
                  }}
                  className="w-full py-2 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>

              {/* Help card */}
              <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-5 rounded-2xl text-white">
                <Phone className="w-5 h-5 text-emerald-300 mb-2" />
                <h4 className="font-bold text-xs">Besoin d'aide pour choisir ?</h4>
                <p className="text-[11px] text-emerald-100/85 mt-1">
                  Nos conseillers vous répondent au {storePhone} du lundi au samedi.
                </p>
                <a
                  href={`tel:${storePhone}`}
                  className="mt-3 w-full py-2 bg-white/15 hover:bg-white/25 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3 h-3" /> Appeler maintenant
                </a>
              </div>
            </aside>

            {/* Products */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h1 className="text-xl font-black text-slate-900">
                    {selectedCategory === "all" ? "Tous nos produits" : selectedCategory}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {filteredProducts.length} produit(s) trouvé(s) • Prix de gros automatiques dès 10 unités
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Trier par :</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="relevance">Pertinence</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="name">Nom (A → Z)</option>
                    <option value="newest">Nouveautés</option>
                  </select>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                  <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="font-bold text-sm text-slate-700">Aucun produit ne correspond à votre recherche</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Essayez d'ajuster vos filtres ou contactez-nous au {storePhone} pour une commande sur mesure.
                  </p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("all");
                      setMaxPrice(200000);
                      setOnlyAvailable(false);
                      setShowWishlistOnly(false);
                    }}
                    className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                  >
                    Réinitialiser la recherche
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      currency={currency}
                      isWishlisted={wishlist.includes(prod.id)}
                      onAddToCart={() => addToCart(prod, 1)}
                      onQuickView={() => setQuickViewProduct(prod)}
                      onToggleWishlist={() => toggleWishlist(prod.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =============================== SERVICES ============================== */}
      {view === "services" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Nos <span className="text-emerald-600">services</span> aux professionnels et particuliers
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Bien plus qu'une boutique : Agro Service Yarwaye est un partenaire intégré pour vos approvisionnements,
              votre production et vos chantiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SERVICES.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div key={idx} className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col">
                  <div className="h-40 overflow-hidden">
                    <img src={service.img} alt={service.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{service.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{service.desc}</p>
                    <button
                      onClick={() =>
                        openWhatsApp(
                          `Bonjour Agro Service YARWAYE ! Je souhaite des informations sur le service : ${service.title}.`
                        )
                      }
                      className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      Demander ce service <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 text-center text-white">
            <h2 className="text-xl font-black">Un projet spécifique ? Parlons-en !</h2>
            <p className="text-emerald-100/90 text-sm mt-2 max-w-xl mx-auto">
              Contrats d'approvisionnement régulier, livraisons programmées, prix négociés au volume : notre équipe
              construit la solution adaptée à votre activité.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <a
                href={`tel:${storePhone}`}
                className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-900 rounded-2xl font-bold text-xs shadow-lg"
              >
                <Phone className="w-4 h-4" /> Appeler le {storePhone}
              </a>
              <button
                onClick={() => goTo("contact")}
                className="flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 rounded-2xl font-bold text-xs border border-white/20"
              >
                <Send className="w-4 h-4" /> Envoyer une demande de devis
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =============================== TRACKING ============================== */}
      {view === "tracking" && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <Truck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Suivre ma commande</h1>
            <p className="text-sm text-slate-500 mt-1">
              Entrez votre numéro de commande (ex : ASY-2025-001) et votre numéro de téléphone.
            </p>
          </div>

          <form
            onSubmit={handleTrackOrder}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de commande *</label>
                <input
                  required
                  value={trackRef}
                  onChange={(e) => setTrackRef(e.target.value)}
                  placeholder="ASY-2025-001"
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Téléphone (optionnel)
                </label>
                <input
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  placeholder="767866536"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isTracking}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isTracking ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isTracking ? "Recherche en cours..." : "Localiser ma commande"}
            </button>

            {trackNotFound && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                Aucune commande trouvée avec ces informations. Vérifiez votre numéro de commande ou contactez-nous au{" "}
                <strong>{storePhone}</strong>.
              </div>
            )}
          </form>

          {trackedOrder && (
            <div className="mt-6 bg-white p-6 rounded-3xl border border-emerald-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-lg text-slate-900">{trackedOrder.orderNumber}</h2>
                  <p className="text-xs text-slate-500">
                    Commandée le {formatDate(trackedOrder.createdAt)} • {trackedOrder.customerName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Montant total</p>
                  <p className="font-black text-lg text-emerald-700">{formatMoney(trackedOrder.total, currency)}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-0">
                {[
                  {
                    label: "Commande reçue",
                    desc: "Votre commande a été enregistrée dans notre système",
                    done: true,
                  },
                  {
                    label: "Paiement confirmé",
                    desc:
                      trackedOrder.paymentStatus === "paid"
                        ? "Paiement validé par notre caisse"
                        : "En attente de confirmation du paiement",
                    done: trackedOrder.paymentStatus === "paid",
                  },
                  {
                    label: "Préparation & pesée",
                    desc: "Les articles sont préparés dans notre dépôt de Malika",
                    done: trackedOrder.orderStatus !== "processing",
                  },
                  {
                    label:
                      trackedOrder.orderStatus === "cancelled"
                        ? "Commande annulée"
                        : "Livrée / Prête au retrait",
                    desc:
                      trackedOrder.orderStatus === "cancelled"
                        ? "Cette commande a été annulée ou remboursée"
                        : "Votre commande vous attend ou a été livrée",
                    done: trackedOrder.orderStatus === "completed",
                  },
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          step.done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {step.done ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                      </div>
                      {idx < 3 && (
                        <div className={`w-0.5 h-8 ${step.done ? "bg-emerald-500" : "bg-slate-200"}`} />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className={`text-xs font-bold ${step.done ? "text-slate-900" : "text-slate-400"}`}>
                        {step.label}
                      </p>
                      <p className="text-[11px] text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Une question sur cette commande ? Appelez-nous au{" "}
                <a href={`tel:${storePhone}`} className="font-bold text-emerald-700 underline">
                  {storePhone}
                </a>{" "}
                en précisant la référence <strong>{trackedOrder.orderNumber}</strong>.
              </div>
            </div>
          )}
        </section>
      )}

      {/* =============================== ACCOUNT =============================== */}
      {view === "account" && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <User className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Mon espace client</h1>
            <p className="text-sm text-slate-500 mt-1">
              Retrouvez vos commandes, vos avantages fidélité et gérez vos informations de livraison.
            </p>
          </div>

          {!accCustomer ? (
            <form
              onSubmit={handleAccountLookup}
              className="max-w-md mx-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Votre numéro de téléphone client
                </label>
                <input
                  required
                  value={accPhone}
                  onChange={(e) => setAccPhone(e.target.value)}
                  placeholder="Ex : 767866536 ou 77 123 45 67"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Utilisez le numéro utilisé lors de vos commandes chez Agro Service Yarwaye.
                </p>
              </div>

              <button
                type="submit"
                disabled={accLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {accLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {accLoading ? "Recherche de votre compte..." : "Accéder à mon espace"}
              </button>

              {accError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  {accError}
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-6">
              {/* Client summary */}
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-emerald-200 text-xs">Bonjour,</p>
                    <h2 className="text-xl font-black">{accCustomer.name}</h2>
                    <p className="text-emerald-100/80 text-xs mt-0.5">
                      {accCustomer.phone} {accCustomer.address ? `• ${accCustomer.address}` : ""}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setAccCustomer(null);
                      setAccOrders([]);
                      setAccPhone("");
                    }}
                    className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold border border-white/20"
                  >
                    Changer de compte
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                    <p className="text-emerald-200 text-[10px] uppercase tracking-wider">Commandes</p>
                    <p className="text-lg font-black">{accOrders.length}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                    <p className="text-emerald-200 text-[10px] uppercase tracking-wider">Points fidélité</p>
                    <p className="text-lg font-black">{accCustomer.loyaltyPoints}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                    <p className="text-emerald-200 text-[10px] uppercase tracking-wider">Solde crédit</p>
                    <p className="text-lg font-black">
                      {formatMoney(accCustomer.creditBalance, currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile form */}
              <form
                onSubmit={handleProfileSave}
                className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Mes informations personnelles</h3>
                  {profileMsg && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {profileMsg}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet</label>
                    <input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Adresse de livraison</label>
                    <input
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {profileSaving ? "Enregistrement..." : "Mettre à jour mes informations"}
                </button>
              </form>

              {/* Order history */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6">
                <h3 className="font-bold text-sm text-slate-900 mb-4">Mes commandes récentes</h3>

                {accOrders.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">
                    <ShoppingCart className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs">Aucune commande enregistrée pour le moment.</p>
                    <button
                      onClick={() => goTo("catalog")}
                      className="mt-3 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                    >
                      Découvrir le catalogue
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accOrders.slice(0, 8).map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-900 font-mono">{order.orderNumber}</p>
                          <p className="text-[10px] text-slate-500">
                            {formatDate(order.createdAt)} • {order.paymentMethod === "wave_om_767866536" ? `Wave/OM ${storePhone}` : order.paymentMethod}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              order.orderStatus === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.orderStatus === "cancelled"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.orderStatus === "completed"
                              ? "Livrée"
                              : order.orderStatus === "cancelled"
                              ? "Annulée"
                              : "En préparation"}
                          </span>
                          <span className="font-black text-sm text-slate-900">
                            {formatMoney(order.total, currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* =============================== CONTACT =============================== */}
      {view === "contact" && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Contactez <span className="text-emerald-600">Agro Service Yarwaye</span>
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Une question, un devis professionnel, une réclamation ou une opportunité de partenariat ? Notre équipe
              vous répond sous 24 heures ouvrées.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact info */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Adresse du siège & dépôt</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {settings?.address ||
                        "Malika QRT Malika / MER - BP 17000 - Keur Massar, Dakar, Sénégal"}
                    </p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Malika+Keur+Massar+Dakar"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-emerald-700 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      Voir sur Google Maps <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Téléphone / WhatsApp / Wave / OM</h3>
                    <a
                      href={`tel:${storePhone}`}
                      className="text-lg font-black font-mono text-emerald-700 hover:underline"
                    >
                      {storePhone}
                    </a>
                    <p className="text-[11px] text-slate-500">
                      Virements marchands Wave et Orange Money acceptés sur ce numéro.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Email professionnel</h3>
                    <a
                      href={`mailto:${settings?.email || "contact@agroserviceyarwaye.sn"}`}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      {settings?.email || "contact@agroserviceyarwaye.sn"}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Horaires d'ouverture</h3>
                    <div className="text-xs text-slate-600 space-y-0.5 mt-1">
                      <p>Lundi — Vendredi : 08h00 — 19h00</p>
                      <p>Samedi : 08h00 — 18h00</p>
                      <p>Dimanche : 09h00 — 13h00 (urgence uniquement)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    openWhatsApp("Bonjour Agro Service YARWAYE ! Je souhaite obtenir un devis pour ma commande.")
                  }
                  className="flex items-center justify-center gap-2 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs shadow-md"
                >
                  <MessageCircle className="w-4 h-4" /> Devis via WhatsApp
                </button>
                <a
                  href={`tel:${storePhone}`}
                  className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md"
                >
                  <Phone className="w-4 h-4" /> Appeler maintenant
                </a>
              </div>
            </div>

            {/* Contact form */}
            <form
              onSubmit={openContactWhatsApp}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <h2 className="font-bold text-sm text-slate-900">Envoyer une demande détaillée</h2>
              <p className="text-[11px] text-slate-500">
                Votre message sera transmis directement à notre équipe via WhatsApp pour un traitement rapide.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Votre nom *</label>
                  <input
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nom et prénom"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone *</label>
                  <input
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="77 000 00 00"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Objet de la demande</label>
                <select
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option>Demande de devis professionnel</option>
                  <option>Approvisionnement régulier / Contrat</option>
                  <option>Question sur une commande en cours</option>
                  <option>Livraison & transport</option>
                  <option>Partenariat / Fournisseur</option>
                  <option>Réclamation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Votre message *</label>
                <textarea
                  required
                  rows={5}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Décrivez votre besoin : produits, quantités, délai souhaité, lieu de livraison..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Envoyer ma demande à Agro Service Yarwaye
              </button>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Vos informations restent confidentielles et ne sont utilisées que pour le traitement de votre demande.
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ================================ FOOTER =============================== */}
      <footer className="bg-slate-900 text-slate-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-lime-500 flex items-center justify-center text-white font-black">
                  ASY
                </div>
                <div>
                  <div className="font-black text-white text-sm">AGRO SERVICE YARWAYE</div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    Agriculture • Agroalimentaire • BTP
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Malika QRT Malika / MER - BP 17000 - Keur Massar, Dakar, Sénégal. Votre partenaire de confiance pour
                l'approvisionnement, la transformation et la distribution de produits agricoles et alimentaires.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${storePhone}`}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Phone className="w-3 h-3" /> {storePhone}
                </a>
                <button
                  onClick={() =>
                    openWhatsApp("Bonjour Agro Service YARWAYE !")
                  }
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Nos rayons</h4>
              <ul className="space-y-2 text-xs">
                {categories
                  .filter((c) => c !== "all")
                  .map((cat) => (
                    <li key={cat}>
                      <button
                        onClick={() => {
                          setSelectedCategory(cat);
                          goTo("catalog");
                        }}
                        className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-3 h-3" /> {cat}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Liens utiles</h4>
              <ul className="space-y-2 text-xs">
                {[
                  { label: "Catalogue complet", view: "catalog" as View },
                  { label: "Suivre ma commande", view: "tracking" as View },
                  { label: "Mon espace client", view: "account" as View },
                  { label: "Nos services", view: "services" as View },
                  { label: "Contact & Devis", view: "contact" as View },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => goTo(link.view)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3 h-3" /> {link.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={onSwitchToDashboard}
                    className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3 h-3" /> Espace gérance (staff)
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Horaires & contact</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>
                    Lun — Ven : 08h00 — 19h00
                    <br />
                    Sam : 08h00 — 18h00 • Dim : 09h00 — 13h00
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Malika QRT Malika / MER, BP 17000, Keur Massar, Dakar</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <a href={`mailto:${settings?.email || "contact@agroserviceyarwaye.sn"}`} className="hover:text-emerald-400">
                    {settings?.email || "contact@agroserviceyarwaye.sn"}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Paiements sécurisés : Espèces, Wave, Orange Money, Carte bancaire</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} <strong className="text-slate-400">AGRO SERVICE YARWAYE</strong> — Tous
              droits réservés. RCCM Dakar • NINEA sur demande.
            </p>
            <p className="text-[11px] text-slate-500">
              Service client & commandes :{" "}
              <a href={`tel:${storePhone}`} className="text-emerald-400 font-bold hover:underline font-mono">
                {storePhone}
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* ============================== CART DRAWER ============================ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />

          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-sm">
                  {checkoutStep === "done"
                    ? "Commande confirmée"
                    : checkoutStep === "cart"
                    ? "Mon panier"
                    : checkoutStep === "infos"
                    ? "Informations de livraison"
                    : "Mode de paiement"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  if (checkoutStep !== "done") setCheckoutStep("cart");
                }}
                className="p-1.5 hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* SUCCESS */}
              {checkoutStep === "done" && orderSuccess ? (
                <div className="p-6 space-y-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">Merci pour votre commande !</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Votre commande <strong className="font-mono text-emerald-700">{orderSuccess.orderNumber}</strong>{" "}
                      a bien été enregistrée par Agro Service Yarwaye.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-left text-xs space-y-1.5">
                    <p className="font-bold text-teal-900 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> Finaliser mon paiement
                    </p>
                    <p className="text-teal-800">
                      Envoyez <strong>{formatMoney(orderSuccess.total, currency)}</strong> par Wave ou Orange Money au{" "}
                      <strong className="font-mono underline">{storePhone}</strong> avec la référence{" "}
                      <strong className="font-mono">{orderSuccess.orderNumber}</strong>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        openWhatsApp(
                          `Bonjour Agro Service YARWAYE ! Je viens de passer la commande ${orderSuccess.orderNumber} d'un montant de ${formatMoney(
                            orderSuccess.total,
                            currency
                          )}. Voici ma confirmation.`
                        )
                      }
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Confirmer via WhatsApp
                    </button>
                    <button
                      onClick={() => {
                        setCheckoutStep("cart");
                        setIsCartOpen(false);
                        goTo("tracking");
                        setTrackRef(orderSuccess.orderNumber);
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4" /> Suivre ma commande
                    </button>
                    <button
                      onClick={() => {
                        setCheckoutStep("cart");
                        setIsCartOpen(false);
                        goTo("catalog");
                      }}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl"
                    >
                      Continuer mes achats
                    </button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="py-20 text-center space-y-3 px-6">
                  <ShoppingCart className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="font-bold text-sm text-slate-700">Votre panier est vide</p>
                  <p className="text-xs text-slate-400">
                    Parcourez notre catalogue de céréales, intrants agricoles, produits agroalimentaires et matériaux
                    BTP.
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      goTo("catalog");
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                  >
                    Découvrir les produits
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Stepper */}
                  {checkoutStep !== "cart" && (
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white">1. Livraison</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <span
                        className={`px-2.5 py-1 rounded-lg ${
                          checkoutStep === "payment" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        2. Paiement
                      </span>
                    </div>
                  )}

                  {/* Cart items */}
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-200 bg-slate-50/50"
                      >
                        <img
                          src={
                            item.product.imageUrl ||
                            "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&auto=format&fit=crop&q=80"
                          }
                          alt={item.product.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {formatMoney(item.product.sellingPrice, currency)} / {item.product.unit}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              onClick={() => updateCartQty(item.product.id, -1)}
                              className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[11px] font-bold w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.product.id, 1)}
                              className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="w-5 h-5 rounded-md text-rose-500 hover:bg-rose-50 flex items-center justify-center ml-1"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">
                            {formatMoney(item.product.sellingPrice * item.quantity, currency)}
                          </p>
                          {item.quantity >= 10 && (
                            <p className="text-[9px] text-emerald-700 font-bold">Prix de gros appliqué</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo */}
                  {checkoutStep === "cart" && (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <BadgePercent className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="Code promo (ex : YARWAYE10)"
                          className="w-full pl-9 pr-3 py-2 text-[11px] border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>
                      <button
                        onClick={applyPromo}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl"
                      >
                        Appliquer
                      </button>
                    </div>
                  )}

                  {appliedPromo && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {appliedPromo} — {PROMOS[appliedPromo]?.label}
                      </p>
                      <button
                        onClick={() => setAppliedPromo(null)}
                        className="text-emerald-700 text-[10px] font-bold underline"
                      >
                        Retirer
                      </button>
                    </div>
                  )}

                  {/* Infos form */}
                  {checkoutStep === "infos" && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Nom complet du destinataire *
                        </label>
                        <input
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ex : Ousmane Yarwaye"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Téléphone de contact *
                        </label>
                        <input
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="767866536"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Email (optionnel)
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="client@email.sn"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Zone de livraison / retrait
                        </label>
                        <select
                          value={deliveryZone}
                          onChange={(e) => setDeliveryZone(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                        >
                          {ZONES.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.name} — {z.fee === 0 ? "Gratuit" : formatMoney(z.fee, currency)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Adresse précise / repère
                        </label>
                        <textarea
                          rows={2}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Quartier, rue, point de repère, nom du contact sur place..."
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Précisions pour la commande
                        </label>
                        <textarea
                          rows={2}
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="Ex : livraison le matin, facture au nom de l'entreprise..."
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment */}
                  {checkoutStep === "payment" && (
                    <div className="space-y-2.5 pt-1">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        Choisissez votre mode de règlement
                      </p>

                      {[
                        {
                          id: "wave_om_767866536" as const,
                          title: `Wave / Orange Money — ${storePhone}`,
                          desc: "Virement instantané vers notre compte marchand. Instructions envoyées après validation.",
                          icon: MessageCircle,
                          color: "teal",
                        },
                        {
                          id: "cash" as const,
                          title: "Espèces à la livraison",
                          desc: "Réglez en espèces directement au livreur à la réception de votre commande.",
                          icon: Package,
                          color: "emerald",
                        },
                        {
                          id: "card" as const,
                          title: "Carte bancaire / TPE",
                          desc: "Paiement par carte bancaire sur notre terminal de paiement électronique.",
                          icon: ShieldCheck,
                          color: "slate",
                        },
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => setPaymentMethod(option.id)}
                            className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                              paymentMethod === option.id
                                ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                  paymentMethod === option.id
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-slate-800">{option.title}</p>
                                <p className="text-[9.5px] text-slate-500 leading-snug">{option.desc}</p>
                              </div>
                              {paymentMethod === option.id && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto" />
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {paymentMethod === "wave_om_767866536" && (
                        <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-[10px] text-teal-800">
                          📲 Après validation, envoyez <strong>{formatMoney(total, currency)}</strong> au{" "}
                          <strong className="font-mono underline">{storePhone}</strong> en précisant votre numéro de
                          commande.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer totals & actions */}
            {checkoutStep !== "done" && cart.length > 0 && (
              <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50/60">
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total</span>
                    <span className="font-semibold">{formatMoney(subtotal, currency)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Remise ({appliedPromo})</span>
                      <span className="font-semibold">- {formatMoney(discount, currency)}</span>
                    </div>
                  )}

                  {checkoutStep !== "cart" && (
                    <div className="flex justify-between text-slate-600">
                      <span>Livraison — {zone.name}</span>
                      <span className="font-semibold">
                        {deliveryFee === 0 ? "Offerte" : formatMoney(deliveryFee, currency)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-800 text-xs uppercase">Total</span>
                    <span className="text-xl font-black text-emerald-700">{formatMoney(total, currency)}</span>
                  </div>
                </div>

                {checkoutStep === "cart" && (
                  <button
                    onClick={() => setCheckoutStep("infos")}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2"
                  >
                    Commander maintenant <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {checkoutStep === "infos" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCheckoutStep("cart")}
                      className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-2xl"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => {
                        if (!customerName.trim() || !customerPhone.trim()) {
                          alert("Veuillez renseigner votre nom et votre numéro de téléphone.");
                          return;
                        }
                        setCheckoutStep("payment");
                      }}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2"
                    >
                      Continuer vers le paiement <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {checkoutStep === "payment" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCheckoutStep("infos")}
                      className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-2xl"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={isSubmittingOrder}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingOrder ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {isSubmittingOrder
                        ? "Validation en cours..."
                        : `Confirmer la commande — ${formatMoney(total, currency)}`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================ PRODUCT MODAL ============================ */}
      <StorefrontProductModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        settings={settings}
        isWishlisted={quickViewProduct ? wishlist.includes(quickViewProduct.id) : false}
        onAddToCart={(product, quantity) => addToCart(product, quantity)}
        onToggleWishlist={toggleWishlist}
      />

      {/* Floating WhatsApp button */}
      <button
        onClick={() =>
          openWhatsApp(
            "Bonjour Agro Service YARWAYE ! 👋 Je vous contacte depuis votre boutique en ligne. J'aimerais des informations sur vos produits et services."
          )
        }
        className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
        title="Discuter sur WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}

/* ============================== Product Card =============================== */

interface ProductCardProps {
  product: Product;
  currency: string;
  isWishlisted: boolean;
  onAddToCart: () => void;
  onQuickView: () => void;
  onToggleWishlist: () => void;
}

function ProductCard({
  product,
  currency,
  isWishlisted,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
}: ProductCardProps) {
  const bulkPrice = getBulkPrice(product);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={
            product.imageUrl ||
            "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80"
          }
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          <span className="px-2 py-0.5 rounded-md bg-white/90 text-slate-700 text-[9px] font-bold shadow-xs">
            {product.category}
          </span>
          {isLowStock && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold shadow">
              Stock limité
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={onToggleWishlist}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition-colors"
          title={isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart
            className={`w-3.5 h-3.5 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-500"}`}
          />
        </button>

        {/* Quick view overlay */}
        <button
          onClick={onQuickView}
          className="absolute inset-x-2.5 bottom-2.5 py-2 bg-slate-900/85 hover:bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5"
        >
          <Eye className="w-3 h-3" /> Voir la fiche détaillée
        </button>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/55 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-white/90 text-slate-800 text-[10px] font-bold rounded-lg">
              Rupture — Sur commande
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 min-h-8">{product.name}</h3>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">Réf. {product.sku}</p>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Prix détail</p>
              <p className="text-sm font-black text-emerald-700">{formatMoney(product.sellingPrice, currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Prix gros (10+)</p>
              <p className="text-xs font-bold text-slate-800">{formatMoney(bulkPrice, currency)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">
              Stock :{" "}
              <strong className={isOutOfStock ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-emerald-600"}>
                {isOutOfStock ? "épuisé" : `${product.stock} ${product.unit}`}
              </strong>
            </span>
            <span className="text-slate-400">par {product.unit}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3 h-3" /> Panier
          </button>
          <button
            onClick={onQuickView}
            className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Eye className="w-3 h-3" /> Détails
          </button>
        </div>
      </div>
    </div>
  );
}
