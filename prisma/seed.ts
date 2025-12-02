import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Criar usuário de exemplo
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Example User',
      email: 'user@example.com',
      password: hashedPassword,
    },
  });

  // Criar algumas URLs de exemplo
  await prisma.url.upsert({
    where: { shortCode: 'abc123' },
    update: {},
    create: {
      originalUrl: 'https://www.google.com',
      shortCode: 'abc123',
      userId: user.id,
      accessCount: 5,
    },
  });

  await prisma.url.upsert({
    where: { shortCode: 'def456' },
    update: {},
    create: {
      originalUrl: 'https://www.github.com',
      shortCode: 'def456',
      alias: 'github',
      userId: user.id,
      accessCount: 10,
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });