/**
   MIGRATION AUTO-SUFFISANTE — src/db/migrate.ts
   ------------------------------------------------------------
   Pourquoi ce fichier ?
   Sur un hébergeur gratuit (Vercel, Render...), on ne peut pas ouvrir un
   terminal pour lancer `npx drizzle-kit push`. Il faut donc que l'application
   crée elle-même ses tables au premier démarrage.

   ensureSchema() applique des `CREATE TABLE IF NOT EXISTS` : l'opération est
   "idempotente", c'est-à-dire répétable sans danger (si les tables existent
   déjà, il ne se passe rien, aucune donnée n'est écrasée).

   Appels :
   - depuis /api/health  -> ouvrir une seule fois l'URL après le déploiement ;
   - depuis le seed      -> garantit que les tables existent avant d'insérer.
*/
import { db } from "./index";
import { sql, count } from "drizzle-orm";
import { orders, products } from "./schema";

const TABLES: { name: string; ddl: string }[] = [
  {
    name: "users",
    ddl: `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier',
      phone TEXT DEFAULT '767866536',
      avatar TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "products",
    ddl: `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      barcode TEXT,
      category TEXT NOT NULL DEFAULT 'Général',
      description TEXT,
      cost_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      selling_price DOUBLE PRECISION NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock_alert INTEGER NOT NULL DEFAULT 5,
      unit TEXT NOT NULL DEFAULT 'pcs',
      image_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "customers",
    ddl: `CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      credit_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
      total_spent DOUBLE PRECISION NOT NULL DEFAULT 0,
      loyalty_points INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "suppliers",
    ddl: `CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      categories TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "orders",
    ddl: `CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      customer_name TEXT NOT NULL DEFAULT 'Comptoir / Client Passager',
      customer_phone TEXT DEFAULT '767866536',
      subtotal DOUBLE PRECISION NOT NULL,
      discount DOUBLE PRECISION NOT NULL DEFAULT 0,
      tax DOUBLE PRECISION NOT NULL DEFAULT 0,
      total DOUBLE PRECISION NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      payment_status TEXT NOT NULL DEFAULT 'paid',
      order_status TEXT NOT NULL DEFAULT 'completed',
      cashier_name TEXT NOT NULL DEFAULT 'Personnel Yarwaye',
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "order_items",
    ddl: `CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_sku TEXT,
      unit_price DOUBLE PRECISION NOT NULL,
      cost_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL,
      total DOUBLE PRECISION NOT NULL
    )`,
  },
  {
    name: "stock_movements",
    ddl: `CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reason TEXT NOT NULL,
      performed_by TEXT NOT NULL DEFAULT 'AGRO SERVICE YARWAYE',
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "store_settings",
    ddl: `CREATE TABLE IF NOT EXISTS store_settings (
      id SERIAL PRIMARY KEY,
      store_name TEXT NOT NULL DEFAULT 'AGRO SERVICE YARWAYE',
      phone TEXT NOT NULL DEFAULT '767866536',
      whatsapp TEXT NOT NULL DEFAULT '767866536',
      email TEXT NOT NULL DEFAULT 'contact@yarwaye.sn',
      address TEXT NOT NULL DEFAULT 'Malika Qrt Malika / Mer - BP 17000 - Keur Massar, Dakar, Sénégal',
      currency TEXT NOT NULL DEFAULT 'FCFA',
      tax_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      receipt_header TEXT NOT NULL DEFAULT 'AGRO SERVICE YARWAYE',
      receipt_footer TEXT NOT NULL DEFAULT 'Merci de votre confiance !',
      wave_number TEXT NOT NULL DEFAULT '767866536',
      orange_money_number TEXT NOT NULL DEFAULT '767866536',
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`,
  },
];

// Index utiles : sans eux, les listes et les filtres ralentissent dès qu'il y a
// beaucoup de ventes (une base gratuite reste petite : on l'aide un peu).
const INDEXES: string[] = [
  "CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (order_status)",
  "CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id)",
  "CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id)",
  "CREATE INDEX IF NOT EXISTS idx_products_category ON products (category)",
  "CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements (product_id)",
  "CREATE INDEX IF NOT EXISTS idx_movements_created_at ON stock_movements (created_at DESC)",
];

let done = false; // une seule fois par processus serveur (cache)

/**
 * Créé les tables et index manquants. Sans effet s'ils existent déjà.
 */
export async function ensureSchema(): Promise<{ created: string[]; skipped: number }> {
  if (done) return { created: [], skipped: TABLES.length };

  const created: string[] = [];

  for (const table of TABLES) {
    await db.execute(sql.raw(table.ddl));
    created.push(table.name);
  }
  for (const statement of INDEXES) {
    await db.execute(sql.raw(statement));
  }

  done = true;
  return { created, skipped: 0 };
}

/**
 * Fonction "guichet unique" appelée par /api/health :
 * 1. on crée le schéma, 2. on insère les données de démonstration si vide.
 * Renvoie un petit rapport lisible dans le navigateur.
 */
export async function bootstrapDatabase() {
  const schema = await ensureSchema();
  const { seedDatabase } = await import("./seed");
  await seedDatabase();

  // Petit rapport : on compte les lignes avec Drizzle (count() => SQL COUNT(*)).
  const [rapportProduits] = await db.select({ value: count() }).from(products);
  const [rapportVentes] = await db.select({ value: count() }).from(orders);

  return {
    tables: schema.created.length ? `créées : ${schema.created.join(", ")}` : "déjà présentes",
    produits: rapportProduits?.value ?? 0,
    ventes: rapportVentes?.value ?? 0,
  };
}
