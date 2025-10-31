import { PrismaClient, PaymentMethod, Role } from '@prisma/client';

const prisma = new PrismaClient();

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }

async function ensureCustomers(count = 40) {
  const names = [
    'Juan Pérez','María López','Carlos Sánchez','Ana Martínez','Luis Rodríguez','Laura Gómez','José Hernández','Sofía Díaz','Pedro Ramírez','Martha Torres',
    'Daniel Flores','Elena Ruiz','Héctor Cruz','Patricia Morales','Ricardo Ortiz','Lucía Chávez','Andrés Mendoza','Gabriela Vázquez','Felipe Herrera','Paola Ríos',
    'Manuel Castillo','Diana Silva','Jorge Romero','Claudia Vega','Raúl Navarro','Silvia Soto','Emilio Salinas','Beatriz Pineda','Hugo Lozano','Rocío Campos',
    'Gerardo Valdez','Alejandra Cano','Francisco Lara','Monserrat Pardo','Iván Cabrera','Karen Mena','Óscar Aguilar','Itzel Cano','Sergio Meza','Tania Solís'
  ];
  const existing = await prisma.customer.count();
  if (existing >= count) return;
  const toCreate = names.slice(0, count - existing).map((name, i) => ({ name, phone: `462-555-${String(1000 + i).slice(-4)}` }));
  if (toCreate.length) await prisma.customer.createMany({ data: toCreate, skipDuplicates: true });
}

async function ensureSuppliers() {
  // Mantiene los existentes y agrega algunos más
  const types = await prisma.proteinType.findMany();
  const map = new Map(types.map(t => [t.name, t.id] as const));
  const resId = map.get('res');
  const cerdoId = map.get('cerdo');
  const extra = [
    { name: 'Distribuidora Prime', contact: 'prime@dist.com', phone: '462-123-0001', proteinTypeId: resId },
    { name: 'Carnes Selectas León', contact: 'ventas@cseleon.mx', phone: '477-987-1200', proteinTypeId: cerdoId },
  ].filter(s => s.proteinTypeId);
  for (const s of extra) {
    const found = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (!found) await prisma.supplier.create({ data: s as any });
  }
}

function unitPriceFor(typeName?: string) {
  if (typeName === 'res') return rand(120, 280);
  if (typeName === 'cerdo') return rand(90, 180);
  if (typeName === 'pollo') return rand(70, 130);
  return rand(80, 150);
}

async function generateSales(days = 120) {
  const products = await prisma.product.findMany({ include: { proteinType: true }, take: 200 });
  if (products.length === 0) {
    console.warn('No hay productos para generar ventas. Ejecuta catalog_seed primero.');
    return;
  }
  const customers = await prisma.customer.findMany({ take: 100 });

  const methods: PaymentMethod[] = [
    PaymentMethod.efectivo,
    PaymentMethod.transferencia,
    PaymentMethod.tarjeta,
    PaymentMethod.otro,
  ];

  const now = new Date();
  for (let d = days; d >= 1; d--) {
    const date = new Date(now.getTime() - d * 24 * 3600_000);
    const dow = date.getDay(); // 0 dom - 6 sab
    const salesToday = dow === 0 ? rand(4, 9) : dow >= 5 ? rand(10, 18) : rand(7, 14);

    for (let s = 0; s < salesToday; s++) {
      const hour = rand(9, 19);
      const minute = rand(0, 59);
      const createdAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, rand(0, 59));
      const cust = customers.length ? choice(customers) : undefined;
      const itemsCount = rand(1, 4);
      const chosen: typeof products = [];
      for (let i = 0; i < itemsCount; i++) chosen.push(choice(products));

      let total = 0;
      const itemPayload = chosen.map(p => {
        const qty = Math.round((Math.random() * 2.5 + 0.5) * 100) / 100; // 0.5 - 3.0
        const unitPrice = unitPriceFor(p.proteinType?.name);
        const lineTotal = Math.round((unitPrice * qty) * 100) / 100;
        total += lineTotal;
        return { productId: p.id, quantity: qty, unitPrice, discount: 0, lineTotal };
      });

      await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data: {
            customerId: cust?.id,
            total: Math.round(total * 100) / 100,
            paidAmount: Math.random() < 0.9 ? Math.round(total * 100) / 100 : null,
            paymentMethod: choice(methods),
            notes: null,
            createdAt,
          }
        });
        await tx.saleItem.createMany({ data: itemPayload.map(i => ({ ...i, saleId: sale.id })) });
      });
    }
  }
}

async function main() {
  await ensureCustomers(40);
  await ensureSuppliers();
  await generateSales(120); // ~4 meses
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

