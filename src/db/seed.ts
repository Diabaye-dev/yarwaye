/**
 * DONNÉES DE DÉMONSTRATION — src/db/seed.ts
 * 
 * seedDatabase() insère un jeu de données réaliste (produits agricoles,
 * transformation, BTP, pâtisserie/restauration, clients, fournisseurs, ventes
 * et mouvements de stock) afin que l'application soit vivante dès le 1er
 * chargement.
 * La fonction est idempotente : si "store_settings" contient déjà une ligne,
 * on considère la base comme déjà peuplée et on ne réinsère rien.
 */
import { db } from "./index";
import { users, products, customers, suppliers, orders, orderItems, stockMovements, storeSettings } from "./schema";

export async function seedDatabase() {
  const existingSettings = await db.select().from(storeSettings).limit(1);
  if (existingSettings.length > 0) {
    return;
  }

  console.log("Seeding AGRO SERVICE YARWAYE database...");

  await db.insert(storeSettings).values({
    storeName: "AGRO SERVICE YARWAYE",
    phone: "767866536",
    whatsapp: "767866536",
    email: "contact@yarwaye.sn",
    address: "Malika Qrt Malika / Mer - BP 17000 - Keur Massar, Dakar, Sénégal",
    currency: "FCFA",
    taxRate: 0,
    receiptHeader: "AGRO SERVICE YARWAYE",
    receiptFooter:
      "Agriculture • Transformation • Commerce • BTP • Pâtisserie • Restauration. Merci de votre confiance ! Assistance: 767866536",
    waveNumber: "767866536",
    orangeMoneyNumber: "767866536",
  });

  await db
    .insert(users)
    .values([
      {
        name: "Moussa Yarwaye",
        email: "moussa@yarwaye.sn",
        passwordHash: "yarwaye2025",
        role: "owner",
        phone: "767866536",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      },
      {
        name: "Awa Sarr",
        email: "awa@yarwaye.sn",
        passwordHash: "manager123",
        role: "manager",
        phone: "+221 77 654 32 10",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      },
      {
        name: "Ibrahima Ndiaye",
        email: "ibrahima@yarwaye.sn",
        passwordHash: "cashier123",
        role: "cashier",
        phone: "+221 78 321 09 87",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      },
    ])
    .returning();

  const insertedSuppliers = await db
    .insert(suppliers)
    .values([
      {
        name: "Coopérative Agricole de Malika",
        contactPerson: "Cheikh Fall",
        phone: "767866536",
        email: "coop.malika@yarwaye.sn",
        address: "Zone agricole Malika, Keur Massar",
        categories: "Céréales, Légumes, Fruits",
        notes: "Fournisseur principal des produits bruts pour transformation Yarwaye.",
      },
      {
        name: "Huilerie & Moulins du Sahel",
        contactPerson: "Mariama Ba",
        phone: "+221 33 821 44 00",
        email: "commandes@moulins-sahel.sn",
        address: "Route de Rufisque, Dakar",
        categories: "Huiles, Farines, Céréales transformées",
        notes: "Livraison hebdomadaire et conditions de crédit 15 jours.",
      },
      {
        name: "Matériaux & BTP Keur Massar",
        contactPerson: "Ousmane Diop",
        phone: "+221 76 543 21 00",
        email: "btp@keurmassar.sn",
        address: "Keur Massar Extension, Dakar",
        categories: "BTP, Quincaillerie, Matériaux",
        notes: "Partenaire pour prestations de services et chantiers.",
      },
    ])
    .returning();

  const insertedProducts = await db
    .insert(products)
    .values([
      {
        name: "Sac de Riz Local Parfumé 25kg",
        sku: "YAR-AGRI-001",
        barcode: "600123456701",
        category: "Produits Agricoles",
        description: "Riz local sélectionné, grains parfumés, idéale pour familles et restauration collective.",
        costPrice: 14500,
        sellingPrice: 17500,
        stock: 60,
        minStockAlert: 10,
        unit: "sac",
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Farine de Maïs Transformée 5kg",
        sku: "YAR-TRANS-002",
        barcode: "600123456702",
        category: "Transformation Agroalimentaire",
        description: "Farine de maïs finement moulue par AGRO SERVICE YARWAYE, idéale pour bouillies et pâtisserie.",
        costPrice: 2800,
        sellingPrice: 4000,
        stock: 45,
        minStockAlert: 8,
        unit: "sac",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Huile d'Arachide Artisanale 5L",
        sku: "YAR-TRANS-003",
        barcode: "600123456703",
        category: "Transformation Agroalimentaire",
        description: "Huile d'arachide pressée localement, pure et sans additif, pour cuisine et restauration.",
        costPrice: 6500,
        sellingPrice: 8500,
        stock: 38,
        minStockAlert: 8,
        unit: "bidon",
        imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Panier de Légumes Frais de Saison",
        sku: "YAR-AGRI-004",
        barcode: "600123456704",
        category: "Produits Agricoles",
        description: "Assortiment de légumes frais du marché de Malika : oignons, tomates, aubergines, piments.",
        costPrice: 2500,
        sellingPrice: 4500,
        stock: 28,
        minStockAlert: 6,
        unit: "panier",
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Plateau Pâtisserie Maison (12 pièces)",
        sku: "YAR-PAT-005",
        barcode: "600123456705",
        category: "Pâtisserie & Restauration",
        description: "Assortiment de gâteaux et pâtisseries maison préparés par l'équipe Yarwaye.",
        costPrice: 6000,
        sellingPrice: 10000,
        stock: 12,
        minStockAlert: 4,
        unit: "plateau",
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Menu Restauration Complet (Plat + Boisson)",
        sku: "YAR-REST-006",
        barcode: "600123456706",
        category: "Pâtisserie & Restauration",
        description: "Formule repas du jour : plat local, accompagnement et boisson. Service sur place ou à emporter.",
        costPrice: 1500,
        sellingPrice: 3500,
        stock: 80,
        minStockAlert: 15,
        unit: "menu",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Ciment Portland 50kg",
        sku: "YAR-BTP-007",
        barcode: "600123456707",
        category: "BTP & Matériaux",
        description: "Ciment de qualité pour maçonnerie, fondations et finitions de chantier.",
        costPrice: 4800,
        sellingPrice: 5800,
        stock: 100,
        minStockAlert: 20,
        unit: "sac",
        imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Prestation Labour & Préparation de Parcelle",
        sku: "YAR-SERV-008",
        barcode: "600123456708",
        category: "Prestations de Services",
        description: "Service de labour, hersage et préparation de parcelle agricole autour de Malika / Keur Massar.",
        costPrice: 25000,
        sellingPrice: 45000,
        stock: 15,
        minStockAlert: 3,
        unit: "prestation",
        imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Semences Maraîchères Certifiées (Lot)",
        sku: "YAR-AGRI-009",
        barcode: "600123456709",
        category: "Produits Agricoles",
        description: "Lot de semences maraîchères adaptées au climat local : tomate, oignon, chou, piment.",
        costPrice: 3500,
        sellingPrice: 5500,
        stock: 40,
        minStockAlert: 8,
        unit: "lot",
        imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c309?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Sachet de Farine de Blé T55 1kg",
        sku: "YAR-ALIM-010",
        barcode: "600123456710",
        category: "Commerce Général",
        description: "Farine de blé pour pain, beignets et pâtisserie artisanale.",
        costPrice: 450,
        sellingPrice: 750,
        stock: 120,
        minStockAlert: 25,
        unit: "sachet",
        imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Kit Matériel de Maçonnerie (Truelle + Niveau)",
        sku: "YAR-BTP-011",
        barcode: "600123456711",
        category: "BTP & Matériaux",
        description: "Kit de base pour artisans et chantiers de proximité à Keur Massar.",
        costPrice: 7500,
        sellingPrice: 12500,
        stock: 18,
        minStockAlert: 5,
        unit: "kit",
        imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
      {
        name: "Jus de Bissap Naturel 1L (Production Maison)",
        sku: "YAR-REST-012",
        barcode: "600123456712",
        category: "Pâtisserie & Restauration",
        description: "Jus de bissap artisanal, sans conservateur, produit et conditionné par Yarwaye.",
        costPrice: 500,
        sellingPrice: 1000,
        stock: 3,
        minStockAlert: 10,
        unit: "bouteille",
        imageUrl: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=500&auto=format&fit=crop&q=80",
        isActive: true,
      },
    ])
    .returning();

  const insertedCustomers = await db
    .insert(customers)
    .values([
      {
        name: "Fatou Diop",
        phone: "+221 77 123 45 67",
        email: "fatou.diop@gmail.com",
        address: "Keur Massar Cité Sonatel",
        creditBalance: 0,
        totalSpent: 125000,
        loyaltyPoints: 125,
        notes: "Cliente régulière pour riz et paniers légumes.",
      },
      {
        name: "Mamadou Ba",
        phone: "+221 78 890 12 34",
        email: "mamadou.ba@yahoo.fr",
        address: "Malika Extension",
        creditBalance: 15000,
        totalSpent: 89000,
        loyaltyPoints: 89,
        notes: "Reliquat de 15 000 FCFA à régler à la fin du mois.",
      },
      {
        name: "Restaurant Teranga Malika",
        phone: "767866536",
        email: "teranga.malika@outlook.com",
        address: "Malika Qrt Mer, près du marché",
        creditBalance: 0,
        totalSpent: 345000,
        loyaltyPoints: 345,
        notes: "Compte professionnel — commandes hebdomadaires d'huile et riz.",
      },
      {
        name: "Entreprise BTP Sarr & Fils",
        phone: "+221 70 456 78 90",
        email: "sarr.btp@tech.sn",
        address: "Keur Massar Route de Rufisque",
        creditBalance: 0,
        totalSpent: 210000,
        loyaltyPoints: 210,
        notes: "Achats ciment et kits maçonnerie pour chantiers.",
      },
    ])
    .returning();

  const order1 = await db
    .insert(orders)
    .values({
      orderNumber: "YAR-2025-001",
      customerId: insertedCustomers[0].id,
      customerName: insertedCustomers[0].name,
      customerPhone: insertedCustomers[0].phone,
      subtotal: 22000,
      discount: 1000,
      tax: 0,
      total: 21000,
      paymentMethod: "wave_om_767866536",
      paymentStatus: "paid",
      orderStatus: "completed",
      cashierName: "Ibrahima Ndiaye",
      notes: "Paiement reçu via Wave sur 767866536.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 3),
    })
    .returning();

  await db.insert(orderItems).values([
    {
      orderId: order1[0].id,
      productId: insertedProducts[0].id,
      productName: insertedProducts[0].name,
      productSku: insertedProducts[0].sku,
      unitPrice: 17500,
      costPrice: 14500,
      quantity: 1,
      total: 17500,
    },
    {
      orderId: order1[0].id,
      productId: insertedProducts[3].id,
      productName: insertedProducts[3].name,
      productSku: insertedProducts[3].sku,
      unitPrice: 4500,
      costPrice: 2500,
      quantity: 1,
      total: 4500,
    },
  ]);

  const order2 = await db
    .insert(orders)
    .values({
      orderNumber: "YAR-2025-002",
      customerId: insertedCustomers[1].id,
      customerName: insertedCustomers[1].name,
      customerPhone: insertedCustomers[1].phone,
      subtotal: 13500,
      discount: 0,
      tax: 0,
      total: 13500,
      paymentMethod: "cash",
      paymentStatus: "paid",
      orderStatus: "completed",
      cashierName: "Awa Sarr",
      notes: "Paiement en espèces au comptoir Yarwaye.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
    })
    .returning();

  await db.insert(orderItems).values([
    {
      orderId: order2[0].id,
      productId: insertedProducts[2].id,
      productName: insertedProducts[2].name,
      productSku: insertedProducts[2].sku,
      unitPrice: 8500,
      costPrice: 6500,
      quantity: 1,
      total: 8500,
    },
    {
      orderId: order2[0].id,
      productId: insertedProducts[5].id,
      productName: insertedProducts[5].name,
      productSku: insertedProducts[5].sku,
      unitPrice: 3500,
      costPrice: 1500,
      quantity: 1,
      total: 3500,
    },
    {
      orderId: order2[0].id,
      productId: insertedProducts[11].id,
      productName: insertedProducts[11].name,
      productSku: insertedProducts[11].sku,
      unitPrice: 1500,
      costPrice: 500,
      quantity: 1,
      total: 1500,
    },
  ]);

  const order3 = await db
    .insert(orders)
    .values({
      orderNumber: "YAR-2025-003",
      customerId: insertedCustomers[2].id,
      customerName: insertedCustomers[2].name,
      customerPhone: "767866536",
      subtotal: 43500,
      discount: 2500,
      tax: 0,
      total: 41000,
      paymentMethod: "wave_om_767866536",
      paymentStatus: "paid",
      orderStatus: "completed",
      cashierName: "Moussa Yarwaye",
      notes: "Commande pro restauration. Règlement Orange Money validé sur 767866536.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 4),
    })
    .returning();

  await db.insert(orderItems).values([
    {
      orderId: order3[0].id,
      productId: insertedProducts[0].id,
      productName: insertedProducts[0].name,
      productSku: insertedProducts[0].sku,
      unitPrice: 17500,
      costPrice: 14500,
      quantity: 2,
      total: 35000,
    },
    {
      orderId: order3[0].id,
      productId: insertedProducts[2].id,
      productName: insertedProducts[2].name,
      productSku: insertedProducts[2].sku,
      unitPrice: 8500,
      costPrice: 6500,
      quantity: 1,
      total: 8500,
    },
  ]);

  const order4 = await db
    .insert(orders)
    .values({
      orderNumber: "YAR-2025-004",
      customerId: insertedCustomers[3].id,
      customerName: insertedCustomers[3].name,
      customerPhone: insertedCustomers[3].phone,
      subtotal: 18300,
      discount: 0,
      tax: 0,
      total: 18300,
      paymentMethod: "cash",
      paymentStatus: "paid",
      orderStatus: "completed",
      cashierName: "Ibrahima Ndiaye",
      notes: "Achat matériaux BTP pour chantier Keur Massar.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 1),
    })
    .returning();

  await db.insert(orderItems).values([
    {
      orderId: order4[0].id,
      productId: insertedProducts[6].id,
      productName: insertedProducts[6].name,
      productSku: insertedProducts[6].sku,
      unitPrice: 5800,
      costPrice: 4800,
      quantity: 1,
      total: 5800,
    },
    {
      orderId: order4[0].id,
      productId: insertedProducts[10].id,
      productName: insertedProducts[10].name,
      productSku: insertedProducts[10].sku,
      unitPrice: 12500,
      costPrice: 7500,
      quantity: 1,
      total: 12500,
    },
  ]);

  await db.insert(stockMovements).values([
    {
      productId: insertedProducts[0].id,
      productName: insertedProducts[0].name,
      type: "in",
      quantity: 65,
      previousStock: 0,
      newStock: 65,
      reason: "Récolte et approvisionnement Coopérative Agricole de Malika",
      performedBy: "Moussa Yarwaye",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 7),
    },
    {
      productId: insertedProducts[0].id,
      productName: insertedProducts[0].name,
      type: "sale",
      quantity: -3,
      previousStock: 63,
      newStock: 60,
      reason: "Ventes commandes YAR-2025-001 et YAR-2025-003",
      performedBy: "Moussa Yarwaye",
      createdAt: new Date(Date.now() - 3600 * 1000 * 4),
    },
    {
      productId: insertedProducts[11].id,
      productName: insertedProducts[11].name,
      type: "adjustment",
      quantity: -7,
      previousStock: 10,
      newStock: 3,
      reason: "Préparation commandes restauration et dégustation",
      performedBy: "Awa Sarr",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 1),
    },
  ]);

  // silence unused warning for suppliers if needed
  void insertedSuppliers;

  console.log("Seeding AGRO SERVICE YARWAYE completed successfully!");
}
