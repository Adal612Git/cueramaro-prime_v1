import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CxcService } from './cxc.service';
import { CreateReceivableDto, RegisterReceivablePaymentDto } from './dto/create-receivable.dto';

@Controller('cxc')
export class CxcController {
  constructor(private readonly cxcService: CxcService) {}

  @Post()
  create(@Body() dto: CreateReceivableDto) {
    return this.cxcService.create(dto);
  }

  @Patch(':id/payments')
  pay(@Param('id') id: string, @Body() dto: RegisterReceivablePaymentDto) {
    return this.cxcService.registerPayment(id, dto);
  }

  @Get()
  list() {
    return this.cxcService.findAll();
  }
}
