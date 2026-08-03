import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function resetAndSeedDatabase() {
  console.log('🧹 Clearing database tables...');

  // 1. Clear transactional & user data in reverse dependency order
  await prisma.walletTransaction.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared all users, wallets, receipts, items, and transactions.');

  // 2. Seed Default Categories if missing
  const defaultCategories = [
    { name: 'Market & Süpermarket', slug: 'market' },
    { name: 'Restoran & Kafe', slug: 'restoran-kafe' },
    { name: 'Akaryakıt & Otomotiv', slug: 'akaryakit' },
    { name: 'Giyim & Aksesuar', slug: 'giyim' },
    { name: 'Elektronik & Teknoloji', slug: 'elektronik' },
    { name: 'Sağlık & Kozmetik', slug: 'saglik-kozmetik' },
    { name: 'Diğer & Genel', slug: 'diger' },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
  }

  console.log('✅ Seeded default categories.');

  // 3. Seed default admin user (username: admin, password: admin123)
  const hashedPassword = hashPassword('admin123');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fisokut.com',
      username: 'admin',
      name: 'Sistem Yöneticisi',
      password: hashedPassword,
      role: 'ADMIN',
      wallet: {
        create: {
          balance: 0.00,
        },
      },
    },
  });

  console.log('👤 Created default admin user (username: admin, password: admin123)');
  console.log('🎉 Database reset & seed completed successfully.');
}

resetAndSeedDatabase()
  .catch((e) => {
    console.error('❌ Reset DB Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
