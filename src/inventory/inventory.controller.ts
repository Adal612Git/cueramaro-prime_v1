import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class IngressDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  lotCode?: string;

  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InventoryController {
  constructor(private prisma: PrismaService) {}

  // Registra una entrada de inventario y ajusta existencia
  @Post('ingress')
  @Roles('ADMIN', 'MOSTRADOR')
  async ingress(@Body() body: IngressDto) {
    const qty = Number(body.quantity);
    if (!isFinite(qty) || qty <= 0) throw new BadRequestException('Cantidad inválida');
    const byId = (body.productId || '').trim();
    const bySku = (body.sku || '').trim();
    if (!byId && !bySku) throw new BadRequestException('Proporcione productId o sku');

    const product = await this.prisma.product.findFirst({
      where: byId ? { id: byId } : { sku: bySku },
      select: { id: true, name: true, sku: true, unit: true, stock: true, stockQty: true }
    });
    if (!product) throw new BadRequestException('Producto no encontrado');

    const arrival = body.arrivalDate ? new Date(body.arrivalDate) : new Date();
    const expiration = body.expirationDate ? new Date(body.expirationDate) : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Crear lote de inventario (opcionalmente sin expiración)
      await tx.inventoryLot.create({
        data: {
          productId: product.id,
          sku: product.sku || null,
          quantity: qty,
          arrivalDate: arrival,
          expirationDate: expiration,
          cost: body.cost ?? null,
          lotCode: body.lotCode || null
        }
      });

      // Ajustar existencia según tipo
      if (typeof product.stockQty === 'number') {
        const newQty = Math.max(0, (product.stockQty || 0) + qty);
        return tx.product.update({ where: { id: product.id }, data: { stockQty: newQty } });
      } else {
        const add = Math.round(qty);
        const newStock = Math.max(0, (product.stock || 0) + add);
        return tx.product.update({ where: { id: product.id }, data: { stock: newStock } });
      }
    });

    return { ok: true, product: updated };
  }
}

