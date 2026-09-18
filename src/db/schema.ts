/**
 * SCHÉMA DE BASE DE DONNÉES — AGRO SERVICE YARWAYE
 * Fichier : src/db/schema.ts
 * 
 * Ce fichier décrit la structure des tables PostgreSQL en TypeScript grâce à
 * Drizzle ORM. Chaque "pgTable" correspond à une table SQL réelle :
 *   - serial(...)      -> colonne "id" auto-incrémentée (clé primaire)
 *   - text(...)        -> colonne VARCHAR (texte)
 *   - integer(...)     -> colonne INT (entier)
 *   - doublePrecision()-> colonne NUMERIC/DOUBLE (montants FCFA)
 *   - boolean(...)     -> colonne BOOL (true/false)
 *   - timestamp(...)   -> colonne TIMESTAMP (dates)
 * Les modificateurs .notNull(), .unique() et .default(...) ajoutent les
 * contraintes SQL équivalentes (NOT NULL, UNIQUE, DEFAULT).
 * 
 * Tables :
 *   users          -> personnel autorisé à utiliser le back-office
 *   products       -> catalogue / inventaire (prix achat, prix vente, stock)
 *   customers      -> clients + carnet de crédit (dettes) + points fidélité
 *   suppliers      -> fournisseurs et partenaires d'approvisionnement
 *   orders         -> tickets de caisse / ventes (totaux + statut paiement)
 *   order_items    -> lignes détaillées de chaque vente (produit, qté, prix)
 *   stock_movements-> journal d'audit de tout mouvement de stock
 *   store_settings -> paramètres de la boutique (nom, 767866536, reçus, Wave)
 */
import { pgTable, text, serial, integer, doublePrecision, timestamp, boolean } from "drizzle-orm/pg-core";

// "users" : personnel autorisé à utiliser le back-office (owner > manager > cashier).
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // démo : non haché réellement (à remplacer par bcrypt en production)
  role: text("role").notNull().default("cashier"), // owner, manager, cashier
  phone: text("phone").default("767866536"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// "products" : catalogue + inventaire. Marge = sellingPrice − costPrice ; alerte si stock <= minStockAlert.
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(), // reference interne unique (ex: YAR-AGRI-001)
  barcode: text("barcode"),
  category: text("category").notNull().default("Général"),
  description: text("description"),
  costPrice: doublePrecision("cost_price").notNull().default(0),
  sellingPrice: doublePrecision("selling_price").notNull(),
  stock: integer("stock").notNull().default(0), // quantité disponible, ajustée à chaque vente / mouvement
  minStockAlert: integer("min_stock_alert").notNull().default(5),
  unit: text("unit").notNull().default("pcs"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// "customers" : fiches clients, carnet de crédit (la dette) et points de fidélité.
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  creditBalance: doublePrecision("credit_balance").notNull().default(0),
  totalSpent: doublePrecision("total_spent").notNull().default(0),
  loyaltyPoints: integer("loyalty_points").notNull().default(0), // 1 point par 1 000 FCFA dépensés
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// "suppliers" : partenaires d approvisionnement ( cooperatives, huileries, materiaux BTP ).
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  categories: text("categories"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// "orders" : un ticket de caisse. Les donnees sont aplaties (nom client, montants)
// pour que le reçu reste intact meme si le client ou le produit est supprimé plus tard.
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull().default("Comptoir / Client Passager"),
  customerPhone: text("customer_phone").default("767866536"),
  subtotal: doublePrecision("subtotal").notNull(),
  discount: doublePrecision("discount").notNull().default(0),
  tax: doublePrecision("tax").notNull().default(0),
  total: doublePrecision("total").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"), // cash | wave_om_767866536 | card | credit // cash, wave_om_767866536, card, credit
  paymentStatus: text("payment_status").notNull().default("paid"),
  orderStatus: text("order_status").notNull().default("completed"),
  cashierName: text("cashier_name").notNull().default("Personnel Yarwaye"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// "order_items" : lignes d un ticket (produit, prix unitaire, quantité, total).
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

// "stock_movements" : journal d audit ; chaque entree/sortie est tracee avec son operateur.
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  type: text("type").notNull(), // 'in' | 'out' | 'adjustment' | 'sale'
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  reason: text("reason").notNull(),
  performedBy: text("performed_by").notNull().default("AGRO SERVICE YARWAYE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// "store_settings" : ligne unique de configuration (nom, 767866536, Wave/OM, mentions du reçu).
export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("AGRO SERVICE YARWAYE"),
  phone: text("phone").notNull().default("767866536"),
  whatsapp: text("whatsapp").notNull().default("767866536"),
  email: text("email").notNull().default("contact@yarwaye.sn"),
  address: text("address").notNull().default("Malika Qrt Malika / Mer - BP 17000 - Keur Massar, Dakar, Sénégal"),
  currency: text("currency").notNull().default("FCFA"),
  taxRate: doublePrecision("tax_rate").notNull().default(0),
  receiptHeader: text("receipt_header").notNull().default("AGRO SERVICE YARWAYE"),
  receiptFooter: text("receipt_footer").notNull().default("Merci de votre confiance ! Assistance: 767866536 | Malika / Keur Massar"),
  waveNumber: text("wave_number").notNull().default("767866536"),
  orangeMoneyNumber: text("orange_money_number").notNull().default("767866536"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
