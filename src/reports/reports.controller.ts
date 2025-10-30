import { Controller, Get } from '@nestjs/common';

type DashboardResponse = {
  totals: {
    sales: number;
    expenses: number;
    margin: number;
    products: number;
    customers: number;
  };
  recentSales: Array<{ id: string; total: number; createdAt: string }>;
};

@Controller('reports')
export class ReportsController {
  @Get('dashboard')
  getDashboard(): DashboardResponse {
    // Datos simulados para entorno sin DB/Electric (sin Docker)
    const recentSales = Array.from({ length: 5 }).map((_, i) => ({
      id: `sale-${i + 1}`,
      total: 100 + i * 23,
      createdAt: new Date(Date.now() - i * 3600_000).toISOString()
    }));

    return {
      totals: {
        sales: recentSales.reduce((acc, s) => acc + s.total, 0),
        expenses: 320.5,
        margin: 0.24,
        products: 156,
        customers: 89
      },
      recentSales
    };
  }
}

