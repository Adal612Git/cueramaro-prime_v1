/*
  Smoke test sin BD real: valida flujos lógicos con un Prisma en memoria.
  Ejecuta:
    pnpm tsx tools/smoke_flow.ts
*/
import { ProductsController } from '../src/products/products.controller';
import { SuppliersController } from '../src/suppliers/suppliers.controller';
import { CustomersController } from '../src/customers/customers.controller';
import { SalesController } from '../src/sales/sales.controller';

type Any = any;

function cuid() {
  return 'cm' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

class InMemoryPrisma {
  private products: Any[] = [];
  private suppliers: Any[] = [];
  private customers: Any[] = [];
  private sales: Any[] = [];
  private payments: Any[] = [];

  // ——— product ———
  product = {
    findMany: async (args: Any = {}) => {
      let items = [...this.products];
      const w = args?.where || {};
      if (w.id?.in && Array.isArray(w.id.in)) {
        const set = new Set(w.id.in);
        items = items.filter((p) => set.has(p.id));
      }
      return items;
    },
    findUnique: async (args: Any) => {
      return this.products.find((p) => p.id === args?.where?.id) || null;
    },
    create: async (args: Any) => {
      const name = (args?.data?.name || '').trim();
      const dup = this.products.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (dup) {
        const err: Any = new Error('duplicate');
        err.code = 'P2002';
        throw err;
      }
      const p = {
        id: cuid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        stock: 0,
        stockQty: null,
        ...args.data
      };
      this.products.push(p);
      return p;
    },
    update: async (args: Any) => {
      const idx = this.products.findIndex((p) => p.id === args?.where?.id);
      if (idx < 0) throw new Error('product not found');
      const updated = { ...this.products[idx], ...args.data, updatedAt: new Date() };
      this.products[idx] = updated;
      return updated;
    }
  } as Any;

  // ——— supplier ———
  supplier = {
    findMany: async (args: Any = {}) => {
      return [...this.suppliers];
    },
    findUnique: async (args: Any) => {
      return this.suppliers.find((s) => s.id === args?.where?.id) || null;
    },
    create: async (args: Any) => {
      const s = { id: cuid(), createdAt: new Date(), updatedAt: new Date(), isActive: true, ...args.data };
      this.suppliers.push(s);
      return s;
    },
    update: async (args: Any) => {
      const idx = this.suppliers.findIndex((s) => s.id === args?.where?.id);
      if (idx < 0) throw new Error('supplier not found');
      const updated = { ...this.suppliers[idx], ...args.data, updatedAt: new Date() };
      this.suppliers[idx] = updated;
      return updated;
    },
    delete: async (args: Any) => {
      const idx = this.suppliers.findIndex((s) => s.id === args?.where?.id);
      if (idx >= 0) this.suppliers.splice(idx, 1);
      return { ok: true };
    }
  } as Any;

  // ——— customer ———
  customer = {
    findMany: async (args: Any = {}) => {
      return [...this.customers];
    },
    findUnique: async (args: Any) => {
      return this.customers.find((c) => c.id === args?.where?.id) || null;
    },
    create: async (args: Any) => {
      const c = { id: cuid(), createdAt: new Date(), updatedAt: new Date(), isActive: true, ...args.data };
      this.customers.push(c);
      return c;
    },
    update: async (args: Any) => {
      const idx = this.customers.findIndex((c) => c.id === args?.where?.id);
      if (idx < 0) throw new Error('customer not found');
      const updated = { ...this.customers[idx], ...args.data, updatedAt: new Date() };
      this.customers[idx] = updated;
      return updated;
    },
    delete: async (args: Any) => {
      const idx = this.customers.findIndex((c) => c.id === args?.where?.id);
      if (idx >= 0) this.customers.splice(idx, 1);
      return { ok: true };
    }
  } as Any;

  // ——— sale / payment ———
  sale = {
    findMany: async (args: Any = {}) => {
      let items = [...this.sales];
      if (args?.where?.customerId) items = items.filter((s) => s.customerId === args.where.customerId);
      if (args?.select) {
        return items.map((s) => {
          const o: Any = {};
          for (const k of Object.keys(args.select)) if (args.select[k]) o[k] = (s as Any)[k];
          return o;
        });
      }
      return items;
    },
    findUnique: async (args: Any) => {
      const s = this.sales.find((x) => x.id === args?.where?.id) || null;
      if (!s) return null;
      if (args?.select) {
        const o: Any = {};
        for (const k of Object.keys(args.select)) if (args.select[k]) o[k] = (s as Any)[k];
        return o;
      }
      return s;
    },
    create: async (args: Any) => {
      const id = cuid();
      const createdAt = new Date();
      const items = (args.data.items?.create || []).map((i: Any) => ({ id: cuid(), saleId: id, ...i }));
      const sale = {
        id,
        createdAt,
        customerId: args.data.customerId || null,
        total: args.data.total,
        paidAmount: args.data.paidAmount ?? 0,
        paymentMethod: args.data.paymentMethod,
        notes: args.data.notes || null,
        creditDueDate: args.data.creditDueDate || null,
        items
      };
      this.sales.unshift(sale);
      if (args?.include?.items?.include?.product) {
        const itemsWithProduct = sale.items.map((it: Any) => ({ ...it, product: this.products.find((p) => p.id === it.productId) }));
        const customer = args?.include?.customer ? this.customers.find((c) => c.id === sale.customerId) || null : undefined;
        return { ...sale, items: itemsWithProduct, customer };
      }
      return sale;
    },
    update: async (args: Any) => {
      const idx = this.sales.findIndex((s) => s.id === args?.where?.id);
      if (idx < 0) throw new Error('sale not found');
      const current = this.sales[idx];
      const data: Any = { ...args.data };
      if (data.paidAmount && typeof data.paidAmount === 'object' && 'increment' in data.paidAmount) {
        const inc = Number(data.paidAmount.increment || 0);
        data.paidAmount = Number(current.paidAmount || 0) + inc;
      }
      const updated = { ...current, ...data };
      this.sales[idx] = updated;
      return updated;
    }
  } as Any;

  payment = {
    create: async (args: Any) => {
      const p = { id: cuid(), createdAt: new Date(), ...args.data };
      this.payments.push(p);
      return p;
    }
  } as Any;

  async $transaction<T>(fn: (tx: this) => Promise<T>): Promise<T> {
    // No hay aislamiento real; suficiente para pruebas lógicas.
    return fn(this);
  }

  async $executeRawUnsafe(_sql: string) {
    return 1;
  }
}

class InvoiceStub { async generateFromTemplate(): Promise<string | null> { return null; } }

async function main() {
  const prisma = new InMemoryPrisma();
  const suppliers = new SuppliersController(prisma as Any);
  const products = new ProductsController(prisma as Any);
  const customers = new CustomersController(prisma as Any);
  const sales = new SalesController(prisma as Any, new InvoiceStub() as Any);

  const out: Any = { steps: [] };

  // 1) Alta proveedor
  const sup = await suppliers.create({ name: 'Proveedor A', contact: 'Juan' } as Any);
  out.steps.push({ supplier: sup });

  // 2) Alta productos
  const p1 = await products.create({ name: 'Diezmillo', supplierId: sup.id, price: 100, unit: 'kg', stockQty: 10 } as Any);
  const p2 = await products.create({ name: 'Costilla', supplierId: sup.id, price: 200, unit: 'pz', stock: 5 } as Any);
  out.steps.push({ products: [p1, p2] });

  // 3) Alta clientes
  const c1 = await customers.create({ name: 'Cliente Contado' } as Any);
  const c2 = await customers.create({ name: 'Cliente Crédito', creditDays: 7 } as Any); // fuerza tipo crédito
  out.steps.push({ customers: [c1, c2] });

  // 4) Venta contado (1.5 kg Diezmillo)
  const s1 = await sales.create({
    paymentMethod: 'efectivo',
    items: [{ productId: p1.id, quantity: 1.5, unitPrice: 100 }]
  } as Any, { user: { name: 'Cajero' } } as Any);
  out.steps.push({ sale_cash: { id: s1.id, total: s1.total, paidAmount: s1.paidAmount } });
  const p1After = await (prisma as Any).product.findUnique({ where: { id: p1.id } });
  out.steps.push({ stock_after_cash: { diezmillo: p1After.stockQty } });

  // 5) Venta a crédito al cliente 2 (2 pzas Costilla)
  const s2 = await sales.create({
    customerId: c2.id,
    paymentMethod: 'credito',
    creditDueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    items: [{ productId: p2.id, quantity: 2, unitPrice: 200 }]
  } as Any, { user: { name: 'Cajero' } } as Any);
  out.steps.push({ sale_credit: { id: s2.id, total: s2.total, paidAmount: s2.paidAmount } });
  const p2After = await (prisma as Any).product.findUnique({ where: { id: p2.id } });
  out.steps.push({ stock_after_credit: { costilla: p2After.stock } });

  // 6) Abono a la venta a crédito
  const pay = await sales.addPayment(s2.id, { amount: 150 } as Any);
  out.steps.push({ payment: { amount: 150 }, sale_after_payment: { paidAmount: pay.sale.paidAmount } });

  // 7) Cartera del cliente 2
  const recv = await customers.receivables(c2.id);
  out.steps.push({ receivables: { totalDue: recv.totalDue, items: recv.items.length } });

  // Reglas lógicas esperadas
  const checks = [
    { label: 'Stock Diezmillo = 8.5', ok: Math.abs((p1After.stockQty || 0) - 8.5) < 1e-9 },
    { label: 'Stock Costilla = 3', ok: (p2After.stock || 0) === 3 },
    { label: 'Venta contado pagada', ok: Math.abs((s1.paidAmount || 0) - (s1.total || 0)) < 1e-9 },
    { label: 'Venta crédito inicia con 0 pagado', ok: (s2.paidAmount || 0) === 0 },
    { label: 'Abono reduce saldo', ok: recv.totalDue > 0 && pay.sale.paidAmount > 0 && pay.sale.paidAmount === 150 }
  ];
  out.checks = checks;

  // Resumen compacto
  console.log('SMOKE SUMMARY');
  for (const c of checks) console.log('-', c.label + ':', c.ok ? 'OK' : 'FAIL');
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error('Smoke test failed:', e);
  process.exit(1);
});
