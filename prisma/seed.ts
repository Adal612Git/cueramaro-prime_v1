import { PrismaClient, Role, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const strategy = process.env.SEED_STRATEGY || 'safe'; // 'safe' (persistente) o 'reset' (destructivo)
  if (strategy === 'reset') {
    await prisma.sale.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.user.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.proteinSubType.deleteMany();
    await prisma.proteinType.deleteMany();
  }

  // Catálogo de proteínas
  const res = await prisma.proteinType.upsert({ where: { name: 'res' }, update: {}, create: { name: 'res' } });
  const cerdo = await prisma.proteinType.upsert({ where: { name: 'cerdo' }, update: {}, create: { name: 'cerdo' } });
  const pollo = await prisma.proteinType.upsert({ where: { name: 'pollo' }, update: {}, create: { name: 'pollo' } });
  const pescado = await prisma.proteinType.upsert({ where: { name: 'pescado' }, update: {}, create: { name: 'pescado' } });

  const subRes = await prisma.proteinSubType.upsert({
    where: { name_typeId: { name: 'general', typeId: res.id } },
    update: {},
    create: { name: 'general', typeId: res.id }
  });
  const subCerdo = await prisma.proteinSubType.upsert({
    where: { name_typeId: { name: 'general', typeId: cerdo.id } },
    update: {},
    create: { name: 'general', typeId: cerdo.id }
  });
  const subPollo = await prisma.proteinSubType.upsert({
    where: { name_typeId: { name: 'general', typeId: pollo.id } },
    update: {},
    create: { name: 'general', typeId: pollo.id }
  });
  const subPescado = await prisma.proteinSubType.upsert({
    where: { name_typeId: { name: 'general', typeId: pescado.id } },
    update: {},
    create: { name: 'general', typeId: pescado.id }
  });

  const supplier1 =
    (await prisma.supplier.findFirst({ where: { name: 'Cárnicos del Bajío' } })) ||
    (await prisma.supplier.create({
      data: { name: 'Cárnicos del Bajío', contact: 'ventas@carnicos.com', phone: '462-000-1111', proteinTypeId: res.id, proteinSubTypeId: subRes.id }
    }));
  const supplier2 =
    (await prisma.supplier.findFirst({ where: { name: 'Frigorífico León' } })) ||
    (await prisma.supplier.create({
      data: { name: 'Frigorífico León', contact: 'contacto@frileon.mx', phone: '477-222-3333', proteinTypeId: cerdo.id, proteinSubTypeId: subCerdo.id }
    }));

  // Productos: upsert por SKU para evitar duplicados y corregir proveedor de cerdo
  const productsData = [
    { name: 'Diezmillo de Res', sku: 'R-001', price: 149.9, unit: 'kg', stockQty: 24, supplierId: supplier1.id, proteinTypeId: res.id, proteinSubTypeId: subRes.id },
    { name: 'Pierna de Cerdo', sku: 'P-010', price: 109.5, unit: 'kg', stockQty: 35, supplierId: supplier2.id, proteinTypeId: cerdo.id, proteinSubTypeId: subCerdo.id },
    { name: 'Pechuga de Pollo', sku: 'PO-200', price: 98.0, unit: 'kg', stockQty: 42, supplierId: supplier2.id, proteinTypeId: pollo.id, proteinSubTypeId: subPollo.id },
    { name: 'Tocino Ahumado', sku: 'A-050', price: 185.0, unit: 'kg', stockQty: 12, supplierId: supplier2.id, proteinTypeId: cerdo.id, proteinSubTypeId: subCerdo.id }
  ];
  for (const p of productsData) {
    await prisma.product.upsert({
      where: { sku: p.sku! },
      update: { name: p.name, price: p.price, unit: p.unit, stockQty: p.stockQty, supplierId: p.supplierId, proteinTypeId: p.proteinTypeId, proteinSubTypeId: p.proteinSubTypeId },
      create: p
    });
  }

  const customersSeed = [
    { name: 'Juan Pérez', phone: '462-555-0101' },
    { name: 'Carnitas Lupita', phone: '462-555-0202' },
    { name: 'Mini Súper La Esquina', phone: '462-555-0303' }
  ];
  for (const c of customersSeed) {
    const exists = await prisma.customer.findFirst({ where: { name: c.name } });
    if (!exists) await prisma.customer.create({ data: c });
  }

  const expensesSeed = [
    { concept: 'Insumos', description: 'Compra de hielo', amount: 320.5, method: PaymentMethod.efectivo, isDeductible: false },
    { concept: 'Servicios', description: 'Servicio de limpieza', amount: 450.0, method: PaymentMethod.transferencia, isDeductible: true }
  ];
  for (const e of expensesSeed) {
    const exists = await prisma.expense.findFirst({ where: { description: e.description } });
    if (!exists) await prisma.expense.create({ data: e });
  }

  const now = new Date();
  const hours = (n: number) => new Date(now.getTime() - n * 3600_000);
  // Ventas demo solo si no hay ventas
  const salesCount = await prisma.sale.count();
  if (salesCount === 0) {
    const prods = await prisma.product.findMany({ take: 2 });
    if (prods.length >= 2) {
      const sale = await prisma.sale.create({
        data: {
          total: 340.0,
          paidAmount: 340.0,
          paymentMethod: PaymentMethod.efectivo,
          createdAt: hours(1)
        }
      });
      await prisma.saleItem.createMany({
        data: [
          { saleId: sale.id, productId: prods[0].id, quantity: 1, unitPrice: prods[0].price, lineTotal: prods[0].price, discount: 0 },
          { saleId: sale.id, productId: prods[1].id, quantity: 2, unitPrice: prods[1].price, lineTotal: prods[1].price * 2, discount: 0 }
        ]
      });
    }
    await prisma.sale.createMany({
      data: [
        { total: 580.5, createdAt: hours(3) },
        { total: 199.9, createdAt: hours(6) },
        { total: 720.2, createdAt: hours(9) },
        { total: 128.7, createdAt: hours(12) }
      ]
    });
  }

  // Usuarios por defecto
  const adminPass = await bcrypt.hash('admin123', 10);
  const cashierPass = await bcrypt.hash('caja123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@pos.local' },
    update: { passwordHash: adminPass, isActive: true, name: 'Admin', role: Role.ADMIN },
    create: { name: 'Admin', email: 'admin@pos.local', passwordHash: adminPass, role: Role.ADMIN }
  });
  await prisma.user.upsert({
    where: { email: 'caja@pos.local' },
    update: { passwordHash: cashierPass, isActive: true, name: 'Cajero', role: Role.MOSTRADOR },
    create: { name: 'Cajero', email: 'caja@pos.local', passwordHash: cashierPass, role: Role.MOSTRADOR }
  });
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
