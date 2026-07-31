const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function seed() {
  console.log('--- SEEDING ADMIN & INITIAL MARKETING DATA ---');

  // 1. Create Default Categories
  const categories = [
    { name: 'Gıda & Şarküteri', slug: 'gida-sarkuteri' },
    { name: 'İçecek & Meşrubat', slug: 'icecek-mesrubat' },
    { name: 'Temizlik & Hijyen', slug: 'temizlik-hijyen' },
    { name: 'Atıştırmalık & Tatlı', slug: 'atistirmalik-tatli' },
    { name: 'Kişisel Bakım', slug: 'kisisel-bakim' },
  ];

  const createdCategories = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = c.id;
  }
  console.log('✅ Categories created.');

  // 2. Create Admin User (username: admin, password: admin)
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
  console.log('✅ Admin user created: username="admin", password="admin" (Role: ADMIN)');

  // 3. Create Sample Marketing B2B Data (Users & Receipts with Items)
  const demoUserPassword = hashPassword('123456');
  const demoUser = await prisma.user.upsert({
    where: { username: 'ahmet123' },
    update: {},
    create: {
      username: 'ahmet123',
      email: 'ahmet@gmail.com',
      name: 'Ahmet Yılmaz',
      password: demoUserPassword,
      role: 'USER',
    },
  });

  await prisma.wallet.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: { userId: demoUser.id, balance: 42.50 },
  });

  // Sample Receipt 1: A101 Market
  await prisma.receipt.create({
    data: {
      userId: demoUser.id,
      receiptHash: 'hash_demo_sample_a101',
      imageUrl: 'https://storage.r2.cloudflarestorage.com/fisokut-receipts/demo_a101.jpg',
      merchantName: 'A101 MARKET',
      vkn: '1234567890',
      receiptNo: 'A-00105',
      receiptDate: new Date(),
      totalAmount: 340.00,
      cashbackAmount: 17.00,
      status: 'PROCESSED',
      rawOcrText: 'A101 MARKET\nÜLKER ÇİKOLATA 5 ADET 100 TL\nSÜT 2 ADET 60 TL\nDETAN SINEK ILACI 180 TL\nTOPLAM: 340.00 TL',
      ocrEngineUsed: 'paddleocr',
      items: {
        create: [
          { itemName: 'Ülker Çikolata', quantity: 5, unitPrice: 20.00, totalPrice: 100.00, categoryId: createdCategories['atistirmalik-tatli'] },
          { itemName: 'Sütaş Süt 1L', quantity: 2, unitPrice: 30.00, totalPrice: 60.00, categoryId: createdCategories['gida-sarkuteri'] },
          { itemName: 'Detan Sinek İlacı', quantity: 1, unitPrice: 180.00, totalPrice: 180.00, categoryId: createdCategories['temizlik-hijyen'] },
        ],
      },
    },
  });

  // Sample Receipt 2: Migros
  await prisma.receipt.create({
    data: {
      userId: demoUser.id,
      receiptHash: 'hash_demo_sample_migros',
      imageUrl: 'https://storage.r2.cloudflarestorage.com/fisokut-receipts/demo_migros.jpg',
      merchantName: 'MİGROS TİCARET',
      vkn: '9876543210',
      receiptNo: 'M-00891',
      receiptDate: new Date(),
      totalAmount: 510.00,
      cashbackAmount: 25.50,
      status: 'PROCESSED',
      rawOcrText: 'MİGROS TİCARET\nCOCA COLA 6 ADET 180 TL\nÜLKER ÇİKOLATA 3 ADET 60 TL\nFAIRY BULAŞIK DETERJANI 270 TL\nTOPLAM: 510.00 TL',
      ocrEngineUsed: 'paddleocr',
      items: {
        create: [
          { itemName: 'Coca-Cola 1.5L', quantity: 6, unitPrice: 30.00, totalPrice: 180.00, categoryId: createdCategories['icecek-mesrubat'] },
          { itemName: 'Ülker Çikolata', quantity: 3, unitPrice: 20.00, totalPrice: 60.00, categoryId: createdCategories['atistirmalik-tatli'] },
          { itemName: 'Fairy Bulaşık Deterjanı', quantity: 1, unitPrice: 270.00, totalPrice: 270.00, categoryId: createdCategories['temizlik-hijyen'] },
        ],
      },
    },
  });

  console.log('🎉 Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
