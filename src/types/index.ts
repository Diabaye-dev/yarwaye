/* ============================================================================
 *  FICHIER : src/types/index.ts
 *  LANGAGE : TypeScript (types / interfaces)
 *  RÔLE    : Décrire la FORME des données échangées entre le serveur (API)
 *            et l'interface utilisateur (composants React).
 *
 *  Exemple : quand l'API /api/products renvoie un produit, ce fichier garantit
 *  qu'il contient bien { id, name, sku, sellingPrice, stock, ... }.
 *  Cela permet à l'éditeur de code de détecter les erreurs automatiquement.
 * ==========================================================================*/

// Les 3 rôles possibles dans l'application
export type UserRole = "owner" | "manager" | "cashier";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
}

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
