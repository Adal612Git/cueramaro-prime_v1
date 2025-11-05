import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import type { Prisma } from '@prisma/client';

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
      const templatePath = path.resolve(process.cwd(), 'Factura.xlsm');
      if (!fs.existsSync(templatePath)) {
        this.logger.warn(`No se encontró plantilla: ${templatePath}`);
        return null;
      }

      const outDir = path.resolve(process.cwd(), 'facturas');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const outName = `Factura-${(sale.id || '').slice(0, 8)}.xlsm`;
      const outPath = path.join(outDir, outName);

      // Intento 1: usar submódulo Python para rellenar XLSM preservando QR/macros
      try {
        const candidates = ['python3', 'python', 'py'];
        const script = path.resolve(process.cwd(), 'tools', 'fill_invoice.py');
        if (fs.existsSync(script)) {
          const payload = {
            sale,
            vendorName: vendorName || '',
            expedidaEn: process.env.INVOICE_EXPEDIDA_EN || 'Cuerámaro, Guanajuato'
          };
          const tmpJson = path.join(tmpdir(), `sale-${(sale.id || 'tmp').slice(0,8)}.json`);
          fs.writeFileSync(tmpJson, JSON.stringify(payload), 'utf8');
          let ok = false; let lastErr: any = null;
          for (const py of candidates) {
            try {
              execFileSync(py, [script, templatePath, outPath, tmpJson], { stdio: 'inherit' });
              ok = true;
              break;
            } catch (err) {
              lastErr = err;
            }
          }
          if (!ok) throw lastErr || new Error('No Python interpreter found');
          if (fs.existsSync(outPath)) {
            this.logger.log(`Factura generada (Python): ${outPath}`);
            return outPath;
          }
        }
      } catch (e) {
        this.logger.warn(`Python fill_invoice fallback: ${String(e)}`);
      }

      // Preparar dir temporal y extraer plantilla
      const tmpDir = path.join(outDir, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      try {
        // Extraer XLSM
        execFileSync('unzip', ['-q', templatePath, '-d', tmpDir]);

        // Localizar hoja "Formato"
        const wbXmlPath = path.join(tmpDir, 'xl', 'workbook.xml');
        const wbRelsPath = path.join(tmpDir, 'xl', '_rels', 'workbook.xml.rels');
        const wbXml = fs.readFileSync(wbXmlPath, 'utf8');
        const relsXml = fs.readFileSync(wbRelsPath, 'utf8');

        const rIdMatch = /<sheet[^>]*name="Formato"[^>]*r:id="([^"]+)"/m.exec(wbXml);
        if (!rIdMatch) {
          this.logger.warn('Hoja "Formato" no encontrada en Factura.xlsm');
          return null;
        }
        const rId = rIdMatch[1];
        const targetMatch = new RegExp(`<Relationship[^>]*Id="${rId}"[^>]*Target="([^"]+)"`, 'm').exec(relsXml);
        if (!targetMatch) {
          this.logger.warn('Relación de hoja "Formato" no encontrada en workbook.xml.rels');
          return null;
        }
        const sheetTarget = targetMatch[1].replace(/^\//, ''); // e.g. worksheets/sheet3.xml
        const sheetXmlPath = path.join(tmpDir, 'xl', sheetTarget);
        let xml = fs.readFileSync(sheetXmlPath, 'utf8');

        // Helpers de edición XML muy simples
        const escapeXml = (s: string) => s
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        const setCellStr = (doc: string, addr: string, value: string): string => {
          const re = new RegExp(`(<c\\b[^>]*\\br=\"${addr}\"[^>]*)(>)([\\s\\S]*?)(<\\/c>)`, 'm');
          const m = re.exec(doc);
          const payload = `<is><t>${escapeXml(value)}</t></is>`;
          if (m) {
            let attrs = m[1].replace(/\s+t=\"[^\"]*\"/g, '');
            attrs += ' t="inlineStr"';
            return doc.slice(0, m.index) + `${attrs}>${payload}</c>` + doc.slice(m.index + m[0].length);
          }
          // Insertar en la fila correspondiente si no existe la celda
          const row = parseInt(addr.replace(/^[A-Z]+/, ''), 10);
          const rowRe = new RegExp(`(<row\\b[^>]*\\br=\"${row}\"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
          const mr = rowRe.exec(doc);
          if (mr) {
            const cell = `<c r="${addr}" t="inlineStr">${payload}</c>`;
            const before = doc.slice(0, mr.index + mr[1].length);
            const after = doc.slice(mr.index + mr[0].length - 6); // include </row>
            const inner = mr[2] + cell;
            return before + inner + '</row>' + after;
          }
          return doc; // si no existe fila, no modifica
        };

        const setCellNum = (doc: string, addr: string, num: number): string => {
          const re = new RegExp(`(<c\\b[^>]*\\br=\"${addr}\"[^>]*)(>)([\\s\\S]*?)(<\\/c>)`, 'm');
          const m = re.exec(doc);
          const payload = `<v>${Number(num || 0)}</v>`;
          if (m) {
            let attrs = m[1].replace(/\s+t=\"[^\"]*\"/g, '');
            return doc.slice(0, m.index) + `${attrs}>${payload}</c>` + doc.slice(m.index + m[0].length);
          }
          const row = parseInt(addr.replace(/^[A-Z]+/, ''), 10);
          const rowRe = new RegExp(`(<row\\b[^>]*\\br=\"${row}\"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
          const mr = rowRe.exec(doc);
          if (mr) {
            const cell = `<c r="${addr}">${payload}</c>`;
            const before = doc.slice(0, mr.index + mr[1].length);
            const after = doc.slice(mr.index + mr[0].length - 6);
            const inner = mr[2] + cell;
            return before + inner + '</row>' + after;
          }
          return doc;
        };

        const clearCell = (doc: string, addr: string): string => {
          const re = new RegExp(`(<c\\b[^>]*\\br=\"${addr}\"[^>]*)(>)([\\s\\S]*?)(<\\/c>)`, 'm');
          const m = re.exec(doc);
          if (m) {
            // Mantener atributos (estilos) pero sin valor / tipo
            const attrs = m[1].replace(/\s+t=\"[^\"]*\"/g, '');
            return doc.slice(0, m.index) + `${attrs}></c>` + doc.slice(m.index + m[0].length);
          }
          return doc;
        };

        // Versiones robustas que manejan celdas autocontenidas <c .../> y abiertas </c>, y crean fila si falta
        const ensureRow = (doc: string, rowNum: number): { doc: string; inserted: boolean } => {
          const rowRe = new RegExp(`(<row\\b[^>]*\\br=\"${rowNum}\"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
          if (rowRe.test(doc)) return { doc, inserted: false };
          const sdClose = doc.lastIndexOf('</sheetData>');
          if (sdClose === -1) return { doc, inserted: false };
          const rowXml = `<row r="${rowNum}"></row>`;
          const newDoc = doc.slice(0, sdClose) + rowXml + doc.slice(sdClose);
          return { doc: newDoc, inserted: true };
        };

        const putStr = (doc: string, addr: string, value: string): string => {
          const payload = `<is><t>${escapeXml(value)}</t></is>`;
          // Abierta
          let re = new RegExp(`(<c\\b[^>]*\\br=\"${addr}\"[^>]*)(>)([\\s\\S]*?)(<\\/c>)`, 'm');
          let m = re.exec(doc);
          if (m) {
            let attrs = m[1].replace(/\s+t="[^"]*"/g, '');
            attrs += ' t="inlineStr"';
            return doc.slice(0, m.index) + `${attrs}>${payload}</c>` + doc.slice(m.index + m[0].length);
          }
          // Autocontenida
          re = new RegExp(`(<c\\b[^>]*\\br=\"${addr}\"[^>]*)\/>(?![\\s\\S]*<c\\b[^>]*\\br=\"${addr}\")`, 'm');
          m = re.exec(doc);
          if (m) {
            let attrs = m[1].replace(/\s+t="[^"]*"/g, '');
            attrs += ' t="inlineStr"';
            return doc.slice(0, m.index) + `${attrs}>${payload}</c>` + doc.slice(m.index + m[0].length);
          }
          // Insertar
          const row = parseInt(addr.replace(/^[A-Z]+/, ''), 10);
          const rowRe = new RegExp(`(<row\\b[^>]*\\br=\"${row}\"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
          let mr = rowRe.exec(doc);
          if (!mr) {
            const ensured = ensureRow(doc, row);
            doc = ensured.doc;
            mr = rowRe.exec(doc);
          }
          if (mr) {
            const cell = `<c r="${addr}" t="inlineStr">${payload}</c>`;
            const before = doc.slice(0, mr.index + mr[1].length);
            const after = doc.slice(mr.index + mr[0].length - 6);
            const inner = mr[2] + cell;
            return before + inner + '</row>' + after;
          }
          return doc;
        };

        const putNum = (doc: string, addr: string, num: number): string => {
          const payload = `<v>${Number(num || 0)}</v>`;
          // Abierta
          let re = new RegExp(`(<c\\b[^>]*\\br=\"${addr}\"[^>]*)(>)([\\s\\S]*?)(<\\/c>)`, 'm');
          let m = re.exec(doc);
          if (m) {
            let attrs = m[1].replace(/\s+t="[^"]*"/g, '');
            return doc.slice(0, m.index) + `${attrs}>${payload}</c>` + doc.slice(m.index + m[0].length);
          }
          // Autocontenida
          re = new RegExp(`(<c\\b[^>]*\\br=\"${addr}\"[^>]*)\/>(?![\\s\\S]*<c\\b[^>]*\\br=\"${addr}\")`, 'm');
          m = re.exec(doc);
          if (m) {
            let attrs = m[1].replace(/\s+t="[^"]*"/g, '');
            return doc.slice(0, m.index) + `${attrs}>${payload}</c>` + doc.slice(m.index + m[0].length);
          }
          // Insertar
          const row = parseInt(addr.replace(/^[A-Z]+/, ''), 10);
          const rowRe = new RegExp(`(<row\\b[^>]*\\br=\"${row}\"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
          let mr = rowRe.exec(doc);
          if (!mr) {
            const ensured = ensureRow(doc, row);
            doc = ensured.doc;
            mr = rowRe.exec(doc);
          }
          if (mr) {
            const cell = `<c r="${addr}">${payload}</c>`;
            const before = doc.slice(0, mr.index + mr[1].length);
            const after = doc.slice(mr.index + mr[0].length - 6);
            const inner = mr[2] + cell;
            return before + inner + '</row>' + after;
          }
          return doc;
        };

        const wipeCell = (doc: string, addr: string): string => {
          // Abierta
          let re = new RegExp(`(<c\\b[^>]*\\br=\"${addr}\"[^>]*)(>)([\\s\\S]*?)(<\\/c>)`, 'm');
          let m = re.exec(doc);
          if (m) {
            const attrs = m[1].replace(/\s+t="[^"]*"/g, '');
            return doc.slice(0, m.index) + `${attrs}></c>` + doc.slice(m.index + m[0].length);
          }
          // Autocontenida
          re = new RegExp(`(<c\\b[^>]*\\br=\"${addr}\"[^>]*)\/>(?![\\s\\S]*<c\\b[^>]*\\br=\"${addr}\")`, 'm');
          m = re.exec(doc);
          if (m) {
            const attrs = m[1].replace(/\s+t="[^"]*"/g, '');
            return doc.slice(0, m.index) + `${attrs}></c>` + doc.slice(m.index + m[0].length);
          }
          return doc;
        };

        const formatDateEs = (d: Date) => new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
        const yearOf = (d: Date) => d.getFullYear();
        const toWordsMx = (value: number) => {
          const entero = Math.floor(Math.max(0, value || 0));
          const centavos = Math.round(((value || 0) - entero) * 100);
          const palabras = numberToWordsEs(entero);
          const cents = String(centavos).padStart(2, '0');
          return `${palabras} pesos ${cents}/100 M.N.`;
        };

        const expedidaEn = process.env.INVOICE_EXPEDIDA_EN || 'Cuerámaro, Guanajuato';
        const isCredito = sale.paymentMethod === 'credito';
        const createdAt = sale.createdAt ? new Date(sale.createdAt) : new Date();

        // Encabezado y año: escribir valores en la fila de abajo de cada etiqueta
        // EXPEDIDA EN -> F5
        xml = putStr(xml, 'F5', expedidaEn);
        // FECHA DE VENCIMIENTO -> F7 (solo crédito)
        if (isCredito && sale.creditDueDate) {
          const fv = formatDateEs(new Date(sale.creditDueDate));
          xml = putStr(xml, 'F7', fv);
        } else {
          xml = wipeCell(xml, 'F7');
        }
        xml = putStr(xml, 'E3', formatDateEs(createdAt));
        xml = putNum(xml, 'F3', yearOf(createdAt));
        xml = wipeCell(xml, 'G2');

        // Cliente
        const customerName = sale.customer?.name ?? 'Mostrador';
        const address = sale.customer?.businessAddress || sale.customer?.personalAddress || '';
        const rfc = sale.customer?.rfcCurp || '';
        // CP: prioriza CP de negocio y luego personal
        const postalCode = ((sale.customer as any)?.businessPostalCode || (sale.customer as any)?.personalPostalCode || '') as string;
        // Tel/Cel: prioriza teléfonos de negocio, luego personal, luego general; si no, WhatsApp
        const phone = (
          (sale.customer as any)?.phoneBusiness ||
          (sale.customer as any)?.phonePersonal ||
          (sale.customer as any)?.phone ||
          (sale.customer as any)?.whatsappBusiness ||
          (sale.customer as any)?.whatsappPersonal ||
          (sale.customer as any)?.whatsapp ||
          ''
        ) as string;
        const code = (sale.customer as any)?.code as number | undefined;
        xml = putStr(xml, 'B10', customerName);
        if (code != null) xml = putNum(xml, 'B9', code);
        if (address) xml = putStr(xml, 'B11', address);
        if (postalCode) xml = putStr(xml, 'B12', String(postalCode));
        if (rfc) xml = putStr(xml, 'B13', rfc);
        if (phone) xml = putStr(xml, 'B14', phone);
        if (address) xml = putStr(xml, 'B15', address);

        // Método de pago y plazo
        const methodMap: Record<string, string> = {
          efectivo: 'Pago de contado',
          transferencia: 'Pago por transferencia',
          credito: 'Crédito',
          tarjeta: 'Pago con tarjeta',
          otro: 'Otro método'
        };
        // MÉTODO DE PAGO -> F9
        xml = putStr(xml, 'F9', methodMap[sale.paymentMethod] || 'Pago de contado');
        if (isCredito) {
          const plazo = sale.customer?.creditDays ?? 0;
          const plazoStr = `${plazo || 0} días`;
          // PLAZO DE PAGO -> F11
          xml = putStr(xml, 'F11', plazoStr);
        } else {
          xml = putStr(xml, 'F11', 'Contado');
        }
        // MONEDA -> F13
        xml = putStr(xml, 'F13', 'M.N. MXN');
        // VENDEDOR -> F15
        if (vendorName) {
          xml = putStr(xml, 'F15', vendorName);
        }

        // Partidas
        const startRow = 18;
        sale.items.forEach((it, idx) => {
          const row = startRow + idx;
          xml = putNum(xml, `A${row}`, Number(it.quantity) || 0);
          xml = putStr(xml, `B${row}`, it.product?.sku || it.productId);
          xml = putStr(xml, `C${row}`, it.product?.unit || '');
          xml = putStr(xml, `D${row}`, it.product?.name || '');
          xml = putNum(xml, `E${row}`, Number(it.unitPrice) || 0);
          xml = putNum(xml, `F${row}`, Number(it.lineTotal) || 0);
        });
        for (let r = startRow + sale.items.length; r <= 27; r++) {
          ['A', 'B', 'C', 'D', 'E', 'F'].forEach((col) => (xml = wipeCell(xml, `${col}${r}`)));
        }

        // Totales
        const subtotal = sale.items.reduce((acc, i) => acc + (Number(i.lineTotal) || 0), 0);
        xml = putNum(xml, 'F28', subtotal);
        xml = putNum(xml, 'F30', sale.total);
        xml = putNum(xml, 'F32', sale.total);
        xml = putStr(xml, 'D28', toWordsMx(sale.total));
        // C36: cantidad en letra para pagaré/total a pagar
        xml = putStr(xml, 'C36', toWordsMx(sale.total));

        // Pagaré (solo crédito)
        if (isCredito) {
          const today = sale.createdAt ? new Date(sale.createdAt) : new Date();
          const fechaLarga = formatDateEs(today);
          xml = putStr(xml, 'B33', `En ${expedidaEn} ${fechaLarga}`);
          xml = putStr(xml, 'A35', `en ${expedidaEn} el ${formatDateEs(sale.creditDueDate ? new Date(sale.creditDueDate) : today)}`);
          xml = putStr(xml, 'A36', `La Cantidad  de: ${this.formatCurrency(sale.total)}`);
          xml = putStr(xml, 'B43', customerName);
          if (address) xml = putStr(xml, 'B44', address);
          xml = putStr(xml, 'B45', expedidaEn);
        }

        // Guardar hoja modificada
        fs.writeFileSync(sheetXmlPath, xml, 'utf8');

        // Empaquetar nuevamente a XLSM de salida
        // Creamos/actualizamos outPath desde contenido del tmpDir
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
        execFileSync('bash', ['-lc', `cd "${tmpDir}" && zip -qr "${outPath}" *`]);

        this.logger.log(`Factura generada: ${outPath}`);
        return outPath;
      } finally {
        // Limpieza
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {}
      }
    } catch (err) {
      this.logger.error('Error generando Factura.xlsm', err as any);
      return null;
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(value || 0);
  }
}

// Conversor sencillo de números a palabras en español (hasta millones)
function numberToWordsEs(n: number): string {
  if (n === 0) return 'cero';
  const unidades = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'];
  const especiales = ['diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve'];
  const decenas = ['','diez','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
  const centenas = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];

  function tens(num: number): string {
    if (num < 10) return unidades[num];
    if (num < 20) return especiales[num - 10];
    if (num < 30) return num === 20 ? 'veinte' : 'veinti' + unidades[num - 20];
    const d = Math.floor(num / 10);
    const u = num % 10;
    return u ? `${decenas[d]} y ${unidades[u]}` : decenas[d];
  }

  function hundreds(num: number): string {
    if (num === 100) return 'cien';
    const c = Math.floor(num / 100);
    const r = num % 100;
    const cent = centenas[c];
    return c ? (r ? `${cent} ${tens(r)}` : cent) : tens(r);
  }

  function section(num: number, singular: string, plural: string, value: number): string {
    const amount = Math.floor(num / value);
    const rest = num % value;
    if (!amount) return '';
    const words = amount === 1 ? singular : `${numberToWordsEs(amount)} ${plural}`;
    return rest ? `${words} ${numberToWordsEs(rest)}` : words;
  }

  if (n >= 1_000_000) {
    const millones = Math.floor(n / 1_000_000);
    const resto = n % 1_000_000;
    const pref = millones === 1 ? 'un millón' : `${numberToWordsEs(millones)} millones`;
    return resto ? `${pref} ${numberToWordsEs(resto)}` : pref;
  }
  if (n >= 1000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const pref = miles === 1 ? 'mil' : `${hundreds(miles)} mil`;
    return resto ? `${pref} ${hundreds(resto)}` : pref;
  }
  return hundreds(n);
}
