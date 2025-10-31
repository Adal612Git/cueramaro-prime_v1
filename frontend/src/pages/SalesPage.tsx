import { useMemo, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useCreateSale } from '../hooks/useCreateSale';
import { SaleTicketLink } from '../services/pdf';
import { formatCurrency } from '../utils/format';

type Line = { productId: string; quantity: number; unitPrice: number; discount?: number };

export function SalesPage() {
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'credito' | 'tarjeta' | 'otro'>('efectivo');
  const [notes, setNotes] = useState('');
  const [creditDueDate, setCreditDueDate] = useState<string>('');
  const [lines, setLines] = useState<Line[]>([]);
  const [lastTicket, setLastTicket] = useState<null | { folio: string; customer?: string; total: number; items: { product: string; quantity: number; price: number }[] }>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const createSale = useCreateSale();

  const addLine = () => {
    if (!products?.length) {
      alert('No hay productos cargados. Ve a Productos para dar de alta o ingresar inventario.');
      return;
    }
    const p = products[0];
    setLines((prev) => [...prev, { productId: p.id, quantity: 1, unitPrice: p.price }]);
  };

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const total = useMemo(() => lines.reduce((acc, l) => acc + Math.max(0, l.unitPrice * l.quantity - (l.discount ?? 0)), 0), [lines]);

  const onSubmit = async () => {
    if (!lines.length) return alert('Agrega al menos un producto');
    try {
      const sale = await createSale.mutateAsync({ customerId, paymentMethod, notes: notes || undefined, creditDueDate: creditDueDate || undefined, items: lines });
      setLines([]);
      setNotes('');
      setCreditDueDate('');
      alert('Venta registrada');
      setInvoiceUrl(sale?.invoiceUrl ?? null);
      if (paymentMethod !== 'credito') {
        const items = lines.map((l) => {
          const p = products?.find((pp) => pp.id === l.productId);
          return { product: p?.name || 'Producto', quantity: l.quantity, price: l.unitPrice };
        });
        const cust = customers?.find((c) => c.id === customerId || '')?.name;
        setLastTicket({ folio: sale.id?.slice(0, 8) || '00000000', customer: cust, total, items });
      } else {
        setLastTicket(null);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Error al registrar la venta';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="module-title text-2xl">Ventas</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">Cliente</label>
          <select value={customerId ?? ''} onChange={(e) => setCustomerId(e.target.value || undefined)} className="mt-1 w-full rounded border p-2">
            <option value="">Mostrador (contado)</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Método de pago</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="mt-1 w-full rounded border p-2">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="credito">Crédito</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        {paymentMethod === 'credito' && (
          <div>
            <label className="block text-sm font-medium">Vence</label>
            <input type="date" value={creditDueDate} onChange={(e) => setCreditDueDate(e.target.value)} className="mt-1 w-full rounded border p-2" />
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-primary/10 text-primary">
            <tr>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Descuento</th>
              <th className="px-4 py-3 text-right">Importe</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => (
              <tr key={idx} className="odd:bg-gray-50">
                <td className="px-4 py-2">
                  <select
                    value={l.productId}
                    onChange={(e) => {
                      const p = products?.find((p) => p.id === e.target.value);
                      setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, productId: e.target.value, unitPrice: p?.price ?? x.unitPrice } : x)));
                    }}
                    className="w-full rounded border p-1"
                  >
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={l.quantity}
                    onChange={(e) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x)))}
                    className="w-24 rounded border p-1 text-right"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={l.unitPrice}
                    onChange={(e) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value) } : x)))}
                    className="w-24 rounded border p-1 text-right"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={l.discount ?? 0}
                    onChange={(e) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, discount: Number(e.target.value) } : x)))}
                    className="w-24 rounded border p-1 text-right"
                  />
                </td>
                <td className="px-4 py-2 text-right">{formatCurrency(Math.max(0, l.unitPrice * l.quantity - (l.discount ?? 0)))}</td>
                <td className="px-4 py-2 text-right">
                  <button className="rounded bg-red-500 px-2 py-1 text-white" onClick={() => removeLine(idx)}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button className="rounded bg-primary px-3 py-2 text-white disabled:opacity-50" onClick={addLine} disabled={!products?.length}>
          Agregar producto
        </button>
        <div className="text-right">
          <label className="block text-sm font-medium">Notas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-96 rounded border p-2" />
          <div className="mt-2 text-xl font-bold">Total: {formatCurrency(total)}</div>
        </div>
      </div>
      <div className="text-right">
        <button
          className="rounded bg-green-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          disabled={createSale.isPending || !lines.length}
          onClick={onSubmit}
        >
          {createSale.isPending ? 'Guardando...' : 'Finalizar venta'}
        </button>
        {invoiceUrl && (
          <div className="mt-2 text-sm">
            <a href={invoiceUrl} target="_blank" rel="noreferrer" className="text-primary underline">Descargar Formato (XLSM)</a>
          </div>
        )}
        {lastTicket && (
          <div className="mt-2 text-sm">
            <SaleTicketLink {...lastTicket} />
          </div>
        )}
      </div>
    </div>
  );
}
