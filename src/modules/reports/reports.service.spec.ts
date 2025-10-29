import { CustomersService } from '../customers/customers.service';
import { CustomerType } from '../customers/dto/create-customer.dto';
import { ExpensesService } from '../expenses/expenses.service';
import { ProductsService } from '../products/products.service';
import { SalesService } from '../sales/sales.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('should calculate dashboard totals', () => {
    const customers = new CustomersService();
    customers.create({ name: 'Dashboard Cliente', kind: CustomerType.RETAIL, creditLimit: 300 });
    const products = new ProductsService();
    products.create({
      name: 'Chuleta',
      category: 'Res',
      unit: 'kg',
      purchasePrice: 100,
      salePrice: 150,
      stock: 20,
      lotId: 'lot-1'
    });
    const sales = new SalesService();
    sales.create({
      customerId: 'Dashboard Cliente',
      total: 500,
      items: [{ productId: 'Chuleta', quantity: 5, price: 100 }]
    });
    const expenses = new ExpensesService();
    expenses.create({ concept: 'Luz', amount: 200 });

    const reports = new ReportsService(sales, products, customers, expenses);
    const dashboard = reports.dashboard();

    expect(dashboard.totals.sales).toBeGreaterThan(0);
    expect(dashboard.totals.expenses).toBe(200);
  });
});
