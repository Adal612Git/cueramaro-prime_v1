import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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

  @IsOptional()
  @IsString()
  supplierId?: string;
}

@Controller('products')
export class ProductsController {
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
    return this.prisma.product.create({ data: body as any });
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
