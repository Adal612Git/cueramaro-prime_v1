import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUrl, Length, Min } from 'class-validator';
import { CreditTerms } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CreateSupplierDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  rfcCurp?: string; // compatibilidad

  @IsOptional()
  @IsString()
  rfc?: string;

  @IsOptional()
  @IsString()
  curp?: string;

  @IsOptional()
  @IsEnum(CreditTerms)
  creditTerms?: CreditTerms = CreditTerms.contado;

  @IsOptional()
  @IsInt()
  @Min(0)
  creditDays?: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  clabe?: string;

  @IsOptional()
  @IsBoolean()
  directDelivery?: boolean;

  @IsOptional()
  commercialInfo?: any;

  @IsOptional()
  discountInfo?: any;

  @IsOptional()
  @IsString()
  proteinTypeId?: string;

  @IsOptional()
  @IsString()
  proteinSubTypeId?: string;

  @IsOptional()
  @IsString()
  proteinType?: string;

  @IsOptional()
  @IsString()
  proteinSubType?: string;
}

@Controller('suppliers')
export class SuppliersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' }, include: { proteinType: true, proteinSubType: true } });
  }


  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: CreateSupplierDto) {
    const { proteinTypeId, proteinSubTypeId, ...rest } = body as any;
    try {
      return await (this.prisma as any).supplier.create({ data: { ...rest, proteinTypeId, proteinSubTypeId } });
    } catch (e) {
      // Fallback: guarda nombres en commercialInfo si catálogo relacional no existe todavía
      const data = { ...rest } as any;
      data.commercialInfo = {
        ...(rest.commercialInfo || {}),
        proteinTypeId: proteinTypeId || null,
        proteinSubTypeId: proteinSubTypeId || null
      };
      return this.prisma.supplier.create({ data });
    }
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() body: Partial<CreateSupplierDto>) {
    const { proteinTypeId, proteinSubTypeId, ...rest } = body as any;
    try {
      return await (this.prisma as any).supplier.update({ where: { id }, data: { ...rest, proteinTypeId, proteinSubTypeId } });
    } catch (e) {
      const data = { ...rest } as any;
      if (proteinTypeId || proteinSubTypeId) {
        data.commercialInfo = {
          ...(rest as any)?.commercialInfo,
          proteinTypeId: proteinTypeId || null,
          proteinSubTypeId: proteinSubTypeId || null
        };
      }
      return this.prisma.supplier.update({ where: { id }, data });
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    await this.prisma.supplier.delete({ where: { id } });
    return { ok: true };
  }
}
