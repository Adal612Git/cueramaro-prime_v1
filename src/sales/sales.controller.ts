import { BadRequestException, Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsArray, IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
type PaymentMethod = 'efectivo' | 'transferencia' | 'credito' | 'tarjeta' | 'otro';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InvoiceService } from '../invoice/invoice.service';
import { Request } from 'express';

class SaleItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  discount?: number = 0;
}

class CreateSaleDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsIn(['efectivo', 'transferencia', 'credito', 'tarjeta', 'otro'])
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  creditDueDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];
}

@Controller('sales')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SalesController {
  constructor(private prisma: PrismaService, private invoice: InvoiceService) {}

  @Get()
  @Roles('ADMIN', 'MOSTRADOR')
  async list() {
    return this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true, customer: { select: { id: true, name: true } } }
    });
  }

  @Post()
  @Roles('ADMIN', 'MOSTRADOR')
  async create(@Body() body: CreateSaleDto, @Req() req: Request) {
    if (!body.items?.length) throw new BadRequestException('Agrega al menos un producto');

    // Verificar productos
    const productIds = body.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    const map = new Map(products.map((p) => [p.id, p] as const));
    if (products.length !== productIds.length) throw new BadRequestException('Producto inexistente');

    const itemsWithTotal = body.items.map((i) => {
      const p = map.get(i.productId)!;
      const unitPrice = i.unitPrice && isFinite(i.unitPrice) && i.unitPrice > 0 ? i.unitPrice : (p as any).price || 0;
      const quantity = i.quantity;
      const maxDiscount = unitPrice * quantity;
      const discount = Math.min(Math.max(0, i.discount ?? 0), maxDiscount);
      const lineTotal = unitPrice * quantity - discount;
      if (!isFinite(unitPrice) || unitPrice <= 0) {
        throw new BadRequestException('Precio inválido para uno de los productos');
      }
      if (!isFinite(lineTotal) || lineTotal <= 0) {
        throw new BadRequestException('Hay líneas con importe cero o negativo');
      }
      return { productId: i.productId, quantity, unitPrice, discount, lineTotal };
    });
    const total = itemsWithTotal.reduce((acc, i) => acc + i.lineTotal, 0);
    if (!isFinite(total) || total <= 0) {
      throw new BadRequestException('El total de la venta debe ser mayor a cero');
    }

    // Crear venta y partidas
    const sale = await this.prisma.sale.create({
      data: {
        customerId: body.customerId,
        total,
        paidAmount: body.paymentMethod === 'credito' ? 0 : total,
        paymentMethod: body.paymentMethod,
        notes: body.notes,
        creditDueDate: body.paymentMethod === 'credito' ? (body.creditDueDate ? new Date(body.creditDueDate) : null) : null,
        items: {
          create: itemsWithTotal.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
            lineTotal: i.lineTotal
          }))
        }
      },
      include: { items: { include: { product: true } }, customer: true }
    });

    // Actualizar inventario básico
    await Promise.all(
      itemsWithTotal.map(async (i) => {
        const p = map.get(i.productId)! as any;
        if (typeof p.stockQty === 'number') {
          const newQty = Math.max(0, (p.stockQty || 0) - i.quantity);
          await this.prisma.product.update({ where: { id: p.id }, data: { stockQty: newQty } });
        } else {
          // fallback a stock entero
          const newStock = Math.max(0, p.stock - Math.round(i.quantity));
          await this.prisma.product.update({ where: { id: p.id }, data: { stock: newStock } });
        }
      })
    );

    // Intentar generar Factura.xlsm con plantilla
    let invoiceUrl: string | null = null;
    try {
      const user: any = (req as any).user;
      const vendorName = user?.name || undefined;
      const outPath = await this.invoice.generateFromTemplate(sale as any, vendorName);
      if (outPath) {
        const file = outPath.split(/[/\\]/).pop()!;
        invoiceUrl = `/facturas/${file}`;
      }
    } catch {}

    return { ...sale, invoiceUrl } as any;
  }
}
