import { Injectable } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { ExpensesService } from '../expenses/expenses.service';
import { ProductsService } from '../products/products.service';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly salesService: SalesService,
    private readonly productsService: ProductsService,
    private readonly customersService: CustomersService,
    private readonly expensesService: ExpensesService
  ) {}

  dashboard() {
    const sales = this.salesService.findAll();
    const products = this.productsService.findAll();
    const customers = this.customersService.findAll();
    const expenses = this.expensesService.findAll();

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      totals: {
        sales: totalSales,
        expenses: totalExpenses,
        margin: totalSales - totalExpenses,
        products: products.length,
        customers: customers.length
      },
      recentSales: sales.slice(-5)
    };
  }
}
