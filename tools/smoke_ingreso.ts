/*
  Smoke test: ingreso de inventario con InventoryController usando Prisma en memoria.
  Ejecuta: pnpm ts-node --transpile-only tools/smoke_ingreso.ts
*/
import { InventoryController } from '../src/inventory/inventory.controller';

type Any = any;
function cuid() { return 'cm' + Math.random().toString(36).slice(2, 10); }

class InMemoryPrisma {
  products: Any[] = [];
  lots: Any[] = [];

  product = {
    findFirst: async (args: Any) => {
      const w = args?.where || {};
      if (w?.id) return this.products.find((p) => p.id === w.id) || null;
      if (w?.sku) return this.products.find((p) => (p.sku || '').toLowerCase() === String(w.sku).toLowerCase()) || null;
      return null;
    },
    update: async (args: Any) => {
      const idx = this.products.findIndex((p) => p.id === args?.where?.id);
      if (idx < 0) throw new Error('product not found');
      const updated = { ...this.products[idx], ...args.data };
      this.products[idx] = updated;
      return updated;
    }
  } as Any;

  inventoryLot = {
    create: async (args: Any) => {
      const lot = { id: cuid(), createdAt: new Date(), updatedAt: new Date(), ...args.data };
      this.lots.push(lot);
      return lot;
    },
    findMany: async (_args: Any = {}) => [...this.lots]
  } as Any;

  async $transaction<T>(fn: (tx: this) => Promise<T>): Promise<T> { return fn(this); }
}

async function main() {
  const prisma = new InMemoryPrisma();
  const inventory = new InventoryController(prisma as Any);

  // Crear productos base (uno decimal, uno entero)
  const pKg = { id: cuid(), name: 'Diezmillo', sku: 'R-001', unit: 'kg', stockQty: 10, stock: 0 };
  const pPz = { id: cuid(), name: 'Costilla', sku: 'P-010', unit: 'pz', stock: 5, stockQty: null };
  prisma.products.push(pKg, pPz);

  // Ingreso por productId (kg)
  await inventory.ingress({ productId: pKg.id, quantity: 1.25 } as Any);
  // Ingreso por SKU (pz), con cantidad decimal → se redondea
  await inventory.ingress({ sku: pPz.sku, quantity: 1.6 } as Any);

  const afterKg = prisma.products.find((p) => p.id === pKg.id)!;
  const afterPz = prisma.products.find((p) => p.id === pPz.id)!;
  const lots = await prisma.inventoryLot.findMany();

  const checks = [
    { label: 'KG incrementa 1.25', ok: Math.abs((afterKg.stockQty || 0) - 11.25) < 1e-9 },
    { label: 'PZ redondea 1.6 → +2', ok: (afterPz.stock || 0) === 7 },
    { label: 'Se crean 2 lotes', ok: (lots.length === 2) }
  ];

  console.log('SMOKE INGRESO SUMMARY');
  for (const c of checks) console.log('-', c.label + ':', c.ok ? 'OK' : 'FAIL');
  if (!checks.every((c) => c.ok)) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

