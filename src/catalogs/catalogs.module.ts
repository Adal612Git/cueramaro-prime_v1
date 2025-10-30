import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogsController } from './catalogs.controller';

@Module({ imports: [PrismaModule], controllers: [CatalogsController] })
export class CatalogsModule {}

