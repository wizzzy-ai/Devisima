import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import type { AnalyticsDateRange } from "@/lib/analytics/date-range";

const paidOrderWhere = (start: Date, end: Date): Prisma.OrderWhereInput => ({
  status: "PAID",
  createdAt: { gte: start, lt: end },
  payments: { some: { status: "SUCCESS" } },
});

const validSaleLedgerWhere = (start: Date, end: Date, sellerId?: string): Prisma.SellerTransactionWhereInput => ({
  type: "SALE",
  status: { in: ["PENDING", "AVAILABLE", "PAID"] },
  createdAt: { gte: start, lt: end },
  order: { status: "PAID", payments: { some: { status: "SUCCESS" } } },
  ...(sellerId ? { sellerId } : {}),
});

export async function getAdminAnalytics(range: AnalyticsDateRange) {
  const currentOrders = paidOrderWhere(range.start, range.end);
  const previousOrders = paidOrderWhere(range.previousStart, range.previousEnd);
  const [
    userCount, sellerCount, productCount, currentOrderCount, previousOrderCount,
    currentOrderAmounts, previousOrderAmounts, currentSales, previousSales,
    currentCommission, previousCommission, currentSellerEarnings, previousSellerEarnings,
    refundAggregate, couponAggregate, chartRows, topProducts, categoryRows, couponRows,
    reviewAggregate, reviewDistribution, reviewCount, userGrowth, totalDownloadCount,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "SELLER", status: "ACTIVE" } }),
    db.product.count(),
    db.order.count({ where: currentOrders }),
    db.order.count({ where: previousOrders }),
    db.order.aggregate({ where: currentOrders, _sum: { subtotal: true, discount: true, total: true }, _avg: { total: true } }),
    db.order.aggregate({ where: previousOrders, _sum: { total: true } }),
    db.orderItem.aggregate({ where: { order: currentOrders }, _sum: { quantity: true } }),
    db.orderItem.aggregate({ where: { order: previousOrders }, _sum: { quantity: true } }),
    db.sellerTransaction.aggregate({ where: validSaleLedgerWhere(range.start, range.end), _sum: { commissionAmount: true } }),
    db.sellerTransaction.aggregate({ where: validSaleLedgerWhere(range.previousStart, range.previousEnd), _sum: { commissionAmount: true } }),
    db.sellerTransaction.aggregate({ where: validSaleLedgerWhere(range.start, range.end), _sum: { netAmount: true } }),
    db.sellerTransaction.aggregate({ where: validSaleLedgerWhere(range.previousStart, range.previousEnd), _sum: { netAmount: true } }),
    db.refund.aggregate({ where: { status: "SUCCESS", updatedAt: { gte: range.start, lt: range.end } }, _sum: { amount: true }, _count: true }),
    db.order.aggregate({ where: { ...currentOrders, couponCode: { not: null } }, _sum: { couponDiscountAmount: true }, _count: true }),
    getRevenueSeries(range),
    getTopProducts(range),
    getCategoryAnalytics(range),
    getCouponAnalytics(range),
    db.review.aggregate({ where: { isDeleted: false, createdAt: { gte: range.start, lt: range.end } }, _avg: { rating: true }, _count: true }),
    db.review.groupBy({ by: ["rating"], where: { isDeleted: false, createdAt: { gte: range.start, lt: range.end } }, _count: { _all: true }, orderBy: { rating: "asc" } }),
    db.review.count({ where: { isDeleted: false } }),
    db.user.count({ where: { createdAt: { gte: range.start, lt: range.end } } }),
    db.download.count({ where: { downloadedAt: { gte: range.start, lt: range.end } } }),
  ]);
  const currentRevenue = currentOrderAmounts._sum.total ?? 0;
  const previousRevenue = previousOrderAmounts._sum.total ?? 0;
  const refunds = refundAggregate._sum.amount ?? 0;
  const commission = currentCommission._sum.commissionAmount ?? 0;
  const sellerEarnings = currentSellerEarnings._sum.netAmount ?? 0;
  const productViews = await db.productView.count({ where: { viewedAt: { gte: range.start, lt: range.end } } });

  return {
    summary: {
      revenue: currentRevenue,
      orders: currentOrderCount,
      unitsSold: currentSales._sum.quantity ?? 0,
      users: userCount,
      sellers: sellerCount,
      products: productCount,
      averageOrderValue: currentOrderAmounts._avg.total ?? 0,
      commission,
      sellerEarnings,
      refunds,
      couponDiscounts: couponAggregate._sum.couponDiscountAmount ?? 0,
      couponOrders: couponAggregate._count,
      productViews,
      downloads: totalDownloadCount,
      reviews: reviewCount,
      averageRating: reviewAggregate._avg.rating,
      newUsers: userGrowth,
      netPlatformRevenue: commission - refunds,
    },
    comparison: {
      revenue: compare(currentRevenue, previousRevenue),
      orders: compare(currentOrderCount, previousOrderCount),
      unitsSold: compare(currentSales._sum.quantity ?? 0, previousSales._sum.quantity ?? 0),
      commission: compare(commission, previousCommission._sum.commissionAmount ?? 0),
      sellerEarnings: compare(sellerEarnings, previousSellerEarnings._sum.netAmount ?? 0),
    },
    revenueSeries: chartRows,
    topProducts,
    categories: categoryRows,
    coupons: couponRows,
    ratingDistribution: Array.from({ length: 5 }, (_, index) => {
      const rating = index + 1;
      return { rating, count: reviewDistribution.find((entry) => entry.rating === rating)?._count._all ?? 0 };
    }),
    range: serializeRange(range),
  };
}

export async function getSellerAnalytics(sellerId: string, range: AnalyticsDateRange) {
  const productWhere = { sellerId, status: { not: "ARCHIVED" as const } };
  const saleWhere = validSaleLedgerWhere(range.start, range.end, sellerId);
  const previousSaleWhere = validSaleLedgerWhere(range.previousStart, range.previousEnd, sellerId);
  const [
    productCount, publishedProducts, sales, previousSales, salesCount, orderIds, previousOrderIds,
    reviewAggregate, reviewCount, views, downloads, wishlistCount, series, performance, reviewDistribution,
  ] = await Promise.all([
    db.product.count({ where: productWhere }),
    db.product.count({ where: { sellerId, status: "PUBLISHED" } }),
    db.sellerTransaction.aggregate({ where: saleWhere, _sum: { grossAmount: true, commissionAmount: true, netAmount: true } }),
    db.sellerTransaction.aggregate({ where: previousSaleWhere, _sum: { grossAmount: true, commissionAmount: true, netAmount: true } }),
    db.sellerTransaction.count({ where: saleWhere }),
    db.sellerTransaction.findMany({ where: saleWhere, distinct: ["orderId"], select: { orderId: true } }),
    db.sellerTransaction.findMany({ where: previousSaleWhere, distinct: ["orderId"], select: { orderId: true } }),
    db.review.aggregate({ where: { isDeleted: false, product: { sellerId }, createdAt: { gte: range.start, lt: range.end } }, _avg: { rating: true }, _count: true }),
    db.review.count({ where: { isDeleted: false, product: { sellerId } } }),
    db.productView.count({ where: { product: { sellerId }, viewedAt: { gte: range.start, lt: range.end } } }),
    db.download.count({ where: { product: { sellerId }, downloadedAt: { gte: range.start, lt: range.end } } }),
    db.wishlistItem.count({ where: { product: { sellerId }, createdAt: { gte: range.start, lt: range.end } } }),
    getRevenueSeries(range, sellerId),
    getSellerProductPerformance(sellerId, range),
    db.review.groupBy({ by: ["rating"], where: { isDeleted: false, product: { sellerId }, createdAt: { gte: range.start, lt: range.end } }, _count: { _all: true }, orderBy: { rating: "asc" } }),
  ]);
  const gross = sales._sum.grossAmount ?? 0;
  const net = sales._sum.netAmount ?? 0;
  return {
    summary: {
      grossRevenue: gross,
      commission: sales._sum.commissionAmount ?? 0,
      sellerEarnings: net,
      sales: salesCount,
      orders: orderIds.filter((entry) => entry.orderId !== null).length,
      products: productCount,
      publishedProducts,
      averageOrderValue: orderIds.length ? Math.round(gross / orderIds.length) : null,
      reviews: reviewCount,
      periodReviews: reviewAggregate._count,
      averageRating: reviewAggregate._avg.rating,
      views,
      downloads,
      wishlistAdds: wishlistCount,
      conversionRate: views ? (salesCount / views) * 100 : null,
    },
    comparison: {
      revenue: compare(gross, previousSales._sum.grossAmount ?? 0),
      orders: compare(orderIds.length, previousOrderIds.filter((entry) => entry.orderId !== null).length),
      sales: compare(salesCount, await db.sellerTransaction.count({ where: previousSaleWhere })),
      sellerEarnings: compare(net, previousSales._sum.netAmount ?? 0),
    },
    revenueSeries: series,
    products: performance,
    ratingDistribution: Array.from({ length: 5 }, (_, index) => {
      const rating = index + 1;
      return { rating, count: reviewDistribution.find((entry) => entry.rating === rating)?._count._all ?? 0 };
    }),
    range: serializeRange(range),
  };
}

export async function getProductAnalytics(sellerId: string, productId: string, range: AnalyticsDateRange) {
  const product = await db.product.findFirst({
    where: { id: productId, sellerId },
    select: { id: true, title: true, status: true, totalViews: true, createdAt: true, category: { select: { name: true } } },
  });
  if (!product) return null;
  const [viewCount, wishlistCount, downloads, reviews, saleSummary, orders] = await Promise.all([
    db.productView.count({ where: { productId, viewedAt: { gte: range.start, lt: range.end } } }),
    db.wishlistItem.count({ where: { productId, createdAt: { gte: range.start, lt: range.end } } }),
    db.download.count({ where: { productId, downloadedAt: { gte: range.start, lt: range.end } } }),
    db.review.aggregate({ where: { productId, isDeleted: false, createdAt: { gte: range.start, lt: range.end } }, _avg: { rating: true }, _count: true }),
    db.sellerTransaction.aggregate({ where: { ...validSaleLedgerWhere(range.start, range.end, sellerId), productId }, _sum: { grossAmount: true, commissionAmount: true, netAmount: true }, _count: true }),
    db.sellerTransaction.findMany({ where: { ...validSaleLedgerWhere(range.start, range.end, sellerId), productId }, distinct: ["orderId"], select: { orderId: true } }),
  ]);
  return {
    product,
    metrics: {
      views: viewCount,
      wishlistAdds: wishlistCount,
      purchases: saleSummary._count,
      orders: orders.filter((entry) => entry.orderId !== null).length,
      downloads,
      grossRevenue: saleSummary._sum.grossAmount ?? 0,
      commission: saleSummary._sum.commissionAmount ?? 0,
      sellerEarnings: saleSummary._sum.netAmount ?? 0,
      reviews: reviews._count,
      averageRating: reviews._avg.rating,
      conversionRate: viewCount ? (saleSummary._count / viewCount) * 100 : null,
    },
    range: serializeRange(range),
  };
}

export async function getBuyerAnalytics(userId: string) {
  const [purchaseCount, downloads, wishlists, reviews, spending] = await Promise.all([
    db.purchase.count({ where: { userId, order: { status: "PAID", payments: { some: { status: "SUCCESS" } } } } }),
    db.download.count({ where: { userId } }),
    db.wishlistItem.count({ where: { userId } }),
    db.review.count({ where: { userId, isDeleted: false } }),
    db.order.aggregate({ where: { userId, status: "PAID", payments: { some: { status: "SUCCESS" } } }, _sum: { total: true } }),
  ]);
  return { purchases: purchaseCount, downloads, wishlist: wishlists, reviews, spending: spending._sum.total ?? 0 };
}

export async function getSalesExportRows(range: AnalyticsDateRange, sellerId?: string) {
  return db.sellerTransaction.findMany({
    where: validSaleLedgerWhere(range.start, range.end, sellerId),
    orderBy: { createdAt: "asc" },
    take: 50_000,
    select: {
      createdAt: true,
      order: { select: { reference: true } },
      product: { select: { title: true } },
      sellerId: true,
      grossAmount: true,
      commissionAmount: true,
      netAmount: true,
      currency: true,
    },
  });
}

export async function getRevenueSeries(range: AnalyticsDateRange, sellerId?: string) {
  const useMonth = range.end.getTime() - range.start.getTime() > 90 * 24 * 60 * 60 * 1000;
  const unit = useMonth ? "month" : "day";
  const sellerClause = sellerId ? Prisma.sql`AND st."sellerId" = ${sellerId}` : Prisma.empty;
  const rows = await db.$queryRaw<Array<{
    bucket: Date;
    gross: bigint | number;
    commission: bigint | number;
    earnings: bigint | number;
    sales: bigint | number;
  }>>(Prisma.sql`
    SELECT date_trunc(${unit}, st."createdAt" AT TIME ZONE 'UTC') AS bucket,
      COALESCE(SUM(st."grossAmount"), 0)::bigint AS gross,
      COALESCE(SUM(st."commissionAmount"), 0)::bigint AS commission,
      COALESCE(SUM(st."netAmount"), 0)::bigint AS earnings,
      COUNT(*)::bigint AS sales
    FROM "SellerTransaction" st
    JOIN "Order" o ON o."id" = st."orderId"
    WHERE st."type" = 'SALE'
      AND st."status" IN ('PENDING', 'AVAILABLE', 'PAID')
      AND o."status" = 'PAID'
      AND EXISTS (SELECT 1 FROM "Payment" p WHERE p."orderId" = o."id" AND p."status" = 'SUCCESS')
      AND st."createdAt" >= ${range.start}
      AND st."createdAt" < ${range.end}
      ${sellerClause}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);
  const refunds = sellerId
    ? await db.sellerTransaction.findMany({
      where: { sellerId, type: "REFUND", status: { in: ["PENDING", "AVAILABLE", "PAID"] }, createdAt: { gte: range.start, lt: range.end } },
      select: { createdAt: true, grossAmount: true },
    })
    : await db.refund.findMany({
      where: { status: "SUCCESS", updatedAt: { gte: range.start, lt: range.end } },
      select: { updatedAt: true, amount: true },
    });
  const refundByBucket = new Map<string, number>();
  for (const refund of refunds) {
    const keyDate = new Date("createdAt" in refund ? refund.createdAt : refund.updatedAt);
    keyDate.setUTCHours(0, 0, 0, 0);
    if (useMonth) keyDate.setUTCDate(1);
    const key = keyDate.toISOString();
    const amount = "grossAmount" in refund ? Math.abs(refund.grossAmount) : refund.amount;
    refundByBucket.set(key, (refundByBucket.get(key) ?? 0) + amount);
  }
  const result = rows.map((row) => {
    const bucket = new Date(row.bucket);
    const normalized = new Date(Date.UTC(bucket.getUTCFullYear(), bucket.getUTCMonth(), useMonth ? 1 : bucket.getUTCDate()));
    return {
      date: normalized.toISOString(),
      gross: Number(row.gross),
      commission: Number(row.commission),
      earnings: Number(row.earnings),
      refunds: refundByBucket.get(normalized.toISOString()) ?? 0,
      sales: Number(row.sales),
    };
  });
  return fillSeriesGaps(result, range, useMonth);
}

async function getTopProducts(range: AnalyticsDateRange) {
  const rows = await db.sellerTransaction.groupBy({
    by: ["productId"],
    where: { ...validSaleLedgerWhere(range.start, range.end), productId: { not: null } },
    _sum: { grossAmount: true, netAmount: true },
    _count: { _all: true },
    orderBy: { _sum: { grossAmount: "desc" } },
    take: 10,
  });
  const products = await db.product.findMany({ where: { id: { in: rows.flatMap((row) => row.productId ? [row.productId] : []) } }, select: { id: true, title: true, category: { select: { name: true } } } });
  const productMap = new Map(products.map((product) => [product.id, product]));
  return rows.flatMap((row) => {
    const product = row.productId ? productMap.get(row.productId) : undefined;
    return product ? [{ id: product.id, title: product.title, category: product.category.name, grossRevenue: row._sum.grossAmount ?? 0, sellerEarnings: row._sum.netAmount ?? 0, sales: row._count._all }] : [];
  });
}

async function getCategoryAnalytics(range: AnalyticsDateRange) {
  return db.$queryRaw<Array<{ id: string; name: string; products: bigint; unitsSold: bigint; grossRevenue: bigint; commission: bigint }>>(Prisma.sql`
    SELECT c."id", c."name",
      COUNT(DISTINCT p."id")::bigint AS products,
      COALESCE(SUM(oi."quantity"), 0)::bigint AS "unitsSold",
      COALESCE(SUM(oi."priceAtPurchase" * oi."quantity"), 0)::bigint AS "grossRevenue",
      COALESCE(SUM(st."commissionAmount"), 0)::bigint AS commission
    FROM "Category" c
    JOIN "Product" p ON p."categoryId" = c."id"
    JOIN "OrderItem" oi ON oi."productId" = p."id"
    JOIN "Order" o ON o."id" = oi."orderId"
    LEFT JOIN "SellerTransaction" st ON st."orderItemId" = oi."id"
      AND st."type" = 'SALE' AND st."status" IN ('PENDING', 'AVAILABLE', 'PAID')
    WHERE o."status" = 'PAID'
      AND o."createdAt" >= ${range.start}
      AND o."createdAt" < ${range.end}
      AND EXISTS (SELECT 1 FROM "Payment" payment WHERE payment."orderId" = o."id" AND payment."status" = 'SUCCESS')
    GROUP BY c."id", c."name"
    ORDER BY "grossRevenue" DESC
    LIMIT 12
  `).then((rows) => rows.map((row) => ({
    ...row,
    products: Number(row.products),
    unitsSold: Number(row.unitsSold),
    grossRevenue: Number(row.grossRevenue),
    commission: Number(row.commission),
  })));
}

async function getCouponAnalytics(range: AnalyticsDateRange) {
  const rows = await db.order.groupBy({
    by: ["couponCode"],
    where: { ...paidOrderWhere(range.start, range.end), couponCode: { not: null } },
    _sum: { couponDiscountAmount: true, total: true },
    _count: { _all: true },
    orderBy: { _sum: { total: "desc" } },
    take: 20,
  });
  return rows.map((row) => ({
    code: row.couponCode ?? "",
    orders: row._count._all,
    discounts: row._sum.couponDiscountAmount ?? 0,
    revenue: row._sum.total ?? 0,
  }));
}

async function getSellerProductPerformance(sellerId: string, range: AnalyticsDateRange) {
  const products = await db.product.findMany({
    where: { sellerId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, status: true, averageRating: true, reviewCount: true },
  });
  const ids = products.map((product) => product.id);
  const [sales, downloads, wishlists, views] = await Promise.all([
    db.sellerTransaction.groupBy({ by: ["productId"], where: { ...validSaleLedgerWhere(range.start, range.end, sellerId), productId: { in: ids } }, _sum: { grossAmount: true, netAmount: true }, _count: { _all: true } }),
    db.download.groupBy({ by: ["productId"], where: { productId: { in: ids }, downloadedAt: { gte: range.start, lt: range.end } }, _count: { _all: true } }),
    db.wishlistItem.groupBy({ by: ["productId"], where: { productId: { in: ids }, createdAt: { gte: range.start, lt: range.end } }, _count: { _all: true } }),
    db.productView.groupBy({ by: ["productId"], where: { productId: { in: ids }, viewedAt: { gte: range.start, lt: range.end } }, _count: { _all: true } }),
  ]);
  const salesById = new Map(sales.flatMap((row) => row.productId ? [[row.productId, row] as const] : []));
  const downloadById = new Map(downloads.map((row) => [row.productId, row._count._all]));
  const wishlistById = new Map(wishlists.map((row) => [row.productId, row._count._all]));
  const viewsById = new Map(views.map((row) => [row.productId, row._count._all]));
  return products.map((product) => {
    const sale = salesById.get(product.id);
    const viewCount = viewsById.get(product.id) ?? 0;
    const unitCount = sale?._count._all ?? 0;
    return {
      ...product,
      sales: unitCount,
      revenue: sale?._sum.grossAmount ?? 0,
      sellerEarnings: sale?._sum.netAmount ?? 0,
      downloads: downloadById.get(product.id) ?? 0,
      wishlistAdds: wishlistById.get(product.id) ?? 0,
      views: viewCount,
      conversionRate: viewCount ? (unitCount / viewCount) * 100 : null,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

type RevenueSeriesItem = { date: string; gross: number; commission: number; earnings: number; refunds: number; sales: number };

function fillSeriesGaps(rows: RevenueSeriesItem[], range: AnalyticsDateRange, monthly: boolean) {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const cursor = new Date(range.start);
  cursor.setUTCHours(0, 0, 0, 0);
  if (monthly) cursor.setUTCDate(1);
  const end = new Date(range.end);
  while (cursor < end) {
    const date = cursor.toISOString();
    if (!byDate.has(date)) byDate.set(date, { date, gross: 0, commission: 0, earnings: 0, refunds: 0, sales: 0 });
    if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function compare(current: number, previous: number) {
  return previous === 0 ? (current === 0 ? null : null) : ((current - previous) / Math.abs(previous)) * 100;
}

function serializeRange(range: AnalyticsDateRange) {
  return { start: range.start.toISOString(), end: new Date(range.end.getTime() - 1).toISOString(), period: range.period };
}
