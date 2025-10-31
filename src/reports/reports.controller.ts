import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DashboardResponse = {
  totals: {
    sales: number; // ventas del día o rango
    expenses: number;
    margin: number; // demo: margen simple derivado
    products: number;
    customers: number;
    accountsReceivable: number; // cuentas por cobrar global
  };
  recentSales: Array<{ id: string; total: number; createdAt: string }>;
};

@Controller('reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get('dashboard')
  async getDashboard(
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<DashboardResponse> {
    // Si no se especifica rango, usar el día de hoy
    const defaultFrom = new Date();
    defaultFrom.setHours(0, 0, 0, 0);
    const defaultTo = new Date();

    const rangeFilter = (() => {
      const range: any = {};
      const start = from ? new Date(from) : defaultFrom;
      const end = to ? new Date(to) : defaultTo;
      range.gte = start;
      range.lte = end;
      return { createdAt: range } as const;
    })();

    const [sales, expenses, products, customers, receivableSales] = await Promise.all([
      this.prisma.sale.findMany({
        where: rangeFilter,
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      this.prisma.expense.findMany({ where: rangeFilter }),
      this.prisma.product.count(),
      this.prisma.customer.count(),
      // ventas con saldo pendiente para cuentas por cobrar (globales)
      this.prisma.sale.findMany({ select: { total: true, paidAmount: true, paymentMethod: true } })
    ]);

    const recentSales = sales.map((s) => ({ id: s.id, total: s.total, createdAt: s.createdAt.toISOString() }));
    const salesTotal = sales.reduce((acc, s) => acc + s.total, 0);
    const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0);
    const margin = salesTotal > 0 ? Math.max(0, (salesTotal - expensesTotal) / salesTotal) : 0;
    const accountsReceivable = receivableSales
      .filter((s) => (s as any).paymentMethod === 'credito' || (s.paidAmount ?? 0) < (s.total ?? 0))
      .reduce((acc, s) => acc + Math.max(0, (s.total || 0) - (s.paidAmount || 0)), 0);

    return {
      totals: {
        sales: salesTotal,
        expenses: expensesTotal,
        margin,
        products,
        customers,
        accountsReceivable
      },
      recentSales
    };
  }

  @Get('receivables')
  async getReceivables(
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<{ total: number; byCustomer: Array<{ customerId: string | null; customerName: string; due: number; nextDueDate: string | null }> }> {
    // Rango opcional para considerar sólo ventas del periodo
    const range: any = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(to);
    const whereRange = Object.keys(range).length ? { createdAt: range } : {};

    const sales = await this.prisma.sale.findMany({
      where: whereRange,
      select: {
        total: true,
        paidAmount: true,
        paymentMethod: true,
        creditDueDate: true,
        customerId: true,
        customer: { select: { id: true, name: true } }
      }
    });

    const byCustomerMap = new Map<string, { customerId: string | null; customerName: string; due: number; nextDueDate: Date | null }>();
    let total = 0;
    for (const s of sales) {
      const due = Math.max(0, (s.total || 0) - (s.paidAmount || 0));
      if (due <= 0 && s.paymentMethod !== 'credito') continue;
      const key = s.customerId || 'MOSTRADOR';
      const name = s.customer?.name || 'Mostrador';
      const existing = byCustomerMap.get(key);
      const nextDue = s.creditDueDate ? new Date(s.creditDueDate) : null;
      if (existing) {
        existing.due += due;
        if (existing.nextDueDate === null) existing.nextDueDate = nextDue;
        else if (nextDue && existing.nextDueDate && nextDue < existing.nextDueDate) existing.nextDueDate = nextDue;
      } else {
        byCustomerMap.set(key, { customerId: s.customerId ?? null, customerName: name, due, nextDueDate: nextDue });
      }
      total += due;
    }

    const byCustomer = Array.from(byCustomerMap.values())
      .filter((c) => c.due > 0)
      .sort((a, b) => (b.due - a.due));

    return { total, byCustomer: byCustomer.map((c) => ({ ...c, nextDueDate: c.nextDueDate ? c.nextDueDate.toISOString() : null })) };
  }

  @Get('near-expiry')
  async getNearExpiry(
    @Query('days') days?: string,
    @Query('staleDays') staleDays?: string
  ): Promise<{ count: number; items: Array<{ id: string; productId: string; productName: string; sku: string | null; quantity: number; arrivalDate: string; expirationDate: string | null; daysToExpire: number | null }> }> {
    const horizon = Number.isFinite(Number(days)) ? Math.max(0, parseInt(days!)) : 7;
    const stale = Number.isFinite(Number(staleDays)) ? Math.max(0, parseInt(staleDays!)) : 10;
    const now = new Date();
    const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 24 * 3600_000);
    const subDays = (d: Date, n: number) => new Date(d.getTime() - n * 24 * 3600_000);

    const lots = await this.prisma.inventoryLot.findMany({
      where: {
        quantity: { gt: 0 },
        OR: [
          { expirationDate: { lte: addDays(now, horizon) } },
          { AND: [{ expirationDate: null }, { arrivalDate: { lte: subDays(now, stale) } }] }
        ]
      },
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: [
        { expirationDate: 'asc' },
        { arrivalDate: 'asc' }
      ]
    });

    const items = lots.map((l) => {
      const dte = l.expirationDate ? Math.ceil((l.expirationDate.getTime() - now.getTime()) / (24 * 3600_000)) : null;
      return {
        id: l.id,
        productId: l.productId,
        productName: l.product.name,
        sku: l.product.sku ?? null,
        quantity: l.quantity,
        arrivalDate: l.arrivalDate.toISOString(),
        expirationDate: l.expirationDate ? l.expirationDate.toISOString() : null,
        daysToExpire: dte
      };
    });

    return { count: items.length, items };
  }
}
