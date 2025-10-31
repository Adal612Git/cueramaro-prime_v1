import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function pad(n: number, len = 6) {
  return String(n).padStart(len, '0');
}

async function fillCustomerCodes() {
  // Asigna códigos autoincrementales a clientes sin code
  await prisma.$executeRawUnsafe(`
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
      FROM "Customer"
      WHERE "code" IS NULL
    ),
    mx AS (SELECT COALESCE(MAX("code"), 0) AS m FROM "Customer")
    UPDATE "Customer" c
    SET "code" = (SELECT m.m + n.rn FROM numbered n CROSS JOIN mx m WHERE n.id = c.id)
    WHERE c."code" IS NULL;
  `);
}

async function fillCustomers() {
  const customers = await prisma.customer.findMany();
  for (const c of customers) {
    const patch: any = {};
    const codeStr = c.code != null ? `C-${pad(c.code)}` : c.id.slice(-8);
    if (!c.phone) patch.phone = '462-000-0000';
    if (!c.whatsapp) patch.whatsapp = patch.phone || c.phone || '462-000-0000';
    if (!c.email) patch.email = `cliente+${codeStr.toLowerCase()}@pos.local`;
    if (!c.personalAddress) patch.personalAddress = 'N/D';
    if (!c.businessAddress) patch.businessAddress = 'N/D';
    if (!(c as any).personalPostalCode) patch.personalPostalCode = '00000' as any;
    if (!(c as any).businessPostalCode) patch.businessPostalCode = '00000' as any;
    // Congruencia de crédito
    const days = c.creditDays ?? 0;
    if (days > 0 && c.customerType !== 'credito') patch.customerType = 'credito' as any;
    if (days <= 0 && !c.customerType) patch.customerType = 'contado' as any;
    if (c.customerType === 'credito' && (c.creditDays == null || c.creditDays <= 0)) patch.creditDays = 30;
    if (c.creditLimit == null) patch.creditLimit = 0;
    if (Object.keys(patch).length) {
      await prisma.customer.update({ where: { id: c.id }, data: patch });
    }
  }
}

async function fillSuppliers() {
  const suppliers = await prisma.supplier.findMany();
  for (const s of suppliers) {
    const patch: any = {};
    if (!s.clientName) patch.clientName = `Cliente ${s.name || s.id.slice(-6)}`;
    if (!s.contact) patch.contact = 'N/D';
    if (!s.phone) patch.phone = '462-000-0000';
    if (!s.email) patch.email = `proveedor+${s.id.slice(-6)}@pos.local`;
    if (!s.company) patch.company = 'N/D';
    if (!s.address) patch.address = 'N/D';
    if (!s.city) patch.city = 'N/D';
    if (!s.state) patch.state = 'N/D';
    if (Object.keys(patch).length) {
      await prisma.supplier.update({ where: { id: s.id }, data: patch });
    }
  }
}

async function fillProducts() {
  const products = await prisma.product.findMany();
  for (const p of products) {
    const patch: any = {};
    if (!p.unit) patch.unit = 'kg';
    if (!p.sku) patch.sku = `SKU-${p.id.slice(-6).toUpperCase()}`;
    if (!p.description) patch.description = 'N/D';
    if (!p.brand) patch.brand = 'N/D';
    if (!p.distributor) patch.distributor = 'N/D';
    if (Object.keys(patch).length) {
      try {
        await prisma.product.update({ where: { id: p.id }, data: patch });
      } catch {
        // sku unique: si colisiona, ignora
        delete patch.sku;
        if (Object.keys(patch).length) await prisma.product.update({ where: { id: p.id }, data: patch });
      }
    }
  }
}

function shelfDaysByType(type?: string | null): number {
  const t = (type || '').toLowerCase();
  if (t.includes('pescado')) return 5;
  if (t.includes('pollo')) return 7;
  if (t.includes('cerdo')) return 10;
  if (t.includes('res')) return 12;
  return 12;
}

async function fillInventoryLots() {
  const lots = await prisma.inventoryLot.findMany({ include: { product: { include: { proteinType: true } } } });
  for (const lot of lots) {
    const patch: any = {};
    // arrivalDate es NOT NULL por schema; sólo completar expiración
    if (!lot.expirationDate) {
      const base = lot.arrivalDate ?? new Date();
      const days = shelfDaysByType(lot.product?.proteinType?.name);
      const exp = new Date(base.getTime() + days * 24 * 3600_000);
      patch.expirationDate = exp;
    }
    if (Object.keys(patch).length) {
      await prisma.inventoryLot.update({ where: { id: lot.id }, data: patch });
    }
  }
}

async function fillSalesCreditDueDate() {
  const sales = await prisma.sale.findMany({ where: { paymentMethod: 'credito', creditDueDate: null }, include: { customer: true } });
  for (const s of sales) {
    const base = s.createdAt ?? new Date();
    const days = s.customer?.creditDays ?? 30;
    const due = new Date(base.getTime() + days * 24 * 3600_000);
    await prisma.sale.update({ where: { id: s.id }, data: { creditDueDate: due } });
  }
}

async function main() {
  await fillCustomerCodes();
  await fillCustomers();
  await fillSuppliers();
  await fillProducts();
  await fillInventoryLots();
  await fillSalesCreditDueDate();
  console.log('Limpieza y relleno de datos completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
