import { CxcService } from './cxc.service';

describe('CxcService', () => {
  it('should track receivable payments', () => {
    const service = new CxcService();
    const receivable = service.create({
      saleId: 'sale-1',
      balance: 300,
      dueDate: new Date().toISOString()
    });
    service.registerPayment(receivable.id, { amount: 100, note: 'Abono inicial' });
    expect(service.findAll()[0].paid).toBe(100);
  });
});
