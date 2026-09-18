CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text,
	"credit_balance" double precision DEFAULT 0 NOT NULL,
	"total_spent" double precision DEFAULT 0 NOT NULL,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text,
	"unit_price" double precision NOT NULL,
	"cost_price" double precision DEFAULT 0 NOT NULL,
	"quantity" integer NOT NULL,
	"total" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" integer,
	"customer_name" text DEFAULT 'Comptoir / Client Passager' NOT NULL,
	"customer_phone" text DEFAULT '767866536',
	"subtotal" double precision NOT NULL,
	"discount" double precision DEFAULT 0 NOT NULL,
	"tax" double precision DEFAULT 0 NOT NULL,
	"total" double precision NOT NULL,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"payment_status" text DEFAULT 'paid' NOT NULL,
	"order_status" text DEFAULT 'completed' NOT NULL,
	"cashier_name" text DEFAULT 'Yarwaye Staff' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"barcode" text,
	"category" text DEFAULT 'General' NOT NULL,
	"description" text,
	"cost_price" double precision DEFAULT 0 NOT NULL,
	"selling_price" double precision NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"min_stock_alert" integer DEFAULT 5 NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"reason" text NOT NULL,
	"performed_by" text DEFAULT 'Yarwaye' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_name" text DEFAULT 'Agro Service Yarwaye' NOT NULL,
	"phone" text DEFAULT '767866536' NOT NULL,
	"whatsapp" text DEFAULT '767866536' NOT NULL,
	"email" text DEFAULT 'contact@agroserviceyarwaye.sn' NOT NULL,
	"address" text DEFAULT 'Avenue Yarwaye Commercial, Sénégal' NOT NULL,
	"currency" text DEFAULT 'FCFA' NOT NULL,
	"tax_rate" double precision DEFAULT 0 NOT NULL,
	"receipt_header" text DEFAULT 'AGRO SERVICE YARWAYE - AGRICULTURE & COMMERCE GÉNÉRAL' NOT NULL,
	"receipt_footer" text DEFAULT 'Merci de votre fidélité ! Service Client: 767866536' NOT NULL,
	"wave_number" text DEFAULT '767866536' NOT NULL,
	"orange_money_number" text DEFAULT '767866536' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"phone" text NOT NULL,
	"email" text,
	"address" text,
	"categories" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'cashier' NOT NULL,
	"phone" text DEFAULT '767866536',
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
