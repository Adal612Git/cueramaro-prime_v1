import { CustomersService } from './customers.service';
import { CustomerType } from './dto/create-customer.dto';

describe('CustomersService', () => {
  it('should register customers with credit limit', () => {
    const service = new CustomersService();
    const customer = service.create({
      name: 'Cliente Uno',
      kind: CustomerType.RETAIL,
      creditLimit: 500
    });
    expect(service.findOne(customer.id)?.creditLimit).toBe(500);
  });
});
