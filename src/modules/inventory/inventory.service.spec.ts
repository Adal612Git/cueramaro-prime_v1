import { InventoryService } from './inventory.service';
import { LotStatus } from './dto/create-lot.dto';

describe('InventoryService', () => {
  it('should register lots', () => {
    const service = new InventoryService();
    const lot = service.create({
      productId: 'product-1',
      supplierId: 'supplier-1',
      weight: 50,
      entryDate: new Date().toISOString(),
      status: LotStatus.AVAILABLE
    });
    expect(service.findAll()).toContainEqual(expect.objectContaining({ id: lot.id }));
  });
});
