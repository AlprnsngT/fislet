import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Ad Soyad, E-posta ve şifre zorunludur' }, { status: 400 });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Bu e-posta adresi ile zaten kayıtlı bir hesap var' }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    // Create user and wallet in a single transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: sanitizedEmail,
          password: hashedPassword,
        },
      });

      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0.00,
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Kayıt sırasında bir sunucu hatası oluştu' }, { status: 500 });
  }
}
