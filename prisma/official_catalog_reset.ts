import { PrismaClient } from '@prisma/client';

// Script destructivo: limpia productos y subtipos y carga el catálogo oficial
// Mantiene intactos los ProteinType existentes (res, cerdo, pollo, pescado)

const prisma = new PrismaClient();

type Item = { name: string; price: number; type: 'res' | 'cerdo'; unit?: string };

// Catálogo oficial proporcionado (unidad por kg)
const items: Item[] = [
  // RES
  { name: 'Paleta', price: 165, type: 'res' },
  { name: 'Costilla', price: 190, type: 'res' },
  { name: 'Diezmillo (S/H)', price: 185, type: 'res' },
  { name: 'Diezmillo (C/H)', price: 170, type: 'res' },
  { name: 'Suadero (C/H)', price: 175, type: 'res' },
  { name: 'Pulpa', price: 180, type: 'res' },
  { name: 'Pescuezo', price: 150, type: 'res' },
  { name: 'Brisket', price: 230, type: 'res' },
  { name: 'Negra (C/H)', price: 200, type: 'res' },
  { name: 'Pulpa K-Magro', price: 195, type: 'res' },
  { name: 'Bola Blanca', price: 170, type: 'res' },
  { name: 'Varias', price: 160, type: 'res' },
  { name: 'Pecho', price: 210, type: 'res' },
  { name: 'Sirloin (S/H)', price: 220, type: 'res' },
  { name: 'Tuétano', price: 140, type: 'res' },
  { name: 'Chamberete (C/H)', price: 165, type: 'res' },
  { name: 'Chamberete (S/H)', price: 185, type: 'res' },
  { name: 'Filete', price: 250, type: 'res' },
  { name: 'Rib-Eye', price: 280, type: 'res' },
  { name: 'Tomahawk', price: 300, type: 'res' },
  { name: 'T-Bone', price: 260, type: 'res' },
  { name: 'Arrachera', price: 230, type: 'res' },
  { name: 'Lengua', price: 160, type: 'res' },
  { name: 'Cabeza', price: 140, type: 'res' },
  { name: 'Pecho', price: 200, type: 'res' }, // segundo precio de Pecho
  { name: 'Lomo 80/20', price: 190, type: 'res' },

  // CERDO
  { name: 'Chorizo', price: 110, type: 'cerdo' },
  { name: 'Espaldilla', price: 175, type: 'cerdo' },
  { name: 'Pierna', price: 155, type: 'cerdo' },
  { name: 'Lomo (S/H)', price: 210, type: 'cerdo' },
  { name: 'Caña (S/H)', price: 170, type: 'cerdo' },
  { name: 'Costilla', price: 220, type: 'cerdo' },
  { name: 'Panceta', price: 165, type: 'cerdo' },
  { name: 'Chamorro', price: 145, type: 'cerdo' },
  { name: 'Chuleta', price: 175, type: 'cerdo' },
  { name: 'Chuleta', price: 175, type: 'cerdo' }, // repetido en lista oficial
  { name: 'Costilla Baby Back', price: 230, type: 'cerdo' },
  { name: 'Belly Ahumada', price: 195, type: 'cerdo' },
  { name: 'Corbata (C/P)', price: 150, type: 'cerdo' },
  { name: 'Corbata (S/P)', price: 170, type: 'cerdo' }
];

async function ensureProteinTypes() {
  const types = ['res', 'cerdo', 'pollo', 'pescado'] as const;
  const map: Record<typeof types[number], string> = {
    res: '', cerdo: '', pollo: '', pescado: ''
  };
  for (const name of types) {
    const t = await prisma.proteinType.upsert({ where: { name }, update: {}, create: { name } });
    map[name] = t.id;
  }
  return map;
}

async function main() {
  const types = await ensureProteinTypes();

  // 1) Borrar dependencias para poder limpiar productos
  //    - SaleItem depende de Product SIN cascade, así que primero borramos items de venta
  //    - InventoryLot tiene cascade en product, pero borramos por claridad
  console.log('Eliminando SaleItems...');
  await prisma.saleItem.deleteMany();
  console.log('Eliminando InventoryLots...');
  await prisma.inventoryLot.deleteMany();

  // 2) Limpiar productos y subtipos
  console.log('Eliminando Products...');
  await prisma.product.deleteMany();
  console.log('Eliminando ProteinSubTypes...');
  await prisma.proteinSubType.deleteMany();

  // 3) Insertar subtipos (uno por nombre único por tipo) y productos
  //    Permitimos productos duplicados por nombre (p. ej. Chuleta aparece dos veces)
  const subtypeCache = new Map<string, string>(); // key = `${typeId}::${name}` -> subtypeId
  let createdSubtypes = 0;
  let createdProducts = 0;

  for (const it of items) {
    const typeId = types[it.type];
    const key = `${typeId}::${it.name}`;
    let subId = subtypeCache.get(key);
    if (!subId) {
      const st = await prisma.proteinSubType.create({ data: { name: it.name, typeId } });
      subId = st.id;
      subtypeCache.set(key, subId);
      createdSubtypes++;
    }

    await prisma.product.create({
      data: {
        name: it.name,
        price: it.price,
        unit: it.unit ?? 'kg',
        stock: 0,
        stockQty: 0,
        proteinTypeId: typeId,
        proteinSubTypeId: subId
      }
    });
    createdProducts++;
  }

  console.log(`Subtipos creados: ${createdSubtypes}`);
  console.log(`Productos creados: ${createdProducts}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

