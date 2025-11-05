import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { CreditTerms } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CreateCustomerDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  personalAddress?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsOptional()
  @IsString()
  rfcCurp?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  phonePersonal?: string;

  @IsOptional()
  @IsString()
  whatsappPersonal?: string;

  @IsOptional()
  @IsString()
  phoneBusiness?: string;

  @IsOptional()
  @IsString()
  whatsappBusiness?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(CreditTerms)
  customerType?: CreditTerms = CreditTerms.contado;

  @IsOptional()
  @IsInt()
  @Min(0)
  creditDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  authorizedPeople?: any; // JSON con personas autorizadas
}

@Controller('customers')
export class CustomersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.customer.findMany({ orderBy: { createdAt: 'asc' } });
  }


  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: CreateCustomerDto) {
    const payload: any = { ...body };
    // Lógica de congruencia: si hay días de crédito > 0, forzar tipo 'credito'.
    if (typeof body.creditDays === 'number' && body.creditDays > 0) {
      payload.customerType = CreditTerms.credito;
    } else if (!body.customerType) {
      // Si no se indicó tipo explícitamente, por omisión 'contado'.
      payload.customerType = CreditTerms.contado;
    }
    return this.prisma.customer.create({ data: payload });
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() body: Partial<CreateCustomerDto>) {
    const payload: any = { ...body };
    // Si se actualizan días de crédito a > 0, forzar 'credito'.
    if (typeof body.creditDays === 'number' && body.creditDays > 0) {
      payload.customerType = CreditTerms.credito;
    }
    // Si creditDays es 0 o no está, respetar customerType si viene; si no, no cambiar.
    return this.prisma.customer.update({ where: { id }, data: payload });
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    await this.prisma.customer.delete({ where: { id } });
    return { ok: true };
  }

  // Créditos por cliente (ventas con saldo)
  @Get(':id/receivables')
  async receivables(@Param('id') id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id }, select: { id: true, name: true, creditDays: true } });
    if (!customer) throw new BadRequestException('Cliente no encontrado');
    const sales = await this.prisma.sale.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true, creditDueDate: true, total: true, paidAmount: true, paymentMethod: true }
    });
    const items = sales.map((s) => {
      const paid = Number(s.paidAmount || 0);
      const due = Math.max(0, Number(s.total || 0) - paid);
      return {
        id: s.id,
        folio: (s.id || '').slice(0, 8),
        createdAt: s.createdAt,
        creditDueDate: s.creditDueDate,
        total: s.total,
        paidAmount: paid,
        due,
        paymentMethod: s.paymentMethod
      };
    }).filter((x) => x.due > 0 || x.paymentMethod === 'credito');
    const totalDue = items.reduce((acc, i) => acc + i.due, 0);
    const debts = items.filter((i) => i.due > 0).length;
    return { customer: { id: customer.id, name: customer.name, creditDays: customer.creditDays }, totalDue, debts, items };
  }
}
