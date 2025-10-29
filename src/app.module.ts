import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { CxcModule } from './modules/cxc/cxc.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    SuppliersModule,
    CustomersModule,
    ProductsModule,
    InventoryModule,
    SalesModule,
    CxcModule,
    ExpensesModule,
    ReportsModule,
    SyncModule
  ]
})
export class AppModule {}
