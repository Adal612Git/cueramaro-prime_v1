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
}
