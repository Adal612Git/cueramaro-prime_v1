import { PrismaClient } from '@prisma/client';

/*
  Limpia la base para replicar comportamiento del usuario desde cero.
  Conserva: ProteinType, ProteinSubType, Supplier, Product (con existencias en 0).
  Elimina: InventoryLot, SaleItem, Payment, Sale, Expense, Customer.

  Uso:
    pnpm ts-node prisma/wipe_to_basics.ts
*/

const prisma = new PrismaClient();

async function main() {
  console.log('→ Iniciando limpieza (mantener catálogos y productos)');

  // 1) Eliminar dependencias de venta y gastos
  console.log('  - Eliminando SaleItem...');
  await prisma.saleItem.deleteMany();
  console.log('  - Eliminando Payment...');
  await prisma.payment.deleteMany();
  console.log('  - Eliminando Sale...');
  await prisma.sale.deleteMany();
  console.log('  - Eliminando Expense...');
  await prisma.expense.deleteMany();

  // 2) Eliminar lotes de inventario (no afectan productos; relación es CASCADE en lotes)
  console.log('  - Eliminando InventoryLot...');
  await prisma.inventoryLot.deleteMany();

  // 3) Eliminar clientes
  console.log('  - Eliminando Customer...');
  await prisma.customer.deleteMany();

  // 4) Reestablecer existencias de productos
  console.log('  - Reseteando existencias de Product a 0/0...');
  await prisma.$executeRawUnsafe('UPDATE "Product" SET "stock" = 0, "stockQty" = 0');

  console.log('✓ Limpieza completa. Se conservaron ProteinType, ProteinSubType, Supplier y Product');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

