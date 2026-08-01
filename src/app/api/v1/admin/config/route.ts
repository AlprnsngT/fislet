import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    let config = await prisma.systemConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: 'default',
          cashbackType: 'PERCENTAGE',
          cashbackValue: 10.00,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        cashbackType: config.cashbackType,
        cashbackValue: Number(config.cashbackValue),
      },
    });
  } catch (error: any) {
    console.error('Get SystemConfig error:', error);
    return NextResponse.json({ error: 'Sistem konfigürasyonu çekilemedi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cashbackType, cashbackValue } = body;

    if (!cashbackType || cashbackValue === undefined || cashbackValue === null) {
      return NextResponse.json({ error: 'cashbackType ve cashbackValue zorunludur' }, { status: 400 });
    }

    const numValue = parseFloat(cashbackValue);
    if (isNaN(numValue) || numValue < 0) {
      return NextResponse.json({ error: 'Geçerli bir pozitif değer giriniz' }, { status: 400 });
    }

    const updatedConfig = await prisma.systemConfig.upsert({
      where: { id: 'default' },
      update: {
        cashbackType: cashbackType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        cashbackValue: numValue,
      },
      create: {
        id: 'default',
        cashbackType: cashbackType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        cashbackValue: numValue,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sistem cashback ayarları başarıyla güncellendi.',
      config: {
        cashbackType: updatedConfig.cashbackType,
        cashbackValue: Number(updatedConfig.cashbackValue),
      },
    });
  } catch (error: any) {
    console.error('Update SystemConfig error:', error);
    return NextResponse.json({ error: 'Ayarlar güncellenirken bir hata oluştu' }, { status: 500 });
  }
}
