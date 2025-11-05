import { InvoiceService } from '../src/invoice/invoice.service';

async function main() {
  const service = new InvoiceService();
  const sale: any = {
    id: 'cmhzz9999',
    paymentMethod: 'credito',
    createdAt: new Date().toISOString(),
    creditDueDate: new Date(Date.now() + 7*86400000).toISOString(),
    total: 1234.56,
    items: [
      { quantity: 2.5, productId: 'P1', unitPrice: 100, lineTotal: 250, product: { sku: 'SKU-1', unit: 'kg', name: 'Diezmillo' } },
      { quantity: 1, productId: 'P2', unitPrice: 984.56, lineTotal: 984.56, product: { sku: 'SKU-2', unit: 'pz', name: 'Costilla' } },
    ],
    customer: {
      name: 'Cliente Demo',
      businessAddress: 'Calle 123, Col. Centro',
      businessPostalCode: '36700',
      rfcCurp: 'XAXX010101000',
      phoneBusiness: '555-1234',
      code: 42,
      creditDays: 15,
    },
  };
  const out = await service.generateFromTemplate(sale, 'Vendedor Demo');
  console.log('Generado:', out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
