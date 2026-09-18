# 📚 DOCUMENTATION TECHNIQUE — AGRO SERVICE YARWAYE

> Système commercial complet : tableau de bord, point de vente (POS), gestion de stock,
> carnet de crédit, vitrine e-commerce et commandes.
> **Contact boutique : 767866536** — Malika QRT Malika / MER - BP 17000 - Keur Massar, Dakar, Sénégal

---

## 1. 🗣️ QUELS LANGAGES SONT UTILISÉS ?

| Langage | Rôle | Où le trouver |
|---|---|---|
| **TypeScript (`.ts`)** | Le langage principal. C'est du JavaScript renforcé avec des *types* (nombres, textes, objets) pour éviter les erreurs. | `src/db/`, `src/lib/`, `src/types/`, toutes les API `src/app/api/` |
| **TSX / JSX (`.tsx`)** | TypeScript + **React** : le langage qui permet d'écrire l'interface utilisateur sous forme de balises (`<button>`, `<div>`) comme en HTML. | `src/app/page.tsx`, `src/app/layout.tsx`, tous les fichiers de `src/components/` et `src/context/` |
| **SQL (PostgreSQL)** | Le langage des bases de données relationnelles. Il n'est pas écrit à la main : **Drizzle ORM** le génère automatiquement à partir de `src/db/schema.ts`. | Base de données `app_db` |
| **CSS (Tailwind CSS v4)** | La mise en forme (couleurs, espacements, bordures, responsive mobile). Exemple : `className="bg-emerald-600 text-white rounded-xl"`. | Dans tous les fichiers `.tsx`, config dans `src/app/globals.css` |
| **HTML** | Structure de base des pages, généré par React/Next.js. | Rendu automatiquement par le navigateur |

### Les bibliothèques (frameworks) utilisées
- **Next.js 16 (App Router)** → le framework web : pages, API, rendu serveur.
- **React 19** → la bibliothèque d'interface utilisateur (composants, états).
- **Drizzle ORM** → pont entre TypeScript et PostgreSQL (pas de SQL brut).
- **PostgreSQL** → le système de gestion de base de données (stockage durable).
- **Tailwind CSS** → les utilitaires de style visuel.
- **Lucide React** → l'ensemble d'icônes (camion, téléphone, panier...).

---

## 2. 🗂️ ARBORESCENCE DU PROJET (à quoi sert chaque fichier)

```
📦 projet
│
├── 📄 DOCUMENTATION.md          ← Ce fichier
├── 📄 .env                      ← L'adresse de la base de données (DATABASE_URL)
├── 📄 drizzle.config.json       ← Configuration de Drizzle (lien vers PostgreSQL)
│
└── 📁 src/                      ← TOUT LE CODE SOURCE
    │
    ├── 📁 app/                  ← LES PAGES ET LES API (Next.js App Router)
    │   ├── layout.tsx           ← Gabarit global (html, body, authentification)
    │   ├── page.tsx             ← Page principale : tableau de bord + sidebar
    │   ├── globals.css          ← Styles globaux (Tailwind)
    │   │
    │   └── 📁 api/              ← LES API REST (le "cerveau" serveur)
    │       ├── health/route.ts          → GET  /api/health     (contrôle santé)
    │       ├── auth/route.ts            → GET/POST /api/auth   (personnel)
    │       ├── products/route.ts        → GET/POST /api/products
    │       ├── products/[id]/route.ts   → GET/PUT/DELETE un produit
    │       ├── products/[id]/stock/     → POST ajustement de stock (+/−)
    │       ├── orders/route.ts          → GET/POST /api/orders (ventes)
    │       ├── orders/[id]/route.ts     → GET/PATCH/DELETE une commande
    │       ├── customers/route.ts       → GET/POST /api/customers
    │       ├── customers/[id]/route.ts  → GET/PUT/DELETE un client
    │       ├── suppliers/route.ts       → GET/POST /api/suppliers
    │       ├── suppliers/[id]/route.ts  → GET/PUT/DELETE un fournisseur
    │       ├── settings/route.ts        → GET/PUT /api/settings (boutique)
    │       ├── analytics/route.ts       → GET  /api/analytics (statistiques)
    │       └── seed/route.ts            → POST réinitialiser les données démo
    │
    ├── 📁 components/           ← LES COMPOSANTS D'INTERFACE (l'affichage)
    │   ├── DashboardOverview.tsx       → Tableau de bord (indicateurs)
    │   ├── PosTerminal.tsx             → Caisse / Point de vente
    │   ├── ProductsView.tsx            → Inventaire & articles
    │   ├── ProductModal.tsx            → Créer/modifier un produit
    │   ├── StockAdjustModal.tsx        → Ajuster un stock (+/−)
    │   ├── OrdersView.tsx              → Historique des ventes
    │   ├── ReceiptModal.tsx            → Ticket de caisse imprimable
    │   ├── CustomersView.tsx           → Clients & carnet de crédit
    │   ├── CustomerModal.tsx           → Créer/modifier un client
    │   ├── SuppliersView.tsx           → Fournisseurs
    │   ├── SupplierModal.tsx           → Créer/modifier un fournisseur
    │   ├── AnalyticsView.tsx           → Marges & rapports financiers
    │   ├── SettingsView.tsx            → Paramètres de la boutique
    │   ├── UserSwitchModal.tsx         → Changer d'utilisateur connecté
    │   ├── StorefrontView.tsx          → 🌐 LA VITRINE CLIENTE (e-commerce)
    │   └── StorefrontProductModal.tsx  → Fiche produit détaillée (vitrine)
    │
    ├── 📁 context/
    │   └── AuthContext.tsx      ← Qui est connecté ? (disponible partout)
    │
    ├── 📁 db/                   ← LA COUCHE BASE DE DONNÉES
    │   ├── index.ts             ← Connexion à PostgreSQL (l'objet `db`)
    │   ├── schema.ts            ← Structure des tables (colonnes, types)
    │   └── seed.ts              ← Données de démonstration réalistes
    │
    ├── 📁 lib/
    │   └── utils.ts             ← Petites fonctions (formatMoney, formatDate)
    │
    └── 📁 types/
        └── index.ts             ← Forme des données (Product, Order, Customer...)
```

---

## 3. 🔄 COMMENT LES DONNÉES CIRCULENT

```
👤 L'UTILISATEUR clique (ex: "Ajouter au panier")
        │
        ▼
🧩 COMPOSANT REACT (src/components/...)
   useState() mémorise la nouvelle valeur → l'écran se met à jour
        │
        ▼ (si besoin d'enregistrer)
🌐 APPEL API  fetch("/api/orders", { method: "POST", body: {...} })
        │
        ▼
⚙️ ROUTE API (src/app/api/orders/route.ts)
   Vérifie les données, applique la logique métier
   (décrémenter le stock, calculer les totaux...)
        │
        ▼
🗄️ DRIZZLE ORM  db.insert(orders).values({...})
        │
        ▼
🐘 POSTGRESQL enregistre durablement la donnée
        │
        ▼
✅ RÉPONSE JSON renvoyée au composant → interface mise à jour
```

---

## 4. 🧱 LES CONCEPTS CLÉS À COMPRENDRE

### `useState` — la mémoire d'un composant
```tsx
const [cart, setCart] = useState([]);   // cart = la valeur actuelle
setCart([...cart, newProduct]);          // on met à jour → l'écran rafraîchit
```

### `useEffect` — exécuter du code au bon moment
```tsx
useEffect(() => {
  loadAllData();   // s'exécute UNE FOIS au chargement de la page
}, []);
```

### `useMemo` — calcul optimisé
```tsx
const filtered = useMemo(() => products.filter(p => p.stock > 0), [products]);
// Le calcul ne se refait QUE si "products" change (gain de performance)
```

### Une API Route (Next.js)
```tsx
// src/app/api/products/route.ts
export async function GET() {              // quand on APPELE /api/products
  const items = await db.select().from(products);
  return Response.json({ products: items });
}

export async function POST(req: Request) { // quand on ENVOIE des données
  const body = await req.json();
  await db.insert(products).values(body);
  return Response.json({ success: true });
}
```

### Le schéma de base de données (Drizzle)
```tsx
// src/db/schema.ts
export const products = pgTable("products", {
  id: serial("id").primaryKey(),                 // identifiant unique auto
  name: text("name").notNull(),                  // obligatoire
  sellingPrice: doublePrecision("selling_price"),// nombre décimal
  stock: integer("stock").default(0),            // entier, vaut 0 par défaut
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 5. ▶️ COMMANDES UTILES

```bash
npm run dev        # Lancer le serveur de développement (http://localhost:3000)
npm run build      # Compiler la version de production
npm run start      # Lancer la version compilée
npx tsc --noEmit   # Vérifier qu'il n'y a pas d'erreurs TypeScript
npx drizzle-kit push   # Appliquer les changements du schéma à PostgreSQL
```

---

## 6. 🔐 FLUX D'AUTHENTIFICATION

1. `src/context/AuthContext.tsx` charge le personnel depuis `GET /api/auth`.
2. L'utilisateur connecté est mémorisé dans le `localStorage` du navigateur (identifiant de session).
3. N'importe quel composant peut lire `const { user } = useAuth()`.
4. `UserSwitchModal` permet de changer de session (propriétaire, gérant, caissier).

---

## 7. 🛒 FLUX DE COMMANDE (vitrine + caisse)

1. Le client ajoute des articles au panier (`addToCart`).
2. Il choisit sa zone de livraison (frais calculés automatiquement).
3. Il applique éventuellement un code promo (`YARWAYE10`, `AGRO5`, `GROS15`).
4. `handleCheckout()` envoie `POST /api/orders` avec tous les articles.
5. L'API :
   - crée la commande avec un numéro unique (`ASY-2025-XXXX`)
   - insère les lignes de commande (`order_items`)
   - **décrémente automatiquement les stocks**
   - écrit dans le journal `stock_movements`
   - met à jour le client (points fidélité, total dépensé, dette)
6. Le client reçoit son numéro de commande et peut le suivre en ligne.
