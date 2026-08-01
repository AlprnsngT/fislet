import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // 1. Total Metrics
    const totalReceiptsCount = await prisma.receipt.count();
    const processedReceiptsCount = await prisma.receipt.count({ where: { status: 'PROCESSED' } });
    const rejectedReceiptsCount = await prisma.receipt.count({ where: { status: 'REJECTED' } });
    const totalUsersCount = await prisma.user.count({ where: { role: 'USER' } });

    const totalAmountAgg = await prisma.receipt.aggregate({
      _sum: { totalAmount: true, cashbackAmount: true },
      where: { status: 'PROCESSED' },
    });

    const totalVolume = Number(totalAmountAgg._sum.totalAmount || 0);
    const totalCashbackPaid = Number(totalAmountAgg._sum.cashbackAmount || 0);
    const avgBasketSize = processedReceiptsCount > 0 ? totalVolume / processedReceiptsCount : 0;

    // 2. Daily Scan Trend (Son 7 Günlük Dinamik Fiş Okutma Trend Çizgi Grafiği)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dailyScansRaw = await prisma.receipt.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      _sum: { totalAmount: true },
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' },
    });

    const dailyTrendMap = new Map<string, { count: number; volume: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateKey = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      dailyTrendMap.set(dateKey, { count: 0, volume: 0 });
    }

    dailyScansRaw.forEach((scan) => {
      const dateKey = new Date(scan.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      const current = dailyTrendMap.get(dateKey) || { count: 0, volume: 0 };
      dailyTrendMap.set(dateKey, {
        count: current.count + scan._count.id,
        volume: current.volume + Number(scan._sum.totalAmount || 0),
      });
    });

    const dailyTrend = Array.from(dailyTrendMap.entries()).map(([date, data]) => ({
      date,
      fişSayısı: data.count,
      hacim: data.volume,
    }));

    // 3. Category Share Analytics
    const categoryStatsRaw = await prisma.receiptItem.groupBy({
      by: ['categoryId'],
      _sum: { totalPrice: true, quantity: true },
      _count: { id: true },
    });

    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const categoryAnalytics = categoryStatsRaw.map((stat) => ({
      name: stat.categoryId ? categoryMap.get(stat.categoryId) || 'Diğer' : 'Genel',
      value: Number(stat._sum.totalPrice || 0),
      quantity: Number(stat._sum.quantity || 0),
    }));

    // 4. Top Products Analytics
    const topProductsRaw = await prisma.receiptItem.groupBy({
      by: ['itemName'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 7,
    });

    const topProducts = topProductsRaw.map((p) => ({
      itemName: p.itemName,
      adet: Number(p._sum.quantity || 0),
      tutar: Number(p._sum.totalPrice || 0),
    }));

    // 5. Detailed Products Catalog for "Ürünlerim" Tab
    const allItems = await prisma.receiptItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        category: true,
        receipt: { select: { merchantName: true, createdAt: true } },
      },
    });

    const productsCatalog = allItems.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      categoryName: item.category?.name || 'Genel',
      merchantName: item.receipt.merchantName || 'Market',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      date: item.createdAt,
    }));

    // 6. Merchant Market Share
    const merchantShareRaw = await prisma.receipt.groupBy({
      by: ['merchantName'],
      where: { status: 'PROCESSED' },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    });

    const merchantShare = merchantShareRaw.map((m) => ({
      name: m.merchantName || 'Bilinmeyen Mağaza',
      fişSayısı: m._count.id,
      hacim: Number(m._sum.totalAmount || 0),
    }));

    return NextResponse.json({
      success: true,
      metrics: {
        totalReceiptsCount,
        processedReceiptsCount,
        rejectedReceiptsCount,
        totalUsersCount,
        totalVolume,
        totalCashbackPaid,
        avgBasketSize,
        totalProductsCount: allItems.length,
      },
      dailyTrend,
      categoryAnalytics,
      topProducts,
      productsCatalog,
      merchantShare,
    });
  } catch (error: any) {
    console.error('Admin Analytics API error:', error);
    return NextResponse.json({ error: 'Analiz verileri çekilirken bir hata oluştu' }, { status: 500 });
  }
}
