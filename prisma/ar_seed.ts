import { PrismaClient, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Encuentra o crea un cliente de prueba con crédito
  const customer = await prisma.customer.findFirst({ where: { name: { contains: 'CLIENTE PRUEBA' } } }) ||
    await prisma.customer.create({ data: { name: 'CLIENTE PRUEBA', customerType: 'credito', creditDays: 15, creditLimit: 5000 } });

  // Busca algún producto existente
  const product = await prisma.product.findFirst();
  if (!product) throw new Error('Se requiere al menos un producto para poblar pruebas');

  // Crear 3 ventas a crédito con saldos (una de ellas atrasada)
  for (let i = 0; i < 3; i++) {
    const price = product.price;
    const qty = 2 + i;
    const total = price * qty;
    const sale = await prisma.sale.create({
      data: {
        customerId: customer.id,
        total,
        paidAmount: 0,
        paymentMethod: 'credito',
        creditDueDate: i === 2 ? new Date(Date.now() - 3 * 24 * 3600_000) : new Date(Date.now() + (7 + i * 5) * 24 * 3600_000),
        items: { create: [{ productId: product.id, quantity: qty, unitPrice: price, discount: 0, lineTotal: total }] }
      }
    });
    // Un abono parcial a la primera
    if (i === 0) {
      await prisma.payment.create({ data: { saleId: sale.id, amount: Math.round(total * 0.3 * 100) / 100, method: PaymentMethod.efectivo } });
      await prisma.sale.update({ where: { id: sale.id }, data: { paidAmount: Math.round(total * 0.3 * 100) / 100 } });
    }
  }

  console.log('AR seed listo');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
