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
    const { identifier, name, email, password } = body;

    // Determine input value (identifier or name/email)
    const rawInput = (identifier || email || name || '').trim();
    const rawPassword = (password || '').trim();

    if (!rawInput || !rawPassword) {
      return NextResponse.json({ error: 'Kullanıcı adı / E-posta ve şifre zorunludur' }, { status: 400 });
    }

    const isEmail = rawInput.includes('@');
    const userEmail = isEmail ? rawInput.toLowerCase() : `${rawInput.toLowerCase()}@fisokut.local`;
    const username = isEmail ? rawInput.split('@')[0].toLowerCase() : rawInput.toLowerCase();

    // Check if user already exists by email or username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userEmail },
          { username: username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Bu kullanıcı adı veya e-posta ile zaten bir hesap var' }, { status: 400 });
    }

    const hashedPassword = hashPassword(rawPassword);

    // Create user and wallet atomically
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name ? name.trim() : username,
          username: username,
          email: userEmail,
          password: hashedPassword,
          role: username === 'admin' ? 'ADMIN' : 'USER',
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
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Kayıt sırasında bir hata oluştu' }, { status: 500 });
  }
}
