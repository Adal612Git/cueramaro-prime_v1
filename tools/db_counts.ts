import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [products, suppliers, types, subtypes, sales, saleItems, payments, expenses, lots, customers] = await Promise.all([
    prisma.product.count(),
    prisma.supplier.count(),
    prisma.proteinType.count(),
    prisma.proteinSubType.count(),
    prisma.sale.count(),
    prisma.saleItem.count(),
    prisma.payment.count().catch(() => 0),
    prisma.expense.count(),
    prisma.inventoryLot.count(),
    prisma.customer.count()
  ]);

  const one = await prisma.product.findFirst({ select: { id: true, name: true, sku: true, stock: true, stockQty: true } });
  const productsNoSku = (await prisma.product.findMany({ select: { id: true, sku: true } })).filter((p) => !((p.sku || '').trim())).length;

  console.log(JSON.stringify({
    products, suppliers, types, subtypes,
    sales, saleItems, payments, expenses, lots, customers,
    sampleProduct: one,
    productsNoSku
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
