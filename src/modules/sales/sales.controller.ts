import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, RegisterPaymentDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }

  @Patch(':id/payments')
  pay(@Param('id') id: string, @Body() dto: RegisterPaymentDto) {
    return this.salesService.registerPayment(id, dto);
  }

  @Get()
  list() {
    return this.salesService.findAll();
  }
}
