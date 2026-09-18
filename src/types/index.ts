/**
 * TYPES PARTAGÉS — src/types/index.ts
 * 
 * Ces "interface" TypeScript décrivent la forme des objets manipulés à la fois
 * côté serveur (routes API) et côté client (composants React). Elles
 * correspondent 1 pour 1 aux colonnes définies dans src/db/schema.ts.
 * Elles servent uniquement à la sécurité de typage : aucun code exécuté.
 */
// Roles du personnel, du plus eleve au plus restreint.
export type UserRole = "owner" | "manager" | "cashier";

// Un membre du personnel connecte.
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
}

// Une ligne du catalogue / inventaire.
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  unit: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Un client avec sa dette et ses points de fidélité.
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  creditBalance: number;
  totalSpent: number;
  loyaltyPoints: number;
  notes: string | null;
  createdAt: string;
}

// Un fournisseur / approvisionneur.
export interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  categories: string | null;
  notes: string | null;
  createdAt: string;
}

// Une ligne d un ticket de caisse.
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSku: string | null;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  total: number;
}

// Un ticket complet (avec ses lignes quand elles sont chargees).
export interface Order {
  id: number;
  orderNumber: string;
  customerId: number | null;
  customerName: string;
  customerPhone: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "wave_om_767866536" | "card" | "credit";
  paymentStatus: "paid" | "pending" | "refunded";
  orderStatus: "completed" | "processing" | "cancelled";
  cashierName: string;
  notes: string | null;
  createdAt: string;
  items?: OrderItem[];
}

// Configuration de la boutique (une seule ligne en base).
export interface StoreSettings {
  id: number;
  storeName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  currency: string;
  taxRate: number;
  receiptHeader: string;
  receiptFooter: string;
  waveNumber: string;
  orangeMoneyNumber: string;
  updatedAt: string;
}

// Une entrée/sortie tracée dans le journal de stock.
export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  type: "in" | "out" | "adjustment" | "sale";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}
