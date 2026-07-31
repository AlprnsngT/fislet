import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({
        userId,
        balance: 0.00,
        transactions: [],
      });
    }

    return NextResponse.json({
      userId: wallet.userId,
      balance: Number(wallet.balance),
      transactions: wallet.transactions.map((tx) => ({
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.transactionType,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
