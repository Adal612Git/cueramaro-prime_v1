import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReportsModule } from './reports/reports.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SettingsModule } from './settings/settings.module';
import { AuthModule } from './auth/auth.module';
import { SalesModule } from './sales/sales.module';
import { CatalogsModule } from './catalogs/catalogs.module';
import { UploadsModule } from './uploads/uploads.module';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProductsModule,
    CustomersModule,
    SuppliersModule,
    ExpensesModule,
    ReportsModule,
    SettingsModule,
    AuthModule,
    SalesModule,
    CatalogsModule,
    UploadsModule,
    HealthModule,
    InventoryModule
  ]
})
export class AppModule {}
