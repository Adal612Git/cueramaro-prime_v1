import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Controller('settings')
export class SettingsController {
  constructor(private config: ConfigService, private prisma: PrismaService) {}

  @Get()
  async getSettings() {
    const [products, customers, suppliers, expenses] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.customer.count(),
      this.prisma.supplier.count(),
      this.prisma.expense.count()
    ]);
    return {
      api: {
        port: Number(process.env.PORT || this.config.get('PORT') || 3000)
      },
      cors: this.config.get('CORS_ORIGIN') || null,
      database: {
        url: (this.config.get('DATABASE_URL') || '').replace(/:\/\/[\w-]+:(.*?)@/, '://user:***@'),
        summary: { products, customers, suppliers, expenses }
      }
    };
  }
}

