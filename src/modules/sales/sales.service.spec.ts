import { SalesService } from './sales.service';

describe('SalesService', () => {
  it('should create a sale with items', () => {
    const service = new SalesService();
    const sale = service.create({
      customerId: 'customer-1',
      total: 200,
      notes: 'Venta mostrador',
      items: [
        { productId: 'product-1', quantity: 2, price: 100 }
      ]
    });
    expect(sale.items).toHaveLength(1);
  });
});
