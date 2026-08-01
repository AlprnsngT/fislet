const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function cleanReset() {
  console.log('--- RESETTING & CLEANING ALL DATABASE DATA ---');

  // 1. Delete all transactions, items, receipts, wallets
  await prisma.walletTransaction.deleteMany({});
  await prisma.receiptItem.deleteMany({});
  await prisma.receipt.deleteMany({});
  await prisma.wallet.deleteMany({});

  // 2. Delete all users except admin
  await prisma.user.deleteMany({
    where: {
      username: { not: 'admin' },
    },
  });

  console.log('✅ All non-admin user and receipt data deleted.');

  // 3. Upsert Admin User (username: admin, password: admin)
  const adminPassword = hashPassword('admin');
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminPassword, role: 'ADMIN' },
    create: {
      username: 'admin',
      email: 'admin@fisokut.com',
      name: 'Sistem Yöneticisi',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.wallet.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id, balance: 1000.00 },
  });

  console.log('✅ Admin account preserved: username="admin", password="admin"');

  // 4. Upsert Default SystemConfig (Default 10% cashback rate)
  await prisma.systemConfig.upsert({
    where: { id: 'default' },
    update: { cashbackType: 'PERCENTAGE', cashbackValue: 10.00 },
    create: {
      id: 'default',
      cashbackType: 'PERCENTAGE',
      cashbackValue: 10.00,
    },
  });

  console.log('✅ SystemConfig initialized: 10% Cashback Rate default.');
  console.log('🎉 Clean Reset Completed Successfully!');
}

cleanReset()
  .catch((e) => {
    console.error('Reset error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
