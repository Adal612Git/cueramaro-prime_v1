import { PrismaClient } from '@prisma/client';

/*
  Asigna SKU únicos a productos sin SKU.
  Formato: SKU-<SLUG_NOMBRE>-<ID6>
  - SLUG: nombre sin acentos, sólo A-Z0-9-, max 12 chars
  - ID6: últimos 6 chars del ID, en mayúsculas

  Uso:
    pnpm ts-node prisma/fill_skus.ts
*/

const prisma = new PrismaClient();

function slugify(name: string): string {
  const base = (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const alnum = base.toUpperCase().replace(/[^A-Z0-9]+/g, '-');
  const cleaned = alnum.replace(/^-+|-+$/g, '').replace(/-+/g, '-');
  return cleaned.slice(0, 12) || 'PROD';
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true, sku: true } });
  let updated = 0;
  for (const p of products) {
    const current = (p.sku || '').trim();
    if (current) continue;
    const slug = slugify(p.name);
    const id6 = p.id.slice(-6).toUpperCase();
    const sku = `SKU-${slug}-${id6}`;
    try {
      await prisma.product.update({ where: { id: p.id }, data: { sku } });
      updated++;
    } catch (e) {
      // En caso extremo de colisión, añadir sufijo aleatorio corto
      const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
      const fallback = `${sku}-${rnd}`;
      await prisma.product.update({ where: { id: p.id }, data: { sku: fallback } });
      updated++;
    }
  }
  console.log(`✓ SKUs asignados/actualizados: ${updated}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

