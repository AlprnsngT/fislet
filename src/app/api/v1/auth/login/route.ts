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
    const { identifier, email, password } = body;

    const rawInput = (identifier || email || '').trim();
    const rawPassword = (password || '').trim();

    if (!rawInput || !rawPassword) {
      return NextResponse.json({ error: 'Kullanıcı adı / E-posta ve şifre zorunludur' }, { status: 400 });
    }

    const hashedPassword = hashPassword(rawPassword);
    const sanitizedInput = rawInput.toLowerCase();

    // Check if input contains '@' (email) or is a username
    const isEmail = sanitizedInput.includes('@');

    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: sanitizedInput }
        : { OR: [{ username: sanitizedInput }, { email: sanitizedInput }] },
    });

    if (!user || user.password !== hashedPassword) {
      return NextResponse.json({ error: 'Kullanıcı adı/e-posta adresi veya şifre hatalı' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Giriş yapılırken bir hata oluştu' }, { status: 500 });
  }
}
