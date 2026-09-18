# 🌾 AGRO SERVICE YARWAYE — Plateforme Commerciale Complète

> Système de gestion commercial complet : **Tableau de bord**, **Point de Vente (POS)**,
> **Gestion de stock**, **Carnet de crédit**, **Vitrine e-commerce** et **Commandes en ligne**.

**📍 Adresse :** Malika QRT Malika / MER - BP 17000 - Keur Massar, Dakar, Sénégal
**📞 Tél / WhatsApp / Wave / Orange Money :** `767866536`
**✉️ Email :** contact@agroserviceyarwaye.sn

**Secteurs d'activité :** Agriculture • Transformation et commercialisation de produits agricoles et alimentaires • Prestations de services • Commerce général • Achat/vente de marchandises • BTP • Pâtisserie • Restauration

---

## ✨ Fonctionnalités

### 🖥️ Espace Gérance (Tableau de bord)
- **Tableau de bord** avec indicateurs en temps réel (ventes du jour, chiffre d'affaires, alertes stock, dettes clients)
- **Caisse / Point de Vente (POS)** : recherche instantanée, prix de gros, remises, paiements **Espèces / Wave / Orange Money (767866536) / Carte / Crédit**
- **Tickets de caisse imprimables** (format reçu thermique)
- **Inventaire & articles** : CRUD complet, ajustement de stock (+/−), journal des mouvements, export CSV
- **Ventes & commandes** : historique, filtres, détails, remboursements avec réintégration automatique du stock
- **Clients & carnet de crédit** : fiches clients, points de fidélité, recouvrement de dettes, intégration WhatsApp
- **Fournisseurs** : coopératives agricoles, minoteries, cimenteries, etc.
- **Marges & rapports** : marge brute, valorisation du stock, répartition des paiements, top 5 des ventes
- **Paramètres boutique** : nom, adresse, numéros Wave/OM, textes du ticket

### 🌐 Vitrine Client (E-commerce)
- Accueil avec hero visuel, services, zones de livraison, témoignages et FAQ
- **Catalogue** : recherche, filtres (catégorie, prix, disponibilité, favoris), tri (prix, nouveautés…)
- **Fiche produit détaillée** avec **tarification progressive** (prix détail & prix de gros dès 10 unités)
- **Tunnel de commande en 3 étapes** : panier → livraison (6 zones avec frais automatiques) → paiement
- **Codes promo fonctionnels** : `YARWAYE10` (-10%), `AGRO5` (-5%), `GROS15` (-15%)
- **Livraison offerte dès 100 000 FCFA**
- **Suivi de commande en temps réel** (timeline 4 étapes)
- **Espace client** : historique, points fidélité, profil modifiable
- **Contact & devis** : formulaire transmis directement via WhatsApp

### 🔐 Authentification
- Sessions multi-utilisateurs (Propriétaire / Gérant / Caissier)
- Changement instantané de profil et inscription de nouveaux membres

---

## 🛠️ Stack Technique

| Technologie | Rôle |
|---|---|
| **Next.js 16** (App Router) | Framework web (pages, API, rendu serveur) |
| **React 19** | Interface utilisateur (composants, états) |
| **TypeScript** | Langage principal typé et sécurisé |
| **PostgreSQL** | Base de données relationnelle |
| **Drizzle ORM** | Interaction avec la base de données |
| **Tailwind CSS v4** | Design & responsive mobile/tablette |
| **Lucide React** | Jeu d'icônes |

---

## 🚀 Installation & Démarrage

```bash
# 1. Cloner le dépôt
git clone https://github.com/Diabaye-dev/yarwaye.git
cd yarwaye

# 2. Installer les dépendances
npm install

# 3. Configurer la base de données
#    Créer un fichier .env avec :
#    DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db

# 4. Appliquer le schéma de la base de données
npx drizzle-kit push

# 5. Lancer le serveur de développement
npm run dev
```

L'application est accessible sur **http://localhost:3000**.
Les données de démonstration (produits, clients, commandes) sont insérées automatiquement au premier lancement.

---

## 📂 Structure du Projet

```
src/
├── app/                # Pages Next.js + API REST
│   ├── page.tsx        # Tableau de bord principal
│   ├── layout.tsx      # Gabarit global
│   └── api/            # Endpoints (products, orders, customers, auth...)
├── components/         # Composants React (POS, vitrine, modales...)
├── context/            # Contexte d'authentification
├── db/                 # Schéma PostgreSQL + connexion + seed
├── lib/                # Utilitaires (formatMoney, formatDate)
└── types/              # Types TypeScript partagés
```

📖 **Consultez [DOCUMENTATION.md](./DOCUMENTATION.md) pour une documentation technique détaillée.**

---

## 📞 Contact

**AGRO SERVICE YARWAYE**
Malika QRT Malika / MER - BP 17000 - Keur Massar, Dakar, Sénégal
📞 **767866536** (Appels / WhatsApp / Wave / Orange Money)

---

© 2026 Agro Service Yarwaye — Tous droits réservés.
