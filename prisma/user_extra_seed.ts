import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUser(name: string, email: string, password: string, role: Role) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash: hash, role, isActive: true },
    create: { name, email, passwordHash: hash, role, isActive: true }
  });
}

async function main() {
  // Mantiene los de prueba y añade usuarios adicionales solicitados
  await upsertUser('Dueño 2', 'admin2@pos.local', 'admin123', Role.ADMIN);
  await upsertUser('Cajero 1', 'caja1@pos.local', 'caja123', Role.MOSTRADOR);
  await upsertUser('Cajero 2', 'caja2@pos.local', 'caja123', Role.MOSTRADOR);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

