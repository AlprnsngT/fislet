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

    // 2. Category Share Analytics (Pazarlama Kategori Dağılımı)
    const categoryStatsRaw = await prisma.receiptItem.groupBy({
      by: ['categoryId'],
      _sum: { totalPrice: true, quantity: true },
      _count: { id: true },
    });

    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const categoryAnalytics = categoryStatsRaw.map((stat) => ({
      categoryName: stat.categoryId ? categoryMap.get(stat.categoryId) || 'Diğer' : 'Genel',
      totalSpent: Number(stat._sum.totalPrice || 0),
      totalQuantity: Number(stat._sum.quantity || 0),
      itemCount: stat._count.id,
    }));

    // 3. Top Products Analytics (En Çok Satılan / Okutulan Ürün Trendleri)
    const topProductsRaw = await prisma.receiptItem.groupBy({
      by: ['itemName'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const topProducts = topProductsRaw.map((p) => ({
      itemName: p.itemName,
      totalQuantity: Number(p._sum.quantity || 0),
      totalRevenue: Number(p._sum.totalPrice || 0),
    }));

    // 4. Merchant Market Share (Market / Mağaza Pazar Payı)
    const merchantShareRaw = await prisma.receipt.groupBy({
      by: ['merchantName'],
      where: { status: 'PROCESSED' },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    });

    const merchantShare = merchantShareRaw.map((m) => ({
      merchantName: m.merchantName || 'Bilinmeyen Mağaza',
      receiptCount: m._count.id,
      totalVolume: Number(m._sum.totalAmount || 0),
    }));

    // 5. Recent System Logs for Admin Audit
    const recentReceipts = await prisma.receipt.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, username: true, email: true } },
        items: { include: { category: true } },
      },
    });

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
      },
      categoryAnalytics,
      topProducts,
      merchantShare,
      recentReceipts: recentReceipts.map((r) => ({
        id: r.id,
        user: r.user.name || r.user.username,
        merchantName: r.merchantName || 'Mağaza',
        totalAmount: Number(r.totalAmount),
        cashbackAmount: Number(r.cashbackAmount),
        status: r.status,
        date: r.createdAt,
        itemsCount: r.items.length,
      })),
    });
  } catch (error: any) {
    console.error('Admin Analytics API error:', error);
    return NextResponse.json({ error: 'Analiz verileri çekilirken bir hata oluştu' }, { status: 500 });
  }
}
