import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  distributor?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  unit?: string; // kg|pz

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQty?: number;

  @IsString()
  supplierId!: string;
}

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    const items = await this.prisma.product.findMany({
      include: { supplier: { select: { id: true, name: true } }, proteinType: true, proteinSubType: true },
      orderBy: { name: 'asc' }
    });
    return items;
  }


  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: CreateProductDto) {
    const name = (body.name || '').trim();
    if (!name) throw new BadRequestException('Nombre requerido');
    const supplierId = (body.supplierId || '').trim();
    if (!supplierId) throw new BadRequestException('Proveedor inválido o inexistente');

    // Validar proveedor existente
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new BadRequestException('Proveedor inválido o inexistente');

    // Normalizar payload para evitar strings vacíos en FKs/opcionales
    const data: any = {
      name,
      supplierId,
      sku: body.sku || undefined,
      price: body.price,
      unit: body.unit || undefined,
      purchasePrice: (body as any).purchasePrice ?? undefined,
      category: (body as any).category || undefined,
      description: (body as any).description || undefined,
      distributor: (body as any).distributor || undefined,
      brand: (body as any).brand || undefined,
      stock: (body as any).stock ?? undefined,
      stockQty: (body as any).stockQty ?? undefined,
      proteinTypeId: (body as any).proteinTypeId || undefined,
      proteinSubTypeId: (body as any).proteinSubTypeId || undefined
    };

    try {
      // Intentar crear directamente y dejar que la BD/índice único decida
      return await this.prisma.product.create({ data });
    } catch (e: any) {
      const code = e?.code || e?.meta?.cause || '';
      const msg = e?.message || '';
      if (
        code === 'P2002' ||
        /Product_name_lower_unique/i.test(msg) ||
        /duplicate key value/i.test(msg) ||
        /unique/i.test(msg)
      ) {
        throw new BadRequestException('Ya existe un producto con ese nombre');
      }
      if (code === 'P2003' || /foreign key/i.test(msg)) {
        throw new BadRequestException('Referencia de catálogo inválida');
      }
      this.logger.error('Error creando producto', e);
      throw new BadRequestException('No se pudo crear el producto');
    }
  }

  @Patch(':id/price')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updatePrice(@Param('id') id: string, @Body() body: { price?: number }) {
    if (typeof body?.price !== 'number' || !isFinite(body.price) || body.price < 0) {
      throw new BadRequestException('Precio inválido');
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: { price: body.price }
    });
    return updated;
  }

  @Patch(':id/stock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MOSTRADOR')
  async adjustStock(
    @Param('id') id: string,
    @Body() body: { quantity?: number }
  ) {
    const qty = Number(body?.quantity);
    if (!isFinite(qty)) throw new BadRequestException('Cantidad inválida');
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new BadRequestException('Producto no encontrado');
    if (product.stockQty != null) {
      const newQty = Math.max(0, (product.stockQty || 0) + qty);
      return this.prisma.product.update({ where: { id }, data: { stockQty: newQty } });
    } else {
      const newStock = Math.max(0, product.stock + Math.round(qty));
      return this.prisma.product.update({ where: { id }, data: { stock: newStock } });
    }
  }
}
