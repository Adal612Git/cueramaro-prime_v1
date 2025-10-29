import { ProductsService } from './products.service';

describe('ProductsService', () => {
  it('should manage product inventory', () => {
    const service = new ProductsService();
    const product = service.create({
      name: 'Carne Asada',
      category: 'Res',
      unit: 'kg',
      purchasePrice: 120,
      salePrice: 180,
      stock: 10,
      lotId: 'lote-1'
    });
    expect(service.findOne(product.id)?.salePrice).toBe(180);
  });
});
