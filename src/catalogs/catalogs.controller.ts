import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('catalogs')
export class CatalogsController {
  constructor(private prisma: PrismaService) {}

  @Get('protein-types')
  async proteinTypes() {
    try {
      const types = await this.prisma.proteinType.findMany({
        orderBy: { name: 'asc' },
        include: { subtypes: { orderBy: { name: 'asc' } } }
      });
      if (Array.isArray(types) && types.length > 0) return types;
    } catch (_) {
      // Fallback si el modelo aún no existe o la DB no está migrada
    }
    const fallback = [
      { id: 'res', name: 'res', subtypes: [{ id: 'res-general', name: 'general', typeId: 'res' }] },
      { id: 'cerdo', name: 'cerdo', subtypes: [{ id: 'cerdo-general', name: 'general', typeId: 'cerdo' }] },
      { id: 'pollo', name: 'pollo', subtypes: [{ id: 'pollo-general', name: 'general', typeId: 'pollo' }] },
      { id: 'pescado', name: 'pescado', subtypes: [{ id: 'pescado-general', name: 'general', typeId: 'pescado' }] }
    ];
    return fallback;
  }
}
