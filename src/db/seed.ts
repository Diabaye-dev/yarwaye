/* ============================================================================
 *  FICHIER : src/db/seed.ts
 *  LANGAGE : TypeScript
 *  RÔLE    : Remplir la base de données avec des DONNÉES DE DÉMONSTRATION
 *            réalistes (on appelle ça un "seed" = semis en anglais).
 *
 *  Ce fichier insère :
 *    - Les paramètres d'AGRO SERVICE YARWAYE (nom, adresse Keur Massar, tél)
 *    - 3 utilisateurs (Ousmane Yarwaye, Aminata Sow, Moussa Diop)
 *    - 4 fournisseurs (coopérative agricole, intrants, minoterie, cimenterie)
 *    - 13 produits (maïs, riz, engrais, farine, ciment, pâtisserie...)
 *    - 5 clients avec des carnets de crédit
 *    - 4 commandes avec leurs articles
 *    - Des mouvements de stock (entrées, ventes, ajustements)
 *
 *  La fonction vérifie d'abord si des données existent déjà pour ne pas
 *  dupliquer les informations à chaque redémarrage du serveur.
 * ==========================================================================*/

import { db } from "./index";
import { users, products, customers, suppliers, orders, orderItems, stockMovements, storeSettings } from "./schema";

export async function seedDatabase() {
  // Check if store settings already exist
  const existingSettings = await db.select().from(storeSettings).limit(1);
  if (existingSettings.length > 0) {
    return; // Already seeded
  }

  console.log("Seeding AGRO SERVICE YARWAYE database...");

  // 1. Store settings
  await db.insert(storeSettings).values({
    storeName: "AGRO SERVICE YARWAYE",
    phone: "767866536",
    whatsapp: "767866536",
    email: "contact@agroserviceyarwaye.sn",
    address: "Malika QRT Malika / MER - BP 17000 - Keur Massar, Dakar, Sénégal",
    currency: "FCFA",
    taxRate: 0,
    receiptHeader: "AGRO SERVICE YARWAYE - AGRICULTURE & COMMERCE GÉNÉRAL",
    receiptFooter:
      "Malika QRT Malika / MER - BP 17000 - Keur Massar, Dakar, Sénégal | Tél & Wave/OM : 767866536. Merci de votre confiance !",
    waveNumber: "767866536",
    orangeMoneyNumber: "767866536",
  });

  // 2. Demo Users
  await db.insert(users).values([
    {
      name: "Ousmane Yarwaye",
      email: "direction@agroserviceyarwaye.sn",
      passwordHash: "yarwaye2025",
      role: "owner",
      phone: "767866536",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Aminata Sow",
      email: "gerance@agroserviceyarwaye.sn",
      passwordHash: "gerance123",
      role: "manager",
      phone: "+221 77 654 32 10",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Moussa Diop",
      email: "caisse@agroserviceyarwaye.sn",
      passwordHash: "caisse123",
      role: "cashier",
      phone: "+221 78 321 09 87",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  ]);

  // 3. Suppliers
  const insertedSuppliers = await db.insert(suppliers).values([
    {
      name: "Coopérative Agricole de Keur Massar",
      contactPerson: "Cheikh Tidiane Ndiaye",
      phone: "767866536",
      email: "appro@coop-keurmassar.sn",
      address: "Zone Agricole de Keur Massar, Route de Tivaouane",
      categories: "Maïs, Mil, Sorgho, Arachide",
      notes: "Partenaire principal pour l'approvisionnement en céréales locales à la récolte.",
    },
    {
      name: "Intrants Agricoles du Fleuve (IAF)",
      contactPerson: "Boubacar Sy",
      phone: "+221 33 821 44 00",
      email: "ventes@intrants-fleuve.sn",
      address: "Zone Industrielle de Sébikotane, Dakar",
      categories: "Engrais, Semences, Phytosanitaires",
      notes: "Livraison sous 72h, paiement à 30 jours pour les commandes de plus de 2 tonnes.",
    },
    {
      name: "Minoteries du Baol",
      contactPerson: "Mariama Diallo",
      phone: "+221 76 543 21 00",
      email: "commercial@minoteries-baol.sn",
      address: "Zone Industrielle de Thiès, Route de Dakar",
      categories: "Farine de blé, Son, Semoule",
      notes: "Tarifs dégressifs sur farine de boulangerie sacs de 50 kg.",
    },
    {
      name: "Cimenterie du Sahel — Dépôt Keur Massar",
      contactPerson: "Ibrahima Fall",
      phone: "+221 70 456 78 90",
      email: "depot.keurmassar@ciment-sahel.sn",
      address: "Route de Bamako, Keur Massar, Dakar",
      categories: "Ciment, Fer à béton, Gravier, Carrelage",
      notes: "Dépôt BTP — livraison camion benne assurée sur Grand Dakar.",
    },
  ]).returning();

  // 4. Products (Agriculture, Agroalimentaire, BTP, Pâtisserie)
  const insertedProducts = await db.insert(products).values([
    {
      name: "Maïs Grain Jaune Local — Sac de 100 kg",
      sku: "ASY-CER-001",
      barcode: "610123456701",
      category: "Céréales & Oléagineux",
      description: "Maïs grain jaune séché au soleil, trié et calibré, provenance Keur Massar. Idéal élevage, transformation en semoule et industrie agroalimentaire.",
      costPrice: 14500,
      sellingPrice: 17500,
      stock: 120,
      minStockAlert: 20,
      unit: "sac",
      imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Riz Parfumé Usiné Premium — Sac de 25 kg",
      sku: "ASY-CER-002",
      barcode: "610123456702",
      category: "Céréales & Oléagineux",
      description: "Riz parfumé brisure 100%, propre et brillant, emballage kraft renforcé. Qualité supérieure pour la restauration et la vente au détail.",
      costPrice: 15500,
      sellingPrice: 18500,
      stock: 85,
      minStockAlert: 15,
      unit: "sac",
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Mil Grain Dépelliculé — Sac de 50 kg",
      sku: "ASY-CER-003",
      barcode: "610123456703",
      category: "Céréales & Oléagineux",
      description: "Mil grain de première qualité, propre, sans impuretés, adapté à la production de couscous local et à l'alimentation familiale.",
      costPrice: 12000,
      sellingPrice: 15000,
      stock: 60,
      minStockAlert: 12,
      unit: "sac",
      imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Arachide Décortiquée Triage 7 — Sac de 50 kg",
      sku: "ASY-OLE-004",
      barcode: "610123456704",
      category: "Céréales & Oléagineux",
      description: "Arachide décortiquée triage 7, taux d'humidité contrôlé, destinée aux huileries, pâtisseries et torréfacteurs.",
      costPrice: 22000,
      sellingPrice: 27500,
      stock: 42,
      minStockAlert: 10,
      unit: "sac",
      imageUrl: "https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Engrais NPK 15-15-15 Complexé — Sac de 50 kg",
      sku: "ASY-INT-005",
      barcode: "610123456705",
      category: "Intrants Agricoles",
      description: "Engrais complet NPK 15-15-15 pour céréales et maraîchage. Homologué, avec bon de livraison et conseil agronomique offert.",
      costPrice: 17000,
      sellingPrice: 20500,
      stock: 75,
      minStockAlert: 15,
      unit: "sac",
      imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Semence Maïs Hybride Séché Amélioré — Sachet 5 kg",
      sku: "ASY-SEM-006",
      barcode: "610123456706",
      category: "Intrants Agricoles",
      description: "Semence de maïs hybride haut rendement (7 à 9 t/ha), traitée fongicide, sachet scellé avec date de validité et fiche technique.",
      costPrice: 6500,
      sellingPrice: 9000,
      stock: 95,
      minStockAlert: 20,
      unit: "sachet",
      imageUrl: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Aliment Bovin Complet 14% MAT — Sac de 50 kg",
      sku: "ASY-ELE-007",
      barcode: "610123456707",
      category: "Alimentation du Bétail",
      description: "Aliment composé pour bovins et ovins, 14% de matières azotées, à base de son de mil, tourteau d'arachide et minéraux.",
      costPrice: 11500,
      sellingPrice: 14500,
      stock: 68,
      minStockAlert: 15,
      unit: "sac",
      imageUrl: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Farine de Blé T55 Boulangerie — Sac de 50 kg",
      sku: "ASY-TRA-008",
      barcode: "610123456708",
      category: "Transformation Agroalimentaire",
      description: "Farine de blé type 55, force W220, panification idéale pour pains, brioches et pâtisseries professionnelles.",
      costPrice: 18500,
      sellingPrice: 22000,
      stock: 110,
      minStockAlert: 20,
      unit: "sac",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Sucre Cristallisé Spécial — Sac de 50 kg",
      sku: "ASY-EPI-009",
      barcode: "610123456709",
      category: "Épicerie Générale",
      description: "Sucre cristallisé blanc spécial pour boissons, pâtisserie et industrie alimentaire. Sac scellé, conforme aux normes sanitaires.",
      costPrice: 19500,
      sellingPrice: 23000,
      stock: 54,
      minStockAlert: 12,
      unit: "sac",
      imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Huile d'Arachide Vierge Bidon 20 L",
      sku: "ASY-TRA-010",
      barcode: "610123456710",
      category: "Transformation Agroalimentaire",
      description: "Huile d'arachide vierge pressée localement, bidon alimentaire de 20 litres pour restaurants, collectivités et revendeurs.",
      costPrice: 24000,
      sellingPrice: 29500,
      stock: 38,
      minStockAlert: 10,
      unit: "bidon",
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Ciment CPJ 45 Haute Performance — Sac de 50 kg",
      sku: "ASY-BTP-011",
      barcode: "610123456711",
      category: "Matériaux BTP",
      description: "Ciment Portland composé CPJ 45, sac de 50 kg, prise rapide et grande résistance pour fondations, dalles et ouvrages en béton armé.",
      costPrice: 5500,
      sellingPrice: 6500,
      stock: 260,
      minStockAlert: 40,
      unit: "sac",
      imageUrl: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Fer à Béton HA 8 mm — Barre de 12 m",
      sku: "ASY-BTP-012",
      barcode: "610123456712",
      category: "Matériaux BTP",
      description: "Barre d'acier haute adhérence 8 mm, longueur 12 mètres, conforme aux normes de construction en vigueur au Sénégal.",
      costPrice: 3200,
      sellingPrice: 3900,
      stock: 320,
      minStockAlert: 50,
      unit: "barre",
      imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      name: "Plateau Pâtisserie « Fête » — 24 Pièces Assorties",
      sku: "ASY-PAT-013",
      barcode: "610123456713",
      category: "Pâtisserie & Restauration",
      description: "Plateau de 24 pièces assorties (éclairs, tartes, mignardises au beurre de karité et chocolat), préparé le jour même par notre laboratoire.",
      costPrice: 9500,
      sellingPrice: 14000,
      stock: 18,
      minStockAlert: 5,
      unit: "plateau",
      imageUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=500&auto=format&fit=crop&q=80",
      isActive: true,
    },
  ]).returning();

  // 5. Customers
  const insertedCustomers = await db.insert(customers).values([
    {
      name: "Ferme Agricole de Guédiawaye (SARL)",
      phone: "+221 77 123 45 67",
      email: "achats@ferme-guediawaye.sn",
      address: "Zone Agricole de Guédiawaye, Dakar",
      creditBalance: 0,
      totalSpent: 1450000,
      loyaltyPoints: 1450,
      notes: "Client grossiste — commandes mensuelles de maïs et aliment bétail.",
    },
    {
      name: "Boulangerie Le Bon Pain de Malika",
      phone: "+221 78 890 12 34",
      email: "gerance@bonpain-malika.sn",
      address: "Malika Centre, Route de Tivaouane, Keur Massar",
      creditBalance: 85000,
      totalSpent: 620000,
      loyaltyPoints: 620,
      notes: "Prélèvement hebdomadaire de farine T55 et de sucre. Carnet de crédit actif.",
    },
    {
      name: "Bâtiment & Travaux Publics Ndiaye Frères",
      phone: "767866536",
      email: "chantiers@ndiaye-btp.sn",
      address: "Zone de Captage, Keur Massar, Dakar",
      creditBalance: 0,
      totalSpent: 2380000,
      loyaltyPoints: 2380,
      notes: "Contact direct via la ligne 767866536 — fournitures ciment et fer pour chantiers.",
    },
    {
      name: "Awa Ndiaye — Maraîchère Keur Massar",
      phone: "+221 70 456 78 90",
      email: "awa.ndiaye@gmail.com",
      address: "Périmètre Maraîcher de Keur Massar",
      creditBalance: 25000,
      totalSpent: 178000,
      loyaltyPoints: 178,
      notes: "Achats d'engrais et de semences en début de saison des pluies.",
    },
    {
      name: "Restaurant Teranga — Keur Massar",
      phone: "+221 77 222 33 44",
      email: "commandes@restaurant-teranga.sn",
      address: "RN1, Keur Massar, Dakar",
      creditBalance: 0,
      totalSpent: 540000,
      loyaltyPoints: 540,
      notes: "Fourniture régulière en huile d'arachide, riz et sucre.",
    },
  ]).returning();

  // 6. Orders & Items
  const order1 = await db.insert(orders).values({
    orderNumber: "ASY-2025-001",
    customerId: insertedCustomers[0].id,
    customerName: insertedCustomers[0].name,
    customerPhone: insertedCustomers[0].phone,
    subtotal: 175000,
    discount: 5000,
    tax: 0,
    total: 170000,
    paymentMethod: "wave_om_767866536",
    paymentStatus: "paid",
    orderStatus: "completed",
    cashierName: "Moussa Diop",
    notes: "Paiement Wave validé sur la ligne 767866536. Remise volume appliquée.",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 3),
  }).returning();

  await db.insert(orderItems).values([
    {
      orderId: order1[0].id,
      productId: insertedProducts[0].id,
      productName: insertedProducts[0].name,
      productSku: insertedProducts[0].sku,
      unitPrice: 17500,
      costPrice: 14500,
      quantity: 10,
      total: 175000,
    },
  ]);

  const order2 = await db.insert(orders).values({
    orderNumber: "ASY-2025-002",
    customerId: insertedCustomers[1].id,
    customerName: insertedCustomers[1].name,
    customerPhone: insertedCustomers[1].phone,
    subtotal: 89000,
    discount: 0,
    tax: 0,
    total: 89000,
    paymentMethod: "cash",
    paymentStatus: "paid",
    orderStatus: "completed",
    cashierName: "Aminata Sow",
    notes: "Encaissement espèces au comptoir Agro Service Yarwaye.",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
  }).returning();

  await db.insert(orderItems).values([
    {
      orderId: order2[0].id,
      productId: insertedProducts[7].id,
      productName: insertedProducts[7].name,
      productSku: insertedProducts[7].sku,
      unitPrice: 22000,
      costPrice: 18500,
      quantity: 3,
      total: 66000,
    },
    {
      orderId: order2[0].id,
      productId: insertedProducts[8].id,
      productName: insertedProducts[8].name,
      productSku: insertedProducts[8].sku,
      unitPrice: 23000,
      costPrice: 19500,
      quantity: 1,
      total: 23000,
    },
  ]);

  const order3 = await db.insert(orders).values({
    orderNumber: "ASY-2025-003",
    customerId: insertedCustomers[2].id,
    customerName: insertedCustomers[2].name,
    customerPhone: "767866536",
    subtotal: 650000,
    discount: 20000,
    tax: 0,
    total: 630000,
    paymentMethod: "wave_om_767866536",
    paymentStatus: "paid",
    orderStatus: "completed",
    cashierName: "Ousmane Yarwaye",
    notes: "Chantier Keur Massar — livraison camion effectuée. Règlement Orange Money validé sur 767866536.",
    createdAt: new Date(Date.now() - 3600 * 1000 * 5),
  }).returning();

  await db.insert(orderItems).values([
    {
      orderId: order3[0].id,
      productId: insertedProducts[10].id,
      productName: insertedProducts[10].name,
      productSku: insertedProducts[10].sku,
      unitPrice: 6500,
      costPrice: 5500,
      quantity: 80,
      total: 520000,
    },
    {
      orderId: order3[0].id,
      productId: insertedProducts[11].id,
      productName: insertedProducts[11].name,
      productSku: insertedProducts[11].sku,
      unitPrice: 3900,
      costPrice: 3200,
      quantity: 30,
      total: 117000,
    },
  ]);

  const order4 = await db.insert(orders).values({
    orderNumber: "ASY-2025-004",
    customerId: null,
    customerName: "Client Comptoir — Guédiawaye",
    customerPhone: "767866536",
    subtotal: 20500,
    discount: 0,
    tax: 0,
    total: 20500,
    paymentMethod: "cash",
    paymentStatus: "paid",
    orderStatus: "completed",
    cashierName: "Moussa Diop",
    notes: "Vente comptoir engrais NPK.",
    createdAt: new Date(Date.now() - 3600 * 1000 * 2),
  }).returning();

  await db.insert(orderItems).values([
    {
      orderId: order4[0].id,
      productId: insertedProducts[4].id,
      productName: insertedProducts[4].name,
      productSku: insertedProducts[4].sku,
      unitPrice: 20500,
      costPrice: 17000,
      quantity: 1,
      total: 20500,
    },
  ]);

  // 7. Stock Movements
  await db.insert(stockMovements).values([
    {
      productId: insertedProducts[0].id,
      productName: insertedProducts[0].name,
      type: "in",
      quantity: 150,
      previousStock: 0,
      newStock: 150,
      reason: "Arrivage camion — Coopérative Agricole de Keur Massar",
      performedBy: "Ousmane Yarwaye",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 6),
    },
    {
      productId: insertedProducts[0].id,
      productName: insertedProducts[0].name,
      type: "sale",
      quantity: -10,
      previousStock: 130,
      newStock: 120,
      reason: "Vente commande ASY-2025-001",
      performedBy: "Moussa Diop",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 3),
    },
    {
      productId: insertedProducts[10].id,
      productName: insertedProducts[10].name,
      type: "in",
      quantity: 300,
      previousStock: 40,
      newStock: 340,
      reason: "Réapprovisionnement dépôt ciment Keur Massar",
      performedBy: "Aminata Sow",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
    },
    {
      productId: insertedProducts[12].id,
      productName: insertedProducts[12].name,
      type: "adjustment",
      quantity: -2,
      previousStock: 20,
      newStock: 18,
      reason: "Pertes plateau pâtisserie (contrôle qualité)",
      performedBy: "Aminata Sow",
      createdAt: new Date(Date.now() - 3600 * 1000 * 8),
    },
  ]);

  console.log("Seeding AGRO SERVICE YARWAYE completed successfully!");
}
