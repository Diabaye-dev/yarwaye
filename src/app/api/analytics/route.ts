/* ============================================================================
 *  FICHIER : src/app/api/analytics/route.ts
 *  LANGAGE : TypeScript — Next.js Route Handler (API REST)
 *  RÔLE    : Calculer tous les CHIFFRES CLÉS de la boutique à la volée :
 *            chiffre d'affaires, marge brute, valeur du stock, dettes clients,
 *            répartition des paiements (espèces vs Wave/OM 767866536),
 *            top 5 des meilleures ventes et journal des mouvements de stock.
 *
 *    GET /api/analytics → renvoie un objet JSON avec tous ces indicateurs,
 *                         utilisé par l'écran "Marges & Rapports".
 * ==========================================================================*/

import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, customers, stockMovements } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

// Calcul de tous les indicateurs financiers de la boutique
export async function GET() {
  try {
    const allOrders = await db.select().from(orders);
    const allProducts = await db.select().from(products);
    const allCustomers = await db.select().from(customers);
    const allItems = await db.select().from(orderItems);
    const recentMovements = await db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt)).limit(8);

    // Calculate metrics
    const completedOrders = allOrders.filter((o) => o.orderStatus === "completed");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = completedOrders.filter((o) => new Date(o.createdAt) >= today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

    // Gross profit estimation (revenue minus cost)
    let totalCostOfSold = 0;
    for (const item of allItems) {
      totalCostOfSold += (item.costPrice || 0) * item.quantity;
    }
    const estimatedGrossProfit = Math.max(0, totalRevenue - totalCostOfSold);

    // Total inventory value at cost and at retail
    const inventoryValueCost = allProducts.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
    const inventoryValueRetail = allProducts.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
    const lowStockCount = allProducts.filter((p) => p.stock <= p.minStockAlert).length;
    const totalCreditOwed = allCustomers.reduce((sum, c) => sum + c.creditBalance, 0);

    // Payment method distribution
    const paymentBreakdown: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      wave_om_767866536: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      credit: { count: 0, total: 0 },
    };

    for (const o of completedOrders) {
      const pm = o.paymentMethod || "cash";
      if (!paymentBreakdown[pm]) {
        paymentBreakdown[pm] = { count: 0, total: 0 };
      }
      paymentBreakdown[pm].count += 1;
      paymentBreakdown[pm].total += o.total;
    }

    // Top selling products
    const productSalesMap = new Map<number, { name: string; quantity: number; revenue: number }>();
    for (const item of allItems) {
      if (!productSalesMap.has(item.productId)) {
        productSalesMap.set(item.productId, { name: item.productName, quantity: 0, revenue: 0 });
      }
      const p = productSalesMap.get(item.productId)!;
      p.quantity += item.quantity;
      p.revenue += item.total;
    }

    const topSelling = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    for (const p of allProducts) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }

    return NextResponse.json({
      totalRevenue,
      todayRevenue,
      ordersCount: completedOrders.length,
      todayOrdersCount: todayOrders.length,
      estimatedGrossProfit,
      inventoryValueCost,
      inventoryValueRetail,
      totalProducts: allProducts.length,
      lowStockCount,
      totalCustomers: allCustomers.length,
      totalCreditOwed,
      paymentBreakdown,
      topSelling,
      categoryCounts,
      recentMovements,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
