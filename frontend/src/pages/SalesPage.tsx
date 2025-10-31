import { useMemo, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useCreateSale } from '../hooks/useCreateSale';
import { SaleTicketLink } from '../services/pdf';
import { formatCurrency } from '../utils/format';
import { useProteinCatalog } from '../hooks/useCatalogs';
import { useAuthStore } from '../store/useAuthStore';
import { printSaleTicket } from '../services/thermal';

type Line = {
  mode: 'etiqueta' | 'pieza';
  barcode?: string;
  proteinTypeId?: string;
  proteinSubTypeId?: string;
  productId?: string;
  unit: 'kg' | 'pz';
  quantity: number;
  unitPrice: number;
  discount?: number;
};

export function SalesPage() {
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const { data: catalog } = useProteinCatalog();
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'credito' | 'tarjeta' | 'otro'>('efectivo');
  const [notes, setNotes] = useState('');
  const [creditDueDate, setCreditDueDate] = useState<string>('');
  const [lines, setLines] = useState<Line[]>([]);
  const [lastTicket, setLastTicket] = useState<null | { folio: string; customer?: string; total: number; items: { product: string; quantity: number; price: number }[] }>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [recentSale, setRecentSale] = useState<any>(null);
  const createSale = useCreateSale();
  const user = useAuthStore((s) => s.user);

  const firstMatchingProduct = (typeId?: string, subId?: string) => {
    const list = (products || []).filter(
      (p) => (!typeId || p.proteinType?.id === typeId) && (!subId || p.proteinSubType?.id === subId)
    );
    return list[0];
  };

  const addLine = () => {
    const p = products && products.length ? products[0] : undefined;
    setLines((prev) => [
      ...prev,
      {
        mode: 'pieza',
        unit: (p?.unit as any) === 'pz' ? 'pz' : 'kg',
        productId: p?.id,
        proteinTypeId: (p as any)?.proteinType?.id,
        proteinSubTypeId: (p as any)?.proteinSubType?.id,
        quantity: 1,
        unitPrice: p?.price ?? 0
      }
    ]);
  };

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const total = useMemo(() => lines.reduce((acc, l) => acc + Math.max(0, l.unitPrice * l.quantity - (l.discount ?? 0)), 0), [lines]);

  const onSubmit = async () => {
    if (!lines.length) return alert('Agrega al menos un producto');
    // Autocompletar precio desde el producto y validar importes
    const payloadItems = lines
      .filter((l) => l.productId)
      .map((l) => {
        const p = products?.find((pp) => pp.id === l.productId);
        const unitPrice = l.unitPrice && l.unitPrice > 0 ? l.unitPrice : (p?.price ?? 0);
        const quantity = l.quantity;
        let discount = l.discount ?? 0;
        const base = unitPrice * quantity;
        if (discount > base) discount = base;
        return { productId: l.productId!, quantity, unitPrice, discount };
      })
      .filter((i) => i.productId && i.quantity > 0 && i.unitPrice > 0);
    if (!payloadItems.length) return alert('Selecciona al menos un producto válido');
    const anyZero = payloadItems.some((i) => (i.unitPrice * i.quantity - (i.discount ?? 0)) <= 0);
    if (anyZero) return alert('Hay líneas con importe cero o negativo. Revisa precio, cantidad y descuento.');
    try {
      const sale = await createSale.mutateAsync({ customerId, paymentMethod, notes: notes || undefined, creditDueDate: creditDueDate || undefined, items: payloadItems });
      setLines([]);
      setNotes('');
      setCreditDueDate('');
      alert('Venta registrada');
      setInvoiceUrl(sale?.invoiceUrl ?? null);
      setRecentSale(sale);
      setCustomerId(undefined); // Limpia cliente para el siguiente proceso (vista efímera)
      if (paymentMethod !== 'credito') {
        const items = payloadItems.map((l) => {
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
              <th className="px-4 py-3 text-left">Modo</th>
              <th className="px-4 py-3 text-left">Proteína</th>
              <th className="px-4 py-3 text-left">Subproteína</th>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-left">U.M.</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Descuento</th>
              <th className="px-4 py-3 text-right">Importe</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => {
              const subtypes = catalog?.find(t => t.id === l.proteinTypeId)?.subtypes || [];
              const filteredProducts = products?.filter(p =>
                (!l.proteinTypeId || p.proteinType?.id === l.proteinTypeId) &&
                (!l.proteinSubTypeId || p.proteinSubType?.id === l.proteinSubTypeId)
              ) || [];
              return (
              <tr key={idx} className="odd:bg-gray-50">
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 text-xs"><input type="radio" checked={l.mode==='etiqueta'} onChange={() => setLines(prev => prev.map((x,i)=> i===idx?{...x, mode:'etiqueta'}:x))}/> Etiqueta</label>
                    <label className="flex items-center gap-1 text-xs"><input type="radio" checked={l.mode==='pieza'} onChange={() => setLines(prev => prev.map((x,i)=> i===idx?{...x, mode:'pieza'}:x))}/> Pieza</label>
                  </div>
                  {l.mode === 'etiqueta' && (
                    <input
                      className="mt-1 w-full rounded border p-1 text-xs"
                      placeholder="Escanea/Ingresa SKU"
                      value={l.barcode || ''}
                      onChange={(e) => {
                        const code = e.target.value;
                        setLines(prev => prev.map((x,i)=> i===idx?{...x, barcode: code}:x));
                        const p = products?.find(pp => (pp.sku || '').toLowerCase() === code.toLowerCase());
                        if (p) {
                          setLines(prev => prev.map((x,i)=> i===idx?{...x, productId: p.id, unitPrice: p.price, proteinTypeId: (p as any).proteinType?.id, proteinSubTypeId: (p as any).proteinSubType?.id, unit: (p.unit as any) === 'pz'?'pz':'kg'}:x));
                        }
                      }}
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  <select className="w-full rounded border p-1" value={l.proteinTypeId || ''} onChange={(e)=>{
                    const v = e.target.value || undefined;
                    const p = firstMatchingProduct(v, undefined);
                    setLines(prev => prev.map((x,i)=> {
                      if (i !== idx) return x;
                      if (p) {
                        return {
                          ...x,
                          proteinTypeId: v,
                          proteinSubTypeId: undefined,
                          productId: p.id,
                          unitPrice: p.price || 0,
                          unit: (p.unit as any) === 'pz' ? 'pz' : x.unit
                        };
                      }
                      return { ...x, proteinTypeId: v, proteinSubTypeId: undefined, productId: undefined, unitPrice: 0 };
                    }));
                  }}>
                    <option value="">Todas</option>
                    {catalog?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select className="w-full rounded border p-1" value={l.proteinSubTypeId || ''} onChange={(e)=>{
                    const v = e.target.value || undefined;
                    const p = firstMatchingProduct(l.proteinTypeId, v);
                    setLines(prev => prev.map((x,i)=> {
                      if (i !== idx) return x;
                      if (p) {
                        return {
                          ...x,
                          proteinSubTypeId: v,
                          productId: p.id,
                          unitPrice: p.price || 0,
                          unit: (p.unit as any) === 'pz' ? 'pz' : x.unit
                        };
                      }
                      return { ...x, proteinSubTypeId: v, productId: undefined, unitPrice: 0 };
                    }));
                  }}>
                    <option value="">Todas</option>
                    {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    value={l.productId || ''}
                    onChange={(e) => {
                      const p = products?.find((p) => p.id === e.target.value);
                      setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, productId: e.target.value || undefined, unitPrice: (p?.price ?? 0), unit: (p?.unit as any) === 'pz' ? 'pz' : 'kg' } : x)));
                    }}
                    className="w-full rounded border p-1"
                  >
                    <option value="">Seleccione</option>
                    {filteredProducts.map((p) => (
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
                    onChange={(e) => {
                      const newQty = Number(e.target.value);
                      setLines((prev) => prev.map((x, i) => {
                        if (i !== idx) return x;
                        // Autollenar precio si está en 0 y hay producto seleccionado
                        let unitPrice = x.unitPrice;
                        if ((unitPrice ?? 0) <= 0 && x.productId) {
                          const p = products?.find(pp => pp.id === x.productId);
                          if (p) unitPrice = p.price;
                        }
                        return { ...x, quantity: newQty, unitPrice };
                      }));
                    }}
                    className="w-24 rounded border p-1 text-right"
                  />
                  <div className="text-[10px] text-gray-500">{l.unit === 'kg' ? 'Kilogramos' : 'Piezas'}</div>
                </td>
                <td className="px-4 py-2">
                  <select className="rounded border p-1 text-sm" value={l.unit} onChange={(e)=> setLines(prev => prev.map((x,i)=> i===idx?{...x, unit: e.target.value as any }:x))}>
                    <option value="kg">kg</option>
                    <option value="pz">pz</option>
                  </select>
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={l.unitPrice}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, unitPrice: isFinite(v) && v >= 0 ? v : x.unitPrice } : x)));
                    }}
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
              );
            })}
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
        {recentSale && (
          <div className="mt-2 inline-flex items-center gap-2">
            <button
              className="rounded bg-gray-800 px-3 py-1 text-xs font-semibold text-white"
              onClick={() => {
                try {
                  const items = (recentSale.items || []).map((it: any) => ({
                    name: it.product?.name || it.productId,
                    qty: Number(it.quantity) || 0,
                    unit: it.product?.unit || 'pz',
                    price: Number(it.unitPrice) || 0,
                    total: Number(it.lineTotal) || 0
                  }));
                  printSaleTicket({
                    folio: (recentSale.id || '').slice(0, 8),
                    date: new Date(recentSale.createdAt || Date.now()),
                    storeName: 'Cuerámaro Prime',
                    vendor: user?.name,
                    customer: recentSale.customer?.name || 'Mostrador',
                    items,
                    total: Number(recentSale.total) || 0,
                    paymentMethod: recentSale.paymentMethod
                  });
                } catch (e) {
                  alert('No se pudo imprimir el ticket');
                }
              }}
            >
              Imprimir ticket
            </button>
          </div>
        )}
        {invoiceUrl && (() => {
          const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api') as string;
          const apiOrigin = apiBase.replace(/\/api\/?$/, '');
          const href = invoiceUrl.startsWith('http') ? invoiceUrl : apiOrigin + invoiceUrl;
          return (
            <div className="mt-2 text-sm">
              <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">Descargar Formato (XLSM)</a>
            </div>
          );
        })()}
        {lastTicket && (
          <div className="mt-2 text-sm">
            <SaleTicketLink {...lastTicket} />
          </div>
        )}
      </div>
      {customerId && (
        <div className="mt-4 rounded-xl bg-white p-4 shadow">
          {(() => {
            const c = customers?.find(cc => cc.id === customerId);
            if (!c) return null;
            return (
              <div className="grid gap-2 text-sm md:grid-cols-4">
                <div>
                  <div className="text-xs text-gray-500">Cliente</div>
                  <div className="font-semibold">{c.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Teléfono Celular</div>
                  <div>{c.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Dirección</div>
                  <div>{c.businessAddress || c.personalAddress || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Tipo / Días / Límite</div>
                  <div className="capitalize">{c.customerType || 'contado'} · {c.creditDays ?? 0} · {formatCurrency(c.creditLimit ?? 0)}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
