/* ============================================================================
 *  FICHIER : src/db/schema.ts
 *  LANGAGE : TypeScript (Drizzle ORM)
 *  RÔLE    : Définition de la STRUCTURE de la base de données PostgreSQL.
 *            Chaque "pgTable" ci-dessous correspond à une table réelle de la
 *            base de données (comme un tableau Excel avec des colonnes).
 *
 *  Tables créées pour AGRO SERVICE YARWAYE :
 *    - users           → le personnel (propriétaire, gérant, caissier)
 *    - products        → le catalogue de produits (céréales, ciment, farine...)
 *    - customers       → les clients + leur carnet de crédit (dettes)
 *    - suppliers       → les fournisseurs (coopératives, cimenteries...)
 *    - orders          → les commandes / ventes
 *    - orderItems      → les lignes de chaque commande (produit + quantité)
 *    - stockMovements  → le journal des entrées/sorties de stock
 *    - storeSettings   → les paramètres de la boutique (nom, tél, adresse)
 * ==========================================================================*/

import { pgTable, text, serial, integer, doublePrecision, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("cashier"), // owner, manager, cashier
  phone: text("phone").default("767866536"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  category: text("category").notNull().default("General"),
  description: text("description"),
  costPrice: doublePrecision("cost_price").notNull().default(0),
  sellingPrice: doublePrecision("selling_price").notNull(),
  stock: integer("stock").notNull().default(0),
  minStockAlert: integer("min_stock_alert").notNull().default(5),
  unit: text("unit").notNull().default("pcs"), // pcs, kg, box, pack, meter
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  creditBalance: doublePrecision("credit_balance").notNull().default(0), // debt owed to Yarwaye
  totalSpent: doublePrecision("total_spent").notNull().default(0),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  categories: text("categories"), // e.g. "Electronics, Hardware"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(), // e.g. DIA-10023
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull().default("Comptoir / Client Passager"),
  customerPhone: text("customer_phone").default("767866536"),
  subtotal: doublePrecision("subtotal").notNull(),
  discount: doublePrecision("discount").notNull().default(0),
  tax: doublePrecision("tax").notNull().default(0),
  total: doublePrecision("total").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"), // cash, wave_om_767866536, card, credit
  paymentStatus: text("payment_status").notNull().default("paid"), // paid, pending, refunded
  orderStatus: text("order_status").notNull().default("completed"), // completed, processing, cancelled
  cashierName: text("cashier_name").notNull().default("Yarwaye Staff"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  unitPrice: doublePrecision("unit_price").notNull(),
  costPrice: doublePrecision("cost_price").notNull().default(0),
  quantity: integer("quantity").notNull(),
  total: doublePrecision("total").notNull(),
});

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  type: text("type").notNull(), // 'in' | 'out' | 'adjustment' | 'sale'
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  reason: text("reason").notNull(),
  performedBy: text("performed_by").notNull().default("Yarwaye"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("Agro Service Yarwaye"),
  phone: text("phone").notNull().default("767866536"),
  whatsapp: text("whatsapp").notNull().default("767866536"),
  email: text("email").notNull().default("contact@agroserviceyarwaye.sn"),
  address: text("address").notNull().default("Avenue Yarwaye Commercial, Sénégal"),
  currency: text("currency").notNull().default("FCFA"), // FCFA or USD
  taxRate: doublePrecision("tax_rate").notNull().default(0),
  receiptHeader: text("receipt_header").notNull().default("AGRO SERVICE YARWAYE - AGRICULTURE & COMMERCE GÉNÉRAL"),
  receiptFooter: text("receipt_footer").notNull().default("Merci de votre fidélité ! Service Client: 767866536"),
  waveNumber: text("wave_number").notNull().default("767866536"),
  orangeMoneyNumber: text("orange_money_number").notNull().default("767866536"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
