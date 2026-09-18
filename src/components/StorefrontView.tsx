"use client";
/**
 * VITRINE CLIENT (e-commerce) — src/components/StorefrontView.tsx
 * 
 * Interface publique destinée aux clients d'AGRO SERVICE YARWAYE. Six espaces :
 *   Catalogue : recherche, filtres, tri, vue grille/liste, fiche produit.
 *   Services  : les 6 pôles d'activité de l'entreprise (agro, BTP, resto...).
 *   Suivi     : consultation d'une commande par référence ou par téléphone.
 *   Compte    : profil mémorisé (localStorage), favoris, historique,
 *               bouton "recommander".
 *   Contact   : demande de devis / réservation (POST /api/inquiries).
 *   À propos  : adresse Malika / Keur Massar et contacts.
 * Le panier permet de payer par Wave/OM 767866536, espèces ou crédit, avec
 * codes promo, livraison ou retrait magasin, puis d'imprimer le ticket.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Product, StoreSettings, Order } from "@/types";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  Phone,
  Search,
  ShoppingCart,
  CheckCircle2,
  X,
  MessageCircle,
  Truck,
  ShieldCheck,
  Sparkles,
  Heart,
  Star,
  Filter,
  MapPin,
  Clock,
  User,
  Package,
  Minus,
  Plus,
  Trash2,
  Info,
  Home,
  UtensilsCrossed,
  HardHat,
  Wheat,
  Wrench,
  ChevronRight,
  BadgePercent,
  RefreshCw,
  Share2,
  Copy,
  ExternalLink,
  Mail,
  Send,
  Eye,
  LayoutGrid,
  List,
  ArrowUpDown,
  Building2,
  CircleHelp,
} from "lucide-react";

interface StorefrontViewProps {
  products: Product[];
  settings: StoreSettings | null;
  onSwitchToDashboard: () => void;
  onOrderPlaced: (order: Order) => void;
}

type CartItem = { product: Product; quantity: number };
type SortKey = "popular" | "price_asc" | "price_desc" | "name" | "stock";
type ClientTab = "catalog" | "services" | "track" | "account" | "contact" | "about";

const SERVICE_OFFERS = [
  {
    id: "agri",
    icon: Wheat,
    title: "Agriculture & produits locaux",
    desc: "Riz, légumes, semences et produits bruts issus des filières de Malika / Keur Massar.",
    cta: "Voir les produits agricoles",
    category: "Produits Agricoles",
  },
  {
    id: "transform",
    icon: Package,
    title: "Transformation agroalimentaire",
    desc: "Huiles, farines et produits transformés conditionnés par AGRO SERVICE YARWAYE.",
    cta: "Voir la transformation",
    category: "Transformation Agroalimentaire",
  },
  {
    id: "food",
    icon: UtensilsCrossed,
    title: "Pâtisserie & restauration",
    desc: "Menus du jour, plateaux pâtisserie et boissons maison à emporter ou sur place.",
    cta: "Commander un menu",
    category: "Pâtisserie & Restauration",
  },
  {
    id: "btp",
    icon: HardHat,
    title: "BTP & matériaux",
    desc: "Ciment, kits chantier et fournitures pour vos travaux à Keur Massar et environs.",
    cta: "Voir le rayon BTP",
    category: "BTP & Matériaux",
  },
  {
    id: "services",
    icon: Wrench,
    title: "Prestations de services",
    desc: "Labour, préparation de parcelles et services sur devis pour particuliers et pros.",
    cta: "Demander un devis",
    category: "Prestations de Services",
  },
  {
    id: "commerce",
    icon: ShoppingBag,
    title: "Commerce général",
    desc: "Achat et vente de marchandises courantes pour ménages, restaurants et chantiers.",
    cta: "Parcourir le catalogue",
    category: "Commerce Général",
  },
];

export function StorefrontView({
  products,
  settings,
  onSwitchToDashboard,
  onOrderPlaced,
}: StorefrontViewProps) {
  const storePhone = settings?.phone || "767866536";
  const currency = settings?.currency || "FCFA";
  const storeName = settings?.storeName || "AGRO SERVICE YARWAYE";
  const storeAddress =
    settings?.address || "Malika Qrt Malika / Mer - BP 17000 - Keur Massar, Dakar, Sénégal";

  const [activeTab, setActiveTab] = useState<ClientTab>("catalog"); // espace actif de la vitrine
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qtyInModal, setQtyInModal] = useState(1);

  // Panier / étape de commande : informations client + paiement.
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"wave_om_767866536" | "cash" | "credit">("wave_om_767866536");
  const [orderNote, setOrderNote] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Suivi de commande (par référence et/ou téléphone) + historique du compte.
  const [trackOrderNum, setTrackOrderNum] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackedOrders, setTrackedOrders] = useState<Order[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Formulaire de demande de devis / réservation / chantier.
  const [inquiry, setInquiry] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "Demande de devis",
    type: "devis",
    message: "",
  });
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [inquiryDone, setInquiryDone] = useState(false);

  // Au montage : on restaure favoris, panier et profil stockés dans le navigateur
  // (localStorage) pour que le client retrouve sa session d achat.
  useEffect(() => {
    try {
      const fav = localStorage.getItem("yarwaye_favorites");
      if (fav) setFavorites(JSON.parse(fav));
      const profile = localStorage.getItem("yarwaye_client_profile");
      if (profile) {
        const p = JSON.parse(profile);
        setCustomerName(p.name || "");
        setCustomerPhone(p.phone || "");
        setCustomerEmail(p.email || "");
        setDeliveryAddress(p.address || "");
        setTrackPhone(p.phone || "");
      }
      const savedCart = localStorage.getItem("yarwaye_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as { productId: number; quantity: number }[];
        const restored = parsed
          .map((c) => {
            const product = products.find((p) => p.id === c.productId);
            return product ? { product, quantity: c.quantity } : null;
          })
          .filter(Boolean) as CartItem[];
        if (restored.length) setCart(restored);
      }
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    localStorage.setItem("yarwaye_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(
      "yarwaye_cart",
      JSON.stringify(cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })))
    );
  }, [cart]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Catégories dérivées du catalogue (servent aussi de filtres).
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const maxCatalogPrice = useMemo(
    () => Math.max(...products.map((p) => p.sellingPrice), 0),
    [products]
  );

  // Traitement complet du catalogue : recherche, catégorie, stock, prix max, puis tri.
  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (!p.isActive) return false;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchStock = !onlyInStock || p.stock > 0;
      const matchPrice = maxPrice === "" || p.sellingPrice <= Number(maxPrice);
      return matchSearch && matchCat && matchStock && matchPrice;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === "price_asc") return a.sellingPrice - b.sellingPrice;
      if (sortKey === "price_desc") return b.sellingPrice - a.sellingPrice;
      if (sortKey === "name") return a.name.localeCompare(b.name, "fr");
      if (sortKey === "stock") return b.stock - a.stock;
      // popular: higher stock first then price
      return b.stock - a.stock || a.sellingPrice - b.sellingPrice;
    });
    return list;
  }, [products, search, selectedCategory, onlyInStock, maxPrice, sortKey]);

  const favoriteProducts = products.filter((p) => favorites.includes(p.id)); // liste des favoris du compte
  // Codes promo gérés côté client : YARWAYE10 = -10 %, MALIKA5 = -5 %.
  const promoDiscount =
    promoCode.trim().toUpperCase() === "YARWAYE10"
      ? Math.round(cart.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0) * 0.1)
      : promoCode.trim().toUpperCase() === "MALIKA5"
      ? Math.round(cart.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0) * 0.05)
      : 0;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0);
  const cartTotal = Math.max(0, cartSubtotal - promoDiscount);

  const showToast = (msg: string) => setToast(msg);

  // Enregistre le profil sur l appareil : préremplit les prochaines commandes.
  const saveProfile = (extra?: Partial<{ name: string; phone: string; email: string; address: string }>) => {
    const profile = {
      name: extra?.name ?? customerName,
      phone: extra?.phone ?? customerPhone,
      email: extra?.email ?? customerEmail,
      address: extra?.address ?? deliveryAddress,
    };
    localStorage.setItem("yarwaye_client_profile", JSON.stringify(profile));
  };

  // Met un article en favori (persisté) pour le retrouver dans « Mon compte ».
  const toggleFavorite = (productId: number) => {
    setFavorites((prev) => {
      const next = prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(prev.includes(productId) ? "Retiré des favoris" : "Ajouté aux favoris");
      return next;
    });
  };

  // Ajout au panier en respectant le stock, avec notification légère (toast).
  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      showToast("Article en rupture de stock");
      return;
    }
    setCart((prev) => {
      const exist = prev.find((i) => i.product.id === product.id);
      if (exist) {
        const nextQty = Math.min(product.stock, exist.quantity + quantity);
        return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: nextQty } : i));
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
    showToast(`${product.name} ajouté au panier`);
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const q = i.quantity + delta;
          if (q <= 0) return null;
          if (q > i.product.stock) return i;
          return { ...i, quantity: q };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode("");
  };

  // Ouvre la fiche détaillée d’un article (image, description, quantité).
  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setQtyInModal(1);
  };

  // Fabrique un lien WhatsApp prérempli vers le numéro de la boutique.
  const waLink = (text: string) => {
    const clean = storePhone.replace(/\D/g, "");
    const num = clean.startsWith("221") ? clean : `221${clean}`;
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  };

  // Partage l’article (Web Share API) ou copie le texte si l’API est absente.
  const shareProduct = async (product: Product) => {
    const text = `${product.name} — ${formatMoney(product.sellingPrice, currency)} chez ${storeName}. Contact: ${storePhone}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text });
        return;
      } catch {
        // fallthrough
      }
    }
    await navigator.clipboard.writeText(text);
    showToast("Lien produit copié");
  };

  // FINAL : envoie le panier à /api/orders, mémorise le profil, vide le panier et
  // affiche la confirmation avec les instructions de paiement Wave/OM.
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !customerName.trim() || !customerPhone.trim()) return;
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      showToast("Indiquez une adresse de livraison");
      return;
    }

    setIsSubmitting(true);
    try {
      saveProfile();
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          productSku: i.product.sku,
          unitPrice: i.product.sellingPrice,
          costPrice: i.product.costPrice,
          quantity: i.quantity,
        })),
        subtotal: cartSubtotal,
        discount: promoDiscount,
        tax: 0,
        total: cartTotal,
        paymentMethod,
        paymentStatus: paymentMethod === "credit" ? "pending" : paymentMethod === "wave_om_767866536" ? "pending" : "paid",
        cashierName: "Vitrine client Yarwaye",
        notes: [
          `Commande vitrine (${deliveryType === "delivery" ? "Livraison" : "Retrait magasin"})`,
          deliveryType === "delivery" ? `Adresse: ${deliveryAddress}` : "Retrait à Malika / Keur Massar",
          customerEmail ? `Email: ${customerEmail}` : null,
          orderNote ? `Note client: ${orderNote}` : null,
          promoCode ? `Code promo: ${promoCode.toUpperCase()}` : null,
          paymentMethod === "wave_om_767866536" ? `Paiement Wave/OM attendu sur ${storePhone}` : null,
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
      if (!res.ok) throw new Error(data.error || "Échec de la commande");

      setOrderSuccess(data.order);
      setMyOrders((prev) => [data.order, ...prev]);
      onOrderPlaced(data.order);
      clearCart();
      showToast("Commande enregistrée avec succès");
    } catch (err: any) {
      alert(err.message || "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suivi public : recherche les commandes par référence et/ou téléphone.
  const handleTrack = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!trackOrderNum.trim() && !trackPhone.trim()) {
      showToast("Saisissez un n° de commande ou un téléphone");
      return;
    }
    setIsTracking(true);
    try {
      const params = new URLSearchParams();
      if (trackOrderNum.trim()) params.set("search", trackOrderNum.trim());
      if (trackPhone.trim()) params.set("phone", trackPhone.trim());
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de suivi");
      const list = (data.orders || []) as Order[];
      setTrackedOrders(list);
      if (list.length === 0) showToast("Aucune commande trouvée");
      else setActiveTab("track");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsTracking(false);
    }
  };

  // Compte client : recharge tout l’historique à partir du téléphone enregistré.
  const loadMyOrdersByPhone = async () => {
    if (!customerPhone.trim()) {
      showToast("Enregistrez d'abord votre téléphone dans Mon compte");
      return;
    }
    setIsTracking(true);
    try {
      const res = await fetch(`/api/orders?phone=${encodeURIComponent(customerPhone.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setMyOrders(data.orders || []);
        showToast(`${(data.orders || []).length} commande(s) trouvée(s)`);
      }
    } finally {
      setIsTracking(false);
    }
  };

  // Envoie une demande de devis / réservation (enregistrée chez le gérant).
  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingInquiry(true);
    setInquiryDone(false);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiry),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setInquiryDone(true);
      setInquiry((prev) => ({ ...prev, message: "", subject: "Demande de devis" }));
      showToast("Demande envoyée à AGRO SERVICE YARWAYE");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSendingInquiry(false);
    }
  };

  // « Commander à nouveau » : recharge les articles encore disponibles d’une vente passée.
  const reorderFromOrder = (order: Order) => {
    if (!order.items?.length) {
      showToast("Détails articles indisponibles pour cette commande");
      return;
    }
    let added = 0;
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId && p.isActive);
      if (product && product.stock > 0) {
        addToCart(product, item.quantity);
        added += 1;
      }
    }
    if (added > 0) {
      setIsCartOpen(true);
      showToast(`${added} article(s) rechargé(s) dans le panier`);
    } else {
      showToast("Aucun article disponible pour une nouvelle commande");
    }
  };

  // Traduit le code de paiement en libellé français lisible.
  const paymentLabel = (method: string) => {
    if (method === "wave_om_767866536") return `Wave / OM (${storePhone})`;
    if (method === "cash") return "Espèces";
    if (method === "credit") return "Crédit client";
    if (method === "card") return "Carte bancaire";
    return method;
  };

  // Traduit le statut de la commande en français.
  const statusLabel = (status: string) => {
    if (status === "completed") return "Complétée";
    if (status === "processing") return "En traitement";
    if (status === "cancelled") return "Annulée";
    return status;
  };

  const navItems: { id: ClientTab; label: string; icon: any }[] = [
    { id: "catalog", label: "Catalogue", icon: ShoppingBag },
    { id: "services", label: "Services", icon: Wrench },
    { id: "track", label: "Suivi", icon: Package },
    { id: "account", label: "Mon compte", icon: User },
    { id: "contact", label: "Contact / Devis", icon: MessageCircle },
    { id: "about", label: "À propos", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Notification legere (ajout panier, favori, envoi de devis) */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700">
          {toast}
        </div>
      )}

      {/* Bandeau superior : etat d ouverture + acces rapides tel/WhatsApp/gestion */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
              Ouvert
            </span>
            <span>
              {storeName} — Malika / Keur Massar • Assistance{" "}
              <strong className="font-mono underline">{storePhone}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href={`tel:${storePhone}`} className="hover:text-emerald-300 font-medium">
              Appeler
            </a>
            <span className="text-white/30">|</span>
            <a href={waLink(`Bonjour ${storeName}`)} target="_blank" rel="noreferrer" className="hover:text-emerald-300 font-medium">
              WhatsApp
            </a>
            <span className="text-white/30">|</span>
            <button onClick={onSwitchToDashboard} className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 font-semibold">
              Espace gestion
            </button>
          </div>
        </div>
      </div>

      {/* En-tete fume : logo, recherche globale, favoris, panier */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-xl flex items-center justify-center shadow-md">
              Y
            </div>
            <div className="min-w-0">
              <div className="font-black text-slate-900 truncate">{storeName}</div>
              <div className="text-[11px] text-emerald-700 font-medium truncate">
                Agriculture • Transformation • Commerce • BTP • Restauration
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveTab("catalog");
                }}
                placeholder="Rechercher riz, huile, ciment, menu, labour..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("account");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
              title="Favoris / compte"
            >
              <Heart className={`w-4 h-4 ${favorites.length ? "text-rose-500 fill-rose-500" : "text-slate-600"}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Panier</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-emerald-800 text-[10px] font-black flex items-center justify-center border border-emerald-200">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Navigation de la vitrine (6 espaces) */}
        <div className="border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 flex gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Banniere d accueil du catalogue + arguments de confiance */}
      {activeTab === "catalog" && (
        <section className="bg-gradient-to-b from-emerald-900 to-slate-900 text-white px-4 sm:px-6 py-10">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Vitrine client AGRO SERVICE YARWAYE
              </div>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight">
                Commandez, suivez, réservez et demandez un devis en quelques clics
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                Produits agricoles, transformation, restauration, BTP et services à{" "}
                <strong className="text-white">Malika / Keur Massar</strong>. Paiement Wave / Orange Money au{" "}
                <strong className="text-emerald-300 font-mono">{storePhone}</strong>.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  Voir mon panier ({cartCount})
                </button>
                <button
                  onClick={() => setActiveTab("track")}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold"
                >
                  Suivre ma commande
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold"
                >
                  Demander un devis
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { icon: Truck, t: "Livraison locale", d: "Malika, Keur Massar, Dakar" },
                { icon: ShieldCheck, t: "Produits contrôlés", d: "Filières locales de confiance" },
                { icon: BadgePercent, t: "Codes promo", d: "YARWAYE10 • MALIKA5" },
                { icon: Phone, t: "Assistance 7j/7", d: storePhone },
              ].map((b) => (
                <div key={b.t} className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                  <b.icon className="w-5 h-5 text-emerald-300 mb-2" />
                  <div className="font-bold text-white">{b.t}</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">{b.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ESPACE 1 : CATALOGUE (recherche, filtres, tri, fiches produits) */}
        {activeTab === "catalog" && (
          <div className="space-y-5">
            {/* Barre de filtres : categorie, stock, prix max, tri, affichage */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
              <div className="md:hidden relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un produit ou service..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                        selectedCategory === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat === "all" ? "Toutes catégories" : cat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} />
                    En stock seulement
                  </label>
                  <div className="flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>Prix max</span>
                    <input
                      type="number"
                      min={0}
                      max={maxCatalogPrice}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="∞"
                      className="w-20 bg-transparent focus:outline-hidden font-semibold"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="bg-transparent focus:outline-hidden font-semibold"
                    >
                      <option value="popular">Popularité</option>
                      <option value="price_asc">Prix croissant</option>
                      <option value="price_desc">Prix décroissant</option>
                      <option value="name">Nom A-Z</option>
                      <option value="stock">Stock dispo</option>
                    </select>
                  </div>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 ${viewMode === "grid" ? "bg-emerald-600 text-white" : "bg-white text-slate-600"}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 ${viewMode === "list" ? "bg-emerald-600 text-white" : "bg-white text-slate-600"}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500">
                {filtered.length} résultat(s) • Codes promo : <strong>YARWAYE10</strong> (-10%) / <strong>MALIKA5</strong> (-5%)
              </div>
            </div>

            {/* Resultats : grille de cartes ou liste compacte */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-3"
              }
            >
              {filtered.map((prod) => {
                const out = prod.stock <= 0;
                const low = prod.stock > 0 && prod.stock <= prod.minStockAlert;
                const fav = favorites.includes(prod.id);
                if (viewMode === "list") {
                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-slate-200 p-3 flex gap-3 items-center hover:shadow-md transition-all"
                    >
                      <img
                        src={prod.imageUrl || "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&auto=format&fit=crop&q=80"}
                        alt={prod.name}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-100 cursor-pointer"
                        onClick={() => openProduct(prod)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase font-bold text-slate-400">{prod.category}</div>
                        <button onClick={() => openProduct(prod)} className="font-bold text-sm text-slate-900 hover:text-emerald-700 text-left">
                          {prod.name}
                        </button>
                        <div className="text-xs text-slate-500 line-clamp-1">{prod.description}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="font-black text-emerald-700">{formatMoney(prod.sellingPrice, currency)}</span>
                          <span className="text-slate-400">Stock: {prod.stock}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => toggleFavorite(prod.id)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50">
                          <Heart className={`w-4 h-4 ${fav ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
                        </button>
                        <button
                          disabled={out}
                          onClick={() => addToCart(prod)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-40"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col group hover:shadow-lg transition-all">
                    <div className="relative h-44 bg-slate-100 cursor-pointer" onClick={() => openProduct(prod)}>
                      <img
                        src={prod.imageUrl || "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80"}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/95 text-[10px] font-bold text-slate-800">
                        {prod.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(prod.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/95 shadow"
                      >
                        <Heart className={`w-4 h-4 ${fav ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
                      </button>
                      {out && (
                        <div className="absolute inset-0 bg-slate-900/55 text-white text-xs font-bold flex items-center justify-center">
                          Rupture momentanée
                        </div>
                      )}
                      {low && !out && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold">
                          Stock bas
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <button onClick={() => openProduct(prod)} className="text-left font-bold text-sm text-slate-900 hover:text-emerald-700 line-clamp-2">
                        {prod.name}
                      </button>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex-1">{prod.description}</p>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">Prix Yarwaye</div>
                          <div className="font-black text-emerald-700">{formatMoney(prod.sellingPrice, currency)}</div>
                        </div>
                        <div className="text-[11px] text-slate-500">Stock {prod.stock}</div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-1.5">
                        <button
                          disabled={out}
                          onClick={() => addToCart(prod)}
                          className="col-span-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40"
                        >
                          Ajouter au panier
                        </button>
                        <button
                          onClick={() => openProduct(prod)}
                          className="py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                        >
                          Détail
                        </button>
                      </div>
                      <button
                        onClick={() => window.open(waLink(`Bonjour ${storeName} ! Je veux commander: ${prod.name} (${prod.sku})`), "_blank")}
                        className="mt-1.5 w-full py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-semibold flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">Aucun produit trouvé</p>
                <p className="text-xs text-slate-400 mt-1">Modifiez vos filtres ou explorez une autre catégorie</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                    setOnlyInStock(false);
                    setMaxPrice("");
                  }}
                  className="mt-3 px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}

        {/* ESPACE 2 : SERVICES (les 6 poles d activite, avec bouton devis) */}
        {activeTab === "services" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-xl font-black text-slate-900">Nos domaines d&apos;activité</h2>
              <p className="text-sm text-slate-500 mt-1">
                Agriculture, transformation, commercialisation, prestations de services, commerce général, BTP, pâtisserie et restauration.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICE_OFFERS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900">{s.title}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 flex-1">{s.desc}</p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCategory(s.category);
                          setActiveTab("catalog");
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        {s.cta}
                      </button>
                      <button
                        onClick={() => {
                          setInquiry((prev) => ({
                            ...prev,
                            type: "devis",
                            subject: `Devis — ${s.title}`,
                            message: `Bonjour, je souhaite un devis pour : ${s.title}.`,
                          }));
                          setActiveTab("contact");
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                      >
                        Devis
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ESPACE 3 : SUIVI DE COMMANDE */}
        {activeTab === "track" && (
          <div className="space-y-5 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" /> Suivre ma commande
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Entrez votre n° de commande (ex: YAR-2501) et/ou votre numéro de téléphone.
              </p>
              <form onSubmit={handleTrack} className="mt-4 grid sm:grid-cols-2 gap-3">
                <input
                  value={trackOrderNum}
                  onChange={(e) => setTrackOrderNum(e.target.value)}
                  placeholder="N° commande"
                  className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <input
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  placeholder="Téléphone client"
                  className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isTracking}
                  className="sm:col-span-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isTracking ? "Recherche..." : "Rechercher ma commande"}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {trackedOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-900">{order.orderNumber}</div>
                      <div className="text-[11px] text-slate-500">{formatDate(order.createdAt)} • {order.customerName}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {statusLabel(order.orderStatus)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">Montant</div>
                      <div className="font-bold">{formatMoney(order.total, currency)}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">Paiement</div>
                      <div className="font-bold">{paymentLabel(order.paymentMethod)}</div>
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="text-xs space-y-1 border-t border-slate-100 pt-2">
                      {order.items.map((it) => (
                        <div key={it.id} className="flex justify-between gap-2">
                          <span className="text-slate-600 truncate">
                            {it.productName} × {it.quantity}
                          </span>
                          <span className="font-semibold">{formatMoney(it.total, currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => reorderFromOrder(order)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Recommander
                    </button>
                    <a
                      href={waLink(
                        `Bonjour ${storeName}, je suis ${order.customerName}. Au sujet de la commande ${order.orderNumber} (${formatMoney(order.total, currency)}).`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Contacter le magasin
                    </a>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(order.orderNumber);
                        showToast("N° de commande copié");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copier n°
                    </button>
                  </div>
                </div>
              ))}
              {trackedOrders.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-300">
                  Aucune commande affichée pour le moment.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ESPACE 4 : MON COMPTE (profil, favoris, historique) */}
        {activeTab === "account" && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" /> Mon profil client
              </h2>
              <div className="space-y-3">
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nom complet"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Téléphone / WhatsApp"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email (optionnel)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Adresse de livraison habituelle"
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  onClick={() => {
                    saveProfile();
                    showToast("Profil enregistré sur cet appareil");
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Enregistrer mon profil
                </button>
                <button
                  onClick={loadMyOrdersByPhone}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50"
                >
                  Charger mes commandes via mon téléphone
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" /> Mes favoris ({favoriteProducts.length})
                </h3>
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {favoriteProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <button onClick={() => openProduct(p)} className="text-left min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{p.name}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold">{formatMoney(p.sellingPrice, currency)}</div>
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => addToCart(p)} className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">
                          Panier
                        </button>
                        <button onClick={() => toggleFavorite(p.id)} className="px-2 py-1 rounded-lg border text-[10px]">
                          Retirer
                        </button>
                      </div>
                    </div>
                  ))}
                  {favoriteProducts.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">Aucun favori pour le moment. Ajoutez des cœurs sur le catalogue.</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" /> Mes commandes récentes
                </h3>
                <div className="mt-3 space-y-2">
                  {(myOrders.length ? myOrders : trackedOrders).slice(0, 5).map((o) => (
                    <div key={o.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs flex justify-between gap-2">
                      <div>
                        <div className="font-bold">{o.orderNumber}</div>
                        <div className="text-slate-500">{formatDate(o.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-700">{formatMoney(o.total, currency)}</div>
                        <button onClick={() => reorderFromOrder(o)} className="text-[10px] font-bold text-slate-700 underline">
                          Recommander
                        </button>
                      </div>
                    </div>
                  ))}
                  {myOrders.length === 0 && trackedOrders.length === 0 && (
                    <p className="text-xs text-slate-400 py-4 text-center">Aucune commande chargée.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ESPACE 5 : CONTACT, DEVIS ET RESERVATION */}
        {activeTab === "contact" && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-slate-900">Contact, devis & réservation</h2>
              <p className="text-xs text-slate-500">
                Envoyez une demande à {storeName}. Notre équipe vous rappelle au besoin sur {storePhone}.
              </p>
              {inquiryDone && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  Demande enregistrée. Merci ! Nous vous recontactons rapidement.
                </div>
              )}
              <form onSubmit={handleInquiry} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    required
                    value={inquiry.name}
                    onChange={(e) => setInquiry({ ...inquiry, name: e.target.value })}
                    placeholder="Votre nom *"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <input
                    required
                    value={inquiry.phone}
                    onChange={(e) => setInquiry({ ...inquiry, phone: e.target.value })}
                    placeholder="Téléphone *"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <input
                  value={inquiry.email}
                  onChange={(e) => setInquiry({ ...inquiry, email: e.target.value })}
                  placeholder="Email (optionnel)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <div className="grid sm:grid-cols-2 gap-2">
                  <select
                    value={inquiry.type}
                    onChange={(e) => setInquiry({ ...inquiry, type: e.target.value })}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="devis">Demande de devis</option>
                    <option value="reservation">Réservation restauration</option>
                    <option value="btp">Chantier / BTP</option>
                    <option value="service">Prestation agricole</option>
                    <option value="autre">Autre demande</option>
                  </select>
                  <input
                    value={inquiry.subject}
                    onChange={(e) => setInquiry({ ...inquiry, subject: e.target.value })}
                    placeholder="Sujet"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <textarea
                  required
                  rows={4}
                  value={inquiry.message}
                  onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })}
                  placeholder="Décrivez votre besoin (quantités, date, lieu...)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isSendingInquiry}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSendingInquiry ? "Envoi..." : "Envoyer ma demande"}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 space-y-3">
                <h3 className="font-bold">Coordonnées directes</h3>
                <a href={`tel:${storePhone}`} className="flex items-center gap-2 text-sm hover:text-emerald-300">
                  <Phone className="w-4 h-4" /> {storePhone}
                </a>
                <a href={waLink(`Bonjour ${storeName}`)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-emerald-300">
                  <MessageCircle className="w-4 h-4" /> WhatsApp {storePhone}
                </a>
                <div className="flex items-start gap-2 text-sm text-slate-300">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{storeAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Mail className="w-4 h-4" /> {settings?.email || "contact@yarwaye.sn"}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 text-xs space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <CircleHelp className="w-4 h-4 text-emerald-600" /> Astuces client
                </div>
                <p>• Ajoutez des favoris pour commander plus vite la prochaine fois.</p>
                <p>• Utilisez le code <strong>YARWAYE10</strong> pour -10% sur le panier.</p>
                <p>• Suivez vos commandes avec votre n° de téléphone.</p>
                <p>• Pour un devis BTP ou labour, précisez le lieu et la surface.</p>
              </div>
            </div>
          </div>
        )}

        {/* ESPACE 6 : A PROPOS DE L ENTREPRISE */}
        {activeTab === "about" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{storeName}</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Entreprise basée à <strong>Malika Qrt Malika / Mer - BP 17000 - Keur Massar, Dakar, Sénégal</strong>.
                Nous intervenons dans l&apos;agriculture, la transformation et la commercialisation de produits agricoles et alimentaires,
                les prestations de services, le commerce général, l&apos;achat et la vente de produits et marchandises, le BTP,
                la pâtisserie et la restauration.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="font-bold text-emerald-900">Contact</div>
                <div className="mt-1 text-emerald-800 font-mono text-sm">{storePhone}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900">Wave / Orange Money</div>
                <div className="mt-1 font-mono text-sm">{storePhone}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900">Zone</div>
                <div className="mt-1">Malika • Keur Massar • Dakar</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveTab("catalog")} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                Voir le catalogue
              </button>
              <button onClick={() => setActiveTab("contact")} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                Nous écrire
              </button>
              <a href={`tel:${storePhone}`} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                Appeler maintenant
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Boutons flottants : WhatsApp et panier, accessibles partout */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2">
        <a
          href={waLink(`Bonjour ${storeName}, j'ai une question.`)}
          target="_blank"
          rel="noreferrer"
          className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-lg flex items-center justify-center"
          title="WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </a>
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center relative"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-emerald-800 text-[10px] font-black flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Fiche produit detaillee (quantite, favoris, partage, WhatsApp) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
            <div className="relative h-52 bg-slate-100">
              <img
                src={selectedProduct.imageUrl || "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80"}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <div className="text-[11px] font-bold uppercase text-emerald-700">{selectedProduct.category}</div>
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{selectedProduct.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Prix</div>
                  <div className="text-2xl font-black text-emerald-700">{formatMoney(selectedProduct.sellingPrice, currency)}</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Réf. {selectedProduct.sku}</div>
                  <div>Stock: {selectedProduct.stock} {selectedProduct.unit}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Quantité</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQtyInModal((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border flex items-center justify-center">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold w-6 text-center">{qtyInModal}</span>
                  <button
                    onClick={() => setQtyInModal((q) => Math.min(selectedProduct.stock || 1, q + 1))}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={selectedProduct.stock <= 0}
                  onClick={() => {
                    addToCart(selectedProduct, qtyInModal);
                    setSelectedProduct(null);
                    setIsCartOpen(true);
                  }}
                  className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-40"
                >
                  Ajouter au panier
                </button>
                <button
                  onClick={() => toggleFavorite(selectedProduct.id)}
                  className="py-2.5 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Heart className={`w-3.5 h-3.5 ${favorites.includes(selectedProduct.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                  Favoris
                </button>
                <button
                  onClick={() => shareProduct(selectedProduct)}
                  className="py-2.5 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" /> Partager
                </button>
                <a
                  href={waLink(`Bonjour ${storeName} ! Je souhaite commander ${selectedProduct.name} (x${qtyInModal}).`)}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tiroir du panier : lignes, livraison, paiement, promo, total */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold">Panier client ({cartCount})</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {orderSuccess ? (
                <div className="text-center space-y-3 py-6">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-lg">Commande confirmée</h3>
                  <p className="text-xs text-slate-600">
                    Référence <strong className="font-mono text-emerald-700">{orderSuccess.orderNumber}</strong>
                  </p>
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-left text-xs space-y-1">
                    <p className="font-bold text-teal-900">Prochaine étape</p>
                    {orderSuccess.paymentMethod === "wave_om_767866536" ? (
                      <p>
                        Envoyez <strong>{formatMoney(orderSuccess.total, currency)}</strong> via Wave/OM au{" "}
                        <strong className="underline">{storePhone}</strong> avec la référence{" "}
                        <span className="font-mono">{orderSuccess.orderNumber}</span>.
                      </p>
                    ) : (
                      <p>Votre commande est enregistrée. {storeName} vous contactera si besoin au {storePhone}.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setTrackOrderNum(orderSuccess.orderNumber);
                        setTrackedOrders([orderSuccess]);
                        setOrderSuccess(null);
                        setIsCartOpen(false);
                        setActiveTab("track");
                      }}
                      className="py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                    >
                      Suivre
                    </button>
                    <a
                      href={waLink(
                        `Bonjour ${storeName}, je viens de passer la commande ${orderSuccess.orderNumber} de ${formatMoney(orderSuccess.total, currency)}.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center justify-center"
                    >
                      WhatsApp
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      setOrderSuccess(null);
                      setIsCartOpen(false);
                    }}
                    className="w-full py-2 rounded-xl border text-xs font-semibold"
                  >
                    Continuer mes achats
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold">Votre panier est vide</p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setActiveTab("catalog");
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Parcourir le catalogue
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.product.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex gap-3">
                        <img
                          src={item.product.imageUrl || ""}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover bg-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{item.product.name}</div>
                          <div className="text-[11px] text-slate-500">{formatMoney(item.product.sellingPrice, currency)}</div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <button onClick={() => updateCartQty(item.product.id, -1)} className="w-6 h-6 rounded border bg-white flex items-center justify-center">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.product.id, 1)} className="w-6 h-6 rounded border bg-white flex items-center justify-center">
                              <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeFromCart(item.product.id)} className="ml-auto text-rose-500 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs font-black text-slate-900">
                          {formatMoney(item.product.sellingPrice * item.quantity, currency)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form id="client-checkout" onSubmit={handleCheckout} className="space-y-3 border-t border-slate-200 pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Informations de commande</h4>
                    <input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nom complet *"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <input
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Téléphone *"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <input
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Email (optionnel)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType("delivery")}
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          deliveryType === "delivery" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        🛵 Livraison
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType("pickup")}
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          deliveryType === "pickup" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        🏬 Retrait magasin
                      </button>
                    </div>

                    {deliveryType === "delivery" && (
                      <textarea
                        required
                        rows={2}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Adresse précise de livraison *"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    )}

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600">Mode de paiement</div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { id: "wave_om_767866536", label: `Wave / Orange Money (${storePhone})` },
                          { id: "cash", label: "Espèces à la livraison / au retrait" },
                          { id: "credit", label: "Crédit / à facturer (pro)" },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id as any)}
                            className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border ${
                              paymentMethod === m.id ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Code promo (YARWAYE10 / MALIKA5)"
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Note pour le magasin (optionnel)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </form>
                </>
              )}
            </div>

            {!orderSuccess && cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Sous-total</span>
                  <span className="font-semibold">{formatMoney(cartSubtotal, currency)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                    <span>Remise promo</span>
                    <span>- {formatMoney(promoDiscount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase text-slate-700">Total</span>
                  <span className="text-xl font-black text-emerald-700">{formatMoney(cartTotal, currency)}</span>
                </div>
                {paymentMethod === "wave_om_767866536" && (
                  <p className="text-[11px] text-teal-800 bg-teal-50 border border-teal-200 rounded-lg p-2">
                    Après validation, envoyez le paiement Wave/OM au <strong>{storePhone}</strong>.
                  </p>
                )}
                <button
                  type="submit"
                  form="client-checkout"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Validation..." : "Confirmer ma commande"}
                </button>
                <button type="button" onClick={clearCart} className="w-full py-2 text-xs text-rose-600 font-semibold">
                  Vider le panier
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
