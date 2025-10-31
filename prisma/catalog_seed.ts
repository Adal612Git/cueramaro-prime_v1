import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureProteinTypes() {
  const names = ['res', 'cerdo', 'pollo', 'pescado'] as const;
  const map: Record<string, string> = {};
  for (const name of names) {
    const t = await prisma.proteinType.upsert({ where: { name }, update: {}, create: { name } });
    map[name] = t.id;
  }
  return map;
}

// Catálogo proporcionado por el cliente
const allItems = [
  'Paleta C/H', 'Paleta S/H', 'Costilla Suadero', 'Costilla C/H', 'Diezmillo C/H', 'Diezmillo S/H',
  'Pulpa Bola', 'Pulpa Blanca', 'K-Magra', 'Pulpa Negra', 'Pescuezo C/H', 'Brisket', 'Tuétano',
  'Chamberete S/H', 'Chamberete C/H', 'Pecho S/H', 'Chuleta', 'Sirloin', 'T-Bone', 'Filete', 'Arrachera',
  'Rib-Eye', 'Lengua', 'Tomahawk', 'Pierna S/H', 'Chorizo 80/20', 'Pecho', 'Cabeza Lomo', 'Lomo', 'Caña',
  'Espaldilla S/H', 'Chuleta Ahumada', 'Costilla Baby Back', 'Costilla Corbata', 'Panceta Belly', 'Chamorro C/P', 'Chamorro S/P'
];

// Clasificación tentativa: res vs cerdo (puede ajustarse luego con el cliente)
const cerdoItems = new Set([
  'Chuleta', 'Pierna S/H', 'Chorizo 80/20', 'Cabeza Lomo', 'Lomo', 'Caña', 'Espaldilla S/H', 'Chuleta Ahumada',
  'Costilla Baby Back', 'Costilla Corbata', 'Panceta Belly', 'Chamorro C/P', 'Chamorro S/P'
]);

// Algunas dudosas; por ahora asumimos RES y se corrige si aplica
const assumedRes = new Set(['K-Magra', 'Pescuezo C/H']);

async function upsertSubtype(name: string, typeId: string) {
  // Usa índice único compuesto (name, typeId)
  return prisma.proteinSubType.upsert({
    where: { name_typeId: { name, typeId } },
    update: {},
    create: { name, typeId }
  });
}

async function upsertProduct(name: string, typeId: string, subTypeId: string) {
  // Como Product.name no es único, buscamos por nombre y creamos si no existe
  const existing = await prisma.product.findFirst({ where: { name } });
  if (existing) {
    // Sólo garantizamos vínculo de catálogo; no tocamos precios u otros campos
    return prisma.product.update({ where: { id: existing.id }, data: { proteinTypeId: typeId, proteinSubTypeId: subTypeId } });
  }
  return prisma.product.create({
    data: {
      name,
      price: 0,
      unit: 'kg',
      stock: 0,
      proteinTypeId: typeId,
      proteinSubTypeId: subTypeId
    }
  });
}

async function main() {
  const types = await ensureProteinTypes();
  const resId = types['res'];
  const cerdoId = types['cerdo'];

  let createdSubtypes = 0;
  let createdProducts = 0;
  for (const name of allItems) {
    const typeId = cerdoItems.has(name) ? cerdoId : resId; // por defecto RES si no está en cerdoItems
    const subtype = await upsertSubtype(name, typeId);
    createdSubtypes++;
    const prod = await upsertProduct(name, typeId, subtype.id);
    if (prod) createdProducts++;
  }

  console.log(`Tipos OK: res=${resId} cerdo=${cerdoId}`);
  console.log(`Subtipos procesados: ${createdSubtypes}`);
  console.log(`Productos procesados: ${createdProducts}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

