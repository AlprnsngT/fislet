import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId zorunludur' }, { status: 400 });
    }

    const receipts = await prisma.receipt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      receipts: receipts.map((r) => ({
        id: r.id,
        imageUrl: r.imageUrl,
        vkn: r.vkn || 'Tespit Edilemedi',
        receiptNo: r.receiptNo || '-',
        totalAmount: Number(r.totalAmount),
        cashbackAmount: Number(r.cashbackAmount),
        status: r.status, // PENDING, PROCESSED, REJECTED, DUPLICATE
        ocrEngineUsed: r.ocrEngineUsed,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching user receipts:', error);
    return NextResponse.json({ error: 'Fişler getirilirken bir hata oluştu' }, { status: 500 });
  }
}
