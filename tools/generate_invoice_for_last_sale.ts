import { PrismaClient } from '@prisma/client';
import { InvoiceService } from '../src/invoice/invoice.service';

async function main() {
  const prisma = new PrismaClient();
  const invoice = new InvoiceService();
  const sale = await prisma.sale.findFirst({ orderBy: { createdAt: 'desc' }, include: { items: { include: { product: true } }, customer: true } });
  if (!sale) {
    console.error('No hay ventas');
    process.exit(1);
  }
  const out = await invoice.generateFromTemplate(sale as any, 'Admin');
  console.log('Generada:', out);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

