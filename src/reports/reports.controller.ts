import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
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

  @Get('export/excel')
  async exportExcel(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response
  ) {
    const where: any = {};
    const range: any = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(to);
    if (Object.keys(range).length) where.createdAt = range;
    const sales = await this.prisma.sale.findMany({ where, orderBy: { createdAt: 'asc' } });

    // Intentar Excel con logo usando exceljs; si falla, caer en XLSX simple
    try {
      // Cargar exceljs en tiempo de ejecución si está instalado
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ExcelJS: any = require('exceljs');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('VENTAS');

      // Insertar logo si existe
      const logoCandidates = [
        path.resolve(process.cwd(), 'logo', 'CUERAMARO-CARNES-LOGO-COMPLETO-sin-fondo.png'),
        path.resolve(process.cwd(), 'logo', 'CUERAMARO-CARNES-LOGO-SIMBOLO-sin-fondo.png'),
        path.resolve(process.cwd(), 'frontend', 'src', 'assets', 'CUERAMARO-CARNES-LOGO-COMPLETO-sin-fondo.png'),
        path.resolve(process.cwd(), 'frontend', 'src', 'assets', 'CUERAMARO-CARNES-LOGO-SIMBOLO-sin-fondo.png')
      ];
      const logoPath = logoCandidates.find((p) => fs.existsSync(p));
      let titleRow = 1;
      if (logoPath) {
        const imageId = wb.addImage({ filename: logoPath, extension: 'png' });
        ws.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 200, height: 60 }
        });
        titleRow = 4; // dejar espacio para el logo
      }

      ws.getRow(titleRow).height = 22;
      ws.mergeCells(titleRow, 1, titleRow, 3);
      ws.getCell(titleRow, 1).value = 'REPORTE DE VENTAS';
      ws.getCell(titleRow, 1).font = { bold: true, size: 14 };

      const headerRow = titleRow + 1;
      ws.getRow(headerRow).values = ['ID FACTURA', 'FECHA', 'TOTAL (MXN)'];
      ws.getRow(headerRow).font = { bold: true };
      let r = headerRow + 1;
      for (const s of sales) {
        const folio = (s.id || '').slice(0, 8);
        ws.getCell(r, 1).value = folio;
        ws.getCell(r, 2).value = s.createdAt;
        ws.getCell(r, 2).numFmt = 'yyyy-mm-dd hh:mm';
        ws.getCell(r, 3).value = s.total;
        ws.getCell(r, 3).numFmt = '$#,##0.00';
        r++;
      }
      ws.columns = [
        { key: 'id', width: 24 },
        { key: 'fecha', width: 22 },
        { key: 'total', width: 16 }
      ];

      const buf = await wb.xlsx.writeBuffer();
      const stamp = new Date().toISOString().slice(0, 10);
      res!.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res!.setHeader('Content-Disposition', `attachment; filename="reporte_ventas_${stamp}.xlsx"`);
      res!.send(Buffer.from(buf));
      return;
    } catch (e) {
      // Fallback simple con xlsx
      const title = 'REPORTE DE VENTAS';
      const rows = [
        [title],
        ['ID FACTURA', 'FECHA', 'TOTAL (MXN)'],
        ...sales.map((s) => [String((s.id || '').slice(0, 8)), s.createdAt.toISOString(), s.total])
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'VENTAS');
      (ws['!cols'] as any) = [{ wch: 24 }, { wch: 22 }, { wch: 16 }];
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      const stamp = new Date().toISOString().slice(0, 10);
      res!.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res!.setHeader('Content-Disposition', `attachment; filename="reporte_ventas_${stamp}.xlsx"`);
      res!.send(buf);
    }
  }
}
