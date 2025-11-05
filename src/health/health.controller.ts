import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    const started = Date.now();
    let db = 'down';
    let dbLatencyMs: number | null = null;
    try {
      await (this.prisma as any).$executeRawUnsafe('SELECT 1');
      db = 'ok';
      dbLatencyMs = Date.now() - started;
    } catch {
      db = 'down';
    }
    return {
      status: 'ok',
      time: new Date().toISOString(),
      db,
      dbLatencyMs
    };
  }
}

