# AGRO SERVICE YARWAYE — Application de gestion commerciale

> Malika Qrt Malika / Mer - BP 17000 - Keur Massar, Dakar, Sénégal
> Contact, WhatsApp, Wave & Orange Money : **767866536**

Application web complète (back-office de gestion + vitrine client) avec authentification,
CRUD complet, point de vente, carnet de crédit, rapports et données de démonstration.

---

## 1. Langages et technologies utilisés

| Rôle | Langage / outil | Où le voir |
|---|---|---|
| **Langage principal** | **TypeScript** (du JavaScript « typé ») | tous les fichiers `.ts` et `.tsx` |
| Interface utilisateur | **React 19** avec du **JSX** (du HTML écrit dans du JavaScript) | `src/components/*.tsx`, `src/app/page.tsx` |
| Framework web complet | **Next.js 16** (App Router) : pages + API dans le même projet | `src/app/` |
| Styles | **CSS** avec **Tailwind CSS v4** (classes utilitaires directement dans le JSX) | `src/app/globals.css` + les `className="..."` |
| Base de données | **SQL** sur **PostgreSQL**, accès via **Drizzle ORM** | `src/db/schema.ts`, `src/db/index.ts` |
| Vérification des données | **Zod-like** fait à la main (contrôles `if` dans les routes API) | `src/app/api/**/route.ts` |
| Icônes | Librairie **lucide-react** | `import { ShoppingBag } from "lucide-react"` |

**En résumé : le langage est le TypeScript (React/Next.js), côté serveur comme côté navigateur,
avec du SQL (PostgreSQL) pour le stockage et du Tailwind CSS pour la mise en forme.**
Toute l'interface et tous les commentaires sont en **français**.

### Lexique utile
- **Composant React** : fonction qui renvoie de l'HTML (`return (<div>...</div>)`).
- **`useState`** : mémoire locale d'un composant (ex. `const [search, setSearch] = useState("")`).
- **`useEffect`** : code exécuté après l'affichage (ex. charger les données au démarrage).
- **Route API** : fichier `route.ts` dans `src/app/api/...` qui expose `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- **`"use client"`** : indique que le fichier s'exécute dans le navigateur (donc React interactif).
- **ORM** : bibliothèque qui traduit du TypeScript en requêtes SQL (`db.select()`, `db.insert()`...).

---

## 2. Architecture des fichiers

```
src/
├── app/
│   ├── layout.tsx          → cadre HTML global + AuthProvider (session partout)
│   ├── globals.css         → Tailwind + styles d'impression du ticket
│   ├── page.tsx            → écran principal : sidebar + onglets + chargement des données
│   └── api/                → le « serveur » : chaque dossier = une adresse HTTP
│       ├── auth/           → connexion / changement de session / création de personnel
│       ├── products/       → catalogue (liste + création)
│       ├── products/[id]/  → un produit (lecture, modif, suppression)
│       ├── products/[id]/stock/ → entrée/sortie de stock + journal
│       ├── orders/         → ventes (liste + encaissement)
│       ├── orders/[id]/    → détail, annulation/remboursement (stock réintégré)
│       ├── customers/      → clients et carnet de crédit
│       ├── suppliers/      → fournisseurs
│       ├── analytics/      → indicateurs (CA, marges, top ventes...)
│       ├── inquiries/      → demandes de devis envoyées par la vitrine client
│       ├── settings/       → paramètres de la boutique
│       ├── seed/           → réinitialisation des données de démo
│       └── health/         → sonde de bon fonctionnement (+ peuplement)
├── components/             → briques d'interface réutilisables
│   ├── DashboardOverview.tsx → tableau de bord (KPI, alertes, dernières ventes)
│   ├── PosTerminal.tsx       → caisse / point de vente
│   ├── ProductsView.tsx      → inventaire (table, filtres, export CSV)
│   ├── OrdersView.tsx        → historique des ventes
│   ├── CustomersView.tsx     → clients + encaissement des dettes
│   ├── SuppliersView.tsx     → fournisseurs
│   ├── AnalyticsView.tsx     → rapports financiers
│   ├── SettingsView.tsx      → configuration
│   ├── StorefrontView.tsx    → vitrine client (catalogue, panier, devis, suivi)
│   ├── ReceiptModal.tsx      → ticket de caisse imprimable
│   ├── ProductModal.tsx      → formulaire produit
│   ├── CustomerModal.tsx     → formulaire client
│   ├── SupplierModal.tsx     → formulaire fournisseur
│   ├── StockAdjustModal.tsx  → ajustement rapide de stock
│   └── UserSwitchModal.tsx   → changer de session / ajouter du personnel
├── context/
│   └── AuthContext.tsx     → session utilisateur partagée (React Context)
├── db/
│   ├── index.ts            → connexion PostgreSQL (pool) + client Drizzle
│   ├── schema.ts           → définition des 8 tables SQL
│   └── seed.ts             → données de démonstration réalistes
├── types/index.ts          → types TypeScript partagés (formes des objets)
└── lib/utils.ts            → formatage des montants (FCFA) et des dates
```

---

## 3. Flux de données (comment ça communique)

```
Composant React (navigateur)
   │  fetch("/api/products")            ← requête HTTP
   ▼
Route API Next.js (serveur)              ← src/app/api/**/route.ts
   │  db.select().from(products)         ← Drizzle ORM
   ▼
PostgreSQL                                ← src/db/schema.ts
```

Exemple concret d'un encaissement à la caisse :

1. `PosTerminal.tsx` construit le panier et fait `POST /api/orders`.
2. `src/app/api/orders/route.ts` recalcule les totaux **côté serveur** (on ne fait pas
   confiance au navigateur pour les prix), insère le ticket, puis pour chaque ligne :
   décrémente `products.stock` et écrit une ligne dans `stock_movements`.
3. Il met aussi à jour le client : `totalSpent`, `loyaltyPoints`, et `creditBalance` si paiement à crédit.
4. Le composant reçoit le ticket créé, l'ajoute **immédiatement** à sa liste locale
   (mise à jour optimiste) et ouvre `ReceiptModal` pour l'impression.

---

## 4. Les 8 tables

| Table | Contenu |
|---|---|
| `users` | personnel (propriétaire, gérant, caissier) |
| `products` | articles : SKU, catégorie, prix d'achat, prix de vente, stock, seuil d'alerte |
| `customers` | clients, adresse, dette (carnet de crédit), points fidélité |
| `suppliers` | fournisseurs et marchandises fournies |
| `orders` | tickets de caisse : totaux, mode et statut de paiement |
| `order_items` | lignes de chaque ticket |
| `stock_movements` | journal d'audit des entrées/sorties |
| `store_settings` | identité, adresse, **767866536**, Wave/OM, mentions du reçu |

---

## 5. Comptes de démonstration

| Nom | Rôle | Email |
|---|---|---|
| Moussa Yarwaye | Propriétaire | `moussa@yarwaye.sn` |
| Awa Sarr | Gérant | `awa@yarwaye.sn` |
| Ibrahima Ndiaye | Caissier | `ibrahima@yarwaye.sn` |

Le changement de session se fait avec le bouton en bas de la barre latérale
(projet de démonstration : pas de hachage réel des mots de passe).

---

## 6. Commandes utiles

```bash
npx drizzle-kit push      # applique le schéma dans PostgreSQL
npm run build             # build de production
npm start                 # sert l'application
```

Codes promo testables dans la vitrine client : `YARWAYE10` (-10 %) et `MALIKA5` (-5 %).

---

## 7. Mettre l'application en ligne gratuitement

Deux services gratuits, sans carte bancaire :

| Besoin | Service | Offre gratuite |
|---|---|---|
| Héberger le site Next.js | **Vercel** | Hobby — illimité en trafic personnel |
| Héberger PostgreSQL | **Neon** | 0,5 Go de données, 1 projet |

### Étape 1 — créer la base de données (Neon)
1. Aller sur **https://neon.tech** → *Sign in with GitHub*.
2. **New project** → nom : `yarwaye` → région : *Europe (Frankfurt)* → **Create**.
3. Bouton **Connect** → copier la **Pooled connection string**, qui ressemble à :
   `postgresql://user:mdp@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`

### Étape 2 — publier le code sur GitHub
Le dépôt `Diabaye-dev/yarwaye` existe déjà : pousser la branche de travail suffit.

### Étape 3 — déployer avec Vercel
1. Aller sur **https://vercel.com/signup** → *Continue with GitHub*.
2. **Add New → Project** → importer le dépôt `yarwaye`.
3. Choisir la branche à déployer (`main` ou `feature/vitrine-client-complete`).
4. Framework : **Next.js** (auto-détecté), laisser les champs de build par défaut.
5. Dans **Environment Variables**, ajouter :

   | Nom | Valeur |
   |---|---|
   | `DATABASE_URL` | la chaîne copiée depuis Neon (avec `?sslmode=require`) |

6. **Deploy** : ~1 minute, puis une URL du type
   `https://yarwaye.vercel.app`.

### Étape 4 — rien d'autre à faire
Aucun terminal, aucune commande `drizzle-kit push` :
`src/instrumentation.ts` crée les 8 tables et insère les données de démonstration
**au premier démarrage** du serveur (`CREATE TABLE IF NOT EXISTS`, donc relançable
sans risque ni doublon).

Pour vérifier : ouvrir **`/api/health`** →

```json
{ "ok": true, "store": "AGRO SERVICE YARWAYE", "contact": "767866536",
  "initialisation": { "tables": "créées : users, products, ...", "produits": 12, "ventes": 4 } }
```

### Variable d'environnement optionnelle
| Variable | Rôle | Défaut |
|---|---|---|
| `DATABASE_SSL_STRICT` | à `1` : exiger un certificat SSL reconnu | `0` (accepte les CAs des offres gratuites) |
| `DATABASE_POOL_MAX` | nombre max de connexions SQL par instance | `3` (adapté au serverless) |

### Si Neon est en veille
Les bases gratuites s'endorment après inactivité : la première requête met
~2-3 s de plus, puis tout revient à la normale. La connexion est réglée avec un
délai de 10 s pour ne pas afficher d'erreur pendant ce réveil.

### Alternative 100 % française / autres offre
- **Render.com** (web service gratuit) + base PostgreSQL Supabase gratuite :
  utiliser `npm run build` / `npm start`, et activer `output: "standalone"` dans
  `next.config.ts`.
- **Infomaniak / o2switch** : pour un mutualisé, prévoir Node.js (moins simple).
