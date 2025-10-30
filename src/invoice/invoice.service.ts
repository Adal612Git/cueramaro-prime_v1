import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type { Prisma } from '@prisma/client';

// Lazy require to avoid hard dependency when not installed yet
let XLSX: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  XLSX = require('xlsx');
} catch (_) {
  // Module will be required after installation
}

type SaleWithDetails = Prisma.SaleGetPayload<{
  include: {
    items: { include: { product: true } };
    customer: true;
  };
}>;

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  async generateFromTemplate(sale: SaleWithDetails, vendorName?: string): Promise<string | null> {
    try {
      if (!XLSX) {
        this.logger.warn('xlsx no instalado; omitiendo generación de Factura.xlsm');
        return null;
      }

      const templatePath = path.resolve(process.cwd(), 'Factura.xlsm');
      if (!fs.existsSync(templatePath)) {
        this.logger.warn(`No se encontró plantilla: ${templatePath}`);
        return null;
      }

      const outDir = path.resolve(process.cwd(), 'facturas');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const wb = XLSX.readFile(templatePath, { cellDates: true });
      const sheetName = 'Formato';
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        this.logger.warn('Hoja "Formato" no encontrada en Factura.xlsm');
        return null;
      }

      // Helpers
      const set = (addr: string, v: any, t: 's' | 'n' = (typeof v === 'number' ? 'n' : 's')) => {
        ws[addr] = { v, t };
      };
      const formatDateEs = (d: Date) => new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);

      const expedidaEn = process.env.INVOICE_EXPEDIDA_EN || 'Cuerámaro, Guanajuato';
      const isCredito = sale.paymentMethod === 'credito';

      // Encabezado dinámico básico
      // E5: Expedida en
      set('E5', expedidaEn, 's');
      // E7: Fecha de vencimiento (solo crédito)
      if (isCredito && sale.creditDueDate) set('E7', formatDateEs(new Date(sale.creditDueDate)), 's');

      // Datos del cliente
      const customerName = sale.customer?.name ?? 'Mostrador';
      const address = sale.customer?.businessAddress || sale.customer?.personalAddress || '';
      const rfc = sale.customer?.rfcCurp || '';
      const phone = sale.customer?.phone || '';
      set('B10', customerName, 's');
      if (address) set('B11', address, 's');
      if (rfc) set('B13', rfc, 's');
      if (phone) set('B14', phone, 's');

      // Método de pago y plazo
      const methodMap: Record<string, string> = {
        efectivo: 'Pago de contado',
        transferencia: 'Pago por transferencia',
        credito: 'Crédito',
        tarjeta: 'Pago con tarjeta',
        otro: 'Otro método'
      };
      set('E9', methodMap[sale.paymentMethod] || 'Pago de contado', 's');
      if (isCredito) {
        const plazo = sale.customer?.creditDays ?? 0;
        set('E11', `${plazo || 0} días`, 's');
      } else {
        set('E11', 'Contado', 's');
      }
      // Moneda
      set('E13', 'M.N. MXN', 's');
      // Vendedor
      if (vendorName) set('E15', vendorName, 's');

      // Partidas
      const startRow = 18; // A18..F18
      sale.items.forEach((it, idx) => {
        const row = startRow + idx;
        set(`A${row}`, Number(it.quantity) || 0, 'n');
        set(`B${row}`, it.product?.sku || it.productId, 's');
        set(`C${row}`, it.product?.unit || '', 's');
        set(`D${row}`, it.product?.name || '', 's');
        set(`E${row}`, Number(it.unitPrice) || 0, 'n');
        set(`F${row}`, Number(it.lineTotal) || 0, 'n');
      });
      // Limpia filas restantes hasta 27
      for (let r = startRow + sale.items.length; r <= 27; r++) {
        ['A', 'B', 'C', 'D', 'E', 'F'].forEach((col) => delete ws[`${col}${r}`]);
      }

      // Totales
      const subtotal = sale.items.reduce((acc, i) => acc + (Number(i.lineTotal) || 0), 0);
      set('F28', subtotal, 'n'); // SUBTOTAL
      // IVA (no desglosado por ahora)
      set('F30', sale.total, 'n'); // TOTAL
      set('F32', sale.total, 'n'); // BUENO POR

      // Pagaré (solo crédito)
      if (isCredito) {
        const today = sale.createdAt ? new Date(sale.createdAt) : new Date();
        const fechaLarga = formatDateEs(today).replace(' de ', ' de ');
        set('B33', `En ${expedidaEn} ${fechaLarga}`, 's');
        set('A35', `en ${expedidaEn} el ${formatDateEs(sale.creditDueDate ? new Date(sale.creditDueDate) : today)}`, 's');
        set('A36', `La Cantidad  de: ${this.formatCurrency(sale.total)}`, 's');
        set('B43', customerName, 's');
        if (address) set('B44', address, 's');
        // Ciudad si se puede inferir, si no, usa expedidaEn
        set('B45', expedidaEn, 's');
      }

      const outName = `Factura-${(sale.id || '').slice(0, 8)}.xlsm`;
      const outPath = path.join(outDir, outName);
      XLSX.writeFile(wb, outPath, { bookVBA: true });
      this.logger.log(`Factura generada: ${outPath}`);
      return outPath;
    } catch (err) {
      this.logger.error('Error generando Factura.xlsm', err as any);
      return null;
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(value || 0);
  }
}

