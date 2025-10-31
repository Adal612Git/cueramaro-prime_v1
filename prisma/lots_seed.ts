import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  const prods = await prisma.product.findMany({ take: 50 });
  if (prods.length === 0) {
    console.log('Sin productos; ejecuta catalog_seed primero.');
    return;
  }
  const now = new Date();
  let created = 0;
  for (const p of prods.slice(0, 25)) {
    const arrival = new Date(now.getTime() - rand(3, 30) * 24 * 3600_000);
    const expShift = rand(-2, 14); // caducados recientes o en próximas dos semanas
    const expiration = Math.random() < 0.85 ? new Date(now.getTime() + expShift * 24 * 3600_000) : null; // a veces sin fecha
    await prisma.inventoryLot.create({
      data: {
        productId: p.id,
        sku: p.sku ?? null,
        barcode: null,
        quantity: Math.round((Math.random() * 15 + 2) * 100) / 100,
        arrivalDate: arrival,
        expirationDate: expiration,
        cost: p.purchasePrice ?? null,
        lotCode: `LOT-${rand(1000,9999)}`
      }
    });
    created++;
  }
  console.log(`Lotes creados: ${created}`);
}

main().finally(async () => { await prisma.$disconnect(); });

