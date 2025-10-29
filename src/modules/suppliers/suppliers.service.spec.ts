import { SuppliersService } from './suppliers.service';

describe('SuppliersService', () => {
  it('should create supplier entries', () => {
    const service = new SuppliersService();
    const created = service.create({
      name: 'Proveedor Uno',
      taxId: 'PRU010203AA1',
      bank: 'Local Bank',
      account: '1234567890',
      credit: 1000
    });
    expect(service.findOne(created.id)?.name).toBe('Proveedor Uno');
  });
});
