import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugLetters(s: string, min = 3): string {
  const letters = (s || '').normalize('NFD').replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (letters.length >= min) return letters.slice(0, min);
  return (letters + 'XXX').slice(0, min);
}

async function nextSku(prefix: string): Promise<string> {
  // Busca el siguiente correlativo libre para el prefijo
  let n = 1;
  while (true) {
    const sku = `${prefix}-${String(n).padStart(3, '0')}`;
    const exists = await prisma.product.findFirst({ where: { sku } });
    if (!exists) return sku;
    n++;
    if (n > 9999) throw new Error('Demasiados SKUs generados para el prefijo: ' + prefix);
  }
}

async function main() {
  const products = await prisma.product.findMany({
    where: { OR: [{ sku: null }, { sku: '' }] },
    include: { proteinType: true }
  });
  if (!products.length) {
    console.log('No hay productos sin SKU.');
    return;
  }
  console.log(`Encontrados ${products.length} productos sin SKU. Generando...`);
  for (const p of products) {
    const base = p.proteinType?.name ? slugLetters(p.proteinType.name, 2) : slugLetters(p.name, 3);
    const prefix = base || 'PRD';
    const sku = await nextSku(prefix);
    await prisma.product.update({ where: { id: p.id }, data: { sku } });
    console.log(`SKU asignado: ${p.name} -> ${sku}`);
  }
  console.log('Asignación de SKUs completada.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

