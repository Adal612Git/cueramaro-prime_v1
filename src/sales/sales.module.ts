import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesController } from './sales.controller';
import { InvoiceService } from '../invoice/invoice.service';

@Module({
  imports: [PrismaModule],
  controllers: [SalesController],
  providers: [InvoiceService]
})
export class SalesModule {}
