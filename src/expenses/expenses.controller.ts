import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

type PaymentMethodType = 'efectivo' | 'transferencia' | 'credito' | 'tarjeta' | 'otro';

class CreateExpenseDto {
  @IsOptional()
  @IsString()
  concept?: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsIn(['efectivo', 'transferencia', 'credito', 'tarjeta', 'otro'])
  method!: PaymentMethodType;

  @IsOptional()
  @IsBoolean()
  isDeductible?: boolean;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

@Controller('expenses')
export class ExpensesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async list() {
    return this.prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
  }


  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MOSTRADOR')
  async create(@Body() body: CreateExpenseDto) {
    return this.prisma.expense.create({ data: body as any });
  }
}
