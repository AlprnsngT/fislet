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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre zorunludur' }, { status: 400 });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const hashedPassword = hashPassword(password);

    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user || user.password !== hashedPassword) {
      return NextResponse.json({ error: 'E-posta adresi veya şifre hatalı' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Giriş yapılırken bir hata oluştu' }, { status: 500 });
  }
}
