import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useCreateSale } from '../hooks/useCreateSale';
import { SaleTicketLink } from '../services/pdf';
import { formatCurrency, numberToSpanishCurrencyWords } from '../utils/format';
import { useProteinCatalog } from '../hooks/useProteinCatalog';
// import { useProteinCatalog } from '../hooks/useCatalogs';
import { useAuthStore } from '../store/useAuthStore';
import { printSaleTicket } from '../services/thermal';

type Line = {
  productId?: string;
  unit: 'kg' | 'pz' | 'g' | 't';
  quantity: number;
  unitPrice: number;
  discountPct?: number; // 0-100
  // entradas de texto para evitar pérdidas como "1." al escribir
  quantityInput?: string;
  unitPriceInput?: string;
  discountPctInput?: string;
  // soporte de captura por SKU
  skuInput?: string;
  lockBy?: 'sku' | 'product';
  proteinChoice?: '' | 'res' | 'pollo' | 'cerdo' | 'pescado' | 'varios';
};

export function SalesPage() {
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  // const { data: catalog } = useProteinCatalog();
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

  const { data: catalog } = useProteinCatalog();
  // Helpers de clasificación de proteína
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const getTypeName = (p: any): string => {
    const direct = p?.proteinType?.name || p?.category || (p as any)?.protein_type?.name || '';
    if (direct) return direct;
    const sid = p?.proteinSubType?.id || (p as any)?.proteinSubTypeId || (p as any)?.protein_sub_type_id;
    if (sid && catalog) {
      const t = catalog.find(tt => tt.subtypes.some(sb => sb.id === sid));
      if (t?.name) return t.name;
    }
    const tid = p?.proteinType?.id || (p as any)?.proteinTypeId || (p as any)?.protein_type_id;
    if (tid && catalog) {
      const t = catalog.find(tt => tt.id === tid);
      if (t?.name) return t.name;
    }
    // Inferir por nombre del producto como último recurso
    const name = (p?.name || '').toString();
    const n = normalize(name);
    if (n.includes('pollo')) return 'POLLO';
    if (n.includes('res') || n.includes('bovino') || n.includes('vacuno')) return 'RES';
    if (n.includes('cerdo') || n.includes('porcino')) return 'CERDO';
    if (n.includes('pescado') || n.includes('pez') || n.includes('mar')) return 'PESCADO';
    return '';
  };
  const getTypeSlug = (p: any): string => {
    const name = normalize(getTypeName(p));
    if (name.includes('pollo')) return 'pollo';
    if (name.includes('res') || name.includes('bovino') || name.includes('vacuno')) return 'res';
    if (name.includes('cerdo') || name.includes('porcino')) return 'cerdo';
    if (name.includes('pescado') || name.includes('pez') || name.includes('mar')) return 'pescado';
    return name || '';
  };

  // Formateo con separador de miles por comas (ej: 12,345.67)
  const formatWithCommas = (value: string | number) => {
    const str = String(value ?? '');
    if (!str) return '';
    const parts = str.replace(/,/g, '').split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decPart = parts.length > 1 ? '.' + parts[1] : '';
    return intPart + decPart;
  };

  const addLine = () => {
    const p = undefined as any;
    setLines((prev) => [
      ...prev,
      {
        unit: 'kg',
        productId: undefined,
        quantity: 1,
        unitPrice: 0,
        discountPct: 0,
        quantityInput: '1',
        unitPriceInput: '0',
        discountPctInput: '0',
        skuInput: '',
        lockBy: undefined,
        proteinChoice: ''
      }
    ]);
  };

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const total = useMemo(() => lines.reduce((acc, l) => {
    const base = (l.unitPrice || 0) * (l.quantity || 0);
    const disc = Math.max(0, Math.min(100, l.discountPct || 0));
    const amount = base - (base * disc) / 100;
    return acc + Math.max(0, amount);
  }, 0), [lines]);

  // Al seleccionar cliente, si es de crédito, autoseleccionar método y calcular vencimiento por días de crédito
  useEffect(() => {
    if (!customerId) return;
    const c = customers?.find((cc) => cc.id === customerId);
    if (!c) return;
    // Si el cliente es de crédito, auto-seleccionar método crédito
    if ((c.customerType as any) === 'credito') {
      if (paymentMethod !== 'credito') setPaymentMethod('credito');
    }
    // Calcular vencimiento al seleccionar cliente si aplica
    if (paymentMethod === 'credito') {
      const days = Number(c.creditDays || 0);
      if (days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setCreditDueDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setCreditDueDate('');
      }
    }
  }, [customerId, customers]);

  // Si el usuario cambia a crédito manualmente, intentar autocalcular vencimiento con los días del cliente seleccionado
  useEffect(() => {
    if (paymentMethod !== 'credito') {
      setCreditDueDate('');
      return;
    }
    const c = customerId ? customers?.find((cc) => cc.id === customerId) : undefined;
    const days = Number(c?.creditDays || 0);
    if (days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setCreditDueDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setCreditDueDate('');
    }
  }, [paymentMethod, customerId, customers]);

  const onSubmit = async () => {
    if (!lines.length) return alert('Agrega al menos un producto');
    // Autocompletar precio desde el producto y validar importes
    const payloadItems = lines
      .filter((l) => l.productId)
      .map((l) => {
        const p = products?.find((pp) => pp.id === l.productId);
        const unitPrice = l.unitPrice && l.unitPrice > 0 ? l.unitPrice : (p?.price ?? 0);
        const quantity = l.quantity;
        const base = unitPrice * quantity;
        const discountPct = Math.max(0, Math.min(100, l.discountPct || 0));
        const discount = (base * discountPct) / 100;
        return { productId: l.productId!, quantity, unitPrice, discount };
      })
      .filter((i) => i.productId && i.quantity > 0 && i.unitPrice > 0);
    if (!payloadItems.length) return alert('Selecciona al menos un producto válido');
    const anyZero = payloadItems.some((i) => (i.unitPrice * i.quantity - (i.discount ?? 0)) <= 0);
    if (anyZero) return alert('Hay líneas con importe cero o negativo. Revisa precio, cantidad y descuento.');
    try {
      const amountInWords = numberToSpanishCurrencyWords(total);
      const sale = await createSale.mutateAsync({ customerId, paymentMethod, notes: notes || undefined, creditDueDate: creditDueDate || undefined, items: payloadItems, amountInWords });
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
          const label = (p?.sku ? `${p?.sku} - ` : '') + (p?.name || 'Producto');
          return { product: label, quantity: l.quantity, price: l.unitPrice };
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

  // Auto-descargar la factura (XLSM) al crear la venta
  useEffect(() => {
    if (!invoiceUrl) return;
    try {
      const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api') as string;
      const apiOrigin = apiBase.replace(/\/api\/?$/, '');
      const href = invoiceUrl.startsWith('http') ? invoiceUrl : apiOrigin + invoiceUrl;
      const a = document.createElement('a');
      a.href = href;
      a.download = href.split('/').pop() || 'Factura.xlsm';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {}
    // Evitar múltiples descargas
    const t = setTimeout(() => setInvoiceUrl(null), 500);
    return () => clearTimeout(t);
  }, [invoiceUrl]);

  return (
    <div className="space-y-4 uppercase">
      <h2 className="module-title text-2xl">VENTAS</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">CLIENTE</label>
          <select value={customerId ?? ''} onChange={(e) => setCustomerId(e.target.value || undefined)} className="mt-1 w-full rounded border p-2">
            <option value="">MOSTRADOR (CONTADO)</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">MÉTODO DE PAGO</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="mt-1 w-full rounded border p-2">
            <option value="efectivo">EFECTIVO</option>
            <option value="transferencia">TRANSFERENCIA</option>
            <option value="credito">CRÉDITO</option>
            <option value="tarjeta">TARJETA</option>
            <option value="otro">OTRO</option>
          </select>
        </div>
        {paymentMethod === 'credito' && (
          <div>
            <label className="block text-sm font-medium">VENCE</label>
            <input type="date" value={creditDueDate} disabled className="mt-1 w-full rounded border p-2 bg-gray-100 text-gray-700" />
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-primary/10 text-primary uppercase">
            <tr>
              <th className="px-4 py-3 text-left">PRODUCTO</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-right">CANTIDAD</th>
              <th className="px-4 py-3 text-left">U.M.</th>
              <th className="px-4 py-3 text-right">PRECIO ($)</th>
              <th className="px-4 py-3 text-right">DESCUENTO (%)</th>
              <th className="px-4 py-3 text-right">IMPORTE</th>
              <th className="px-4 py-3 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => {
              return (
              <tr key={idx} className="odd:bg-gray-50">
                <td className="px-4 py-2">
                  <div className="flex gap-2 items-start">
                    <select
                      className="rounded border p-1 text-sm uppercase"
                      value={l.proteinChoice || ''}
                      disabled={l.lockBy === 'sku'}
                      onChange={(e) => {
                        const val = e.target.value as Line['proteinChoice'];
                        setLines(prev => prev.map((x,i)=> i===idx ? { ...x, proteinChoice: val || '', productId: undefined, skuInput: x.lockBy==='sku'?x.skuInput:'' } : x));
                      }}
                    >
                      <option value="">PROTEÍNA / VARIOS</option>
                      <option value="pescado">PESCADO</option>
                      <option value="res">RES</option>
                      <option value="pollo">POLLO</option>
                      <option value="cerdo">CERDO</option>
                      <option value="varios">VARIOS</option>
                    </select>
                    <select
                      value={l.productId || ''}
                      disabled={l.lockBy === 'sku' || !(l.proteinChoice)}
                      onChange={(e) => {
                        const p = products?.find((p) => p.id === e.target.value);
                        setLines((prev) => prev.map((x, i) => (i === idx ? {
                          ...x,
                          productId: e.target.value || undefined,
                          unitPrice: (p?.price ?? 0),
                          unitPriceInput: formatWithCommas(p?.price ?? 0),
                          unit: (p?.unit as any) === 'pz' ? 'pz' : ((p?.unit as any) === 'g' ? 'g' : ((p?.unit as any) === 't' ? 't' : 'kg')),
                          skuInput: p?.sku || '',
                          lockBy: e.target.value ? 'product' : undefined,
                          proteinChoice: (p ? ((['res','pollo','cerdo','pescado'].includes(getTypeSlug(p)) ? getTypeSlug(p) : 'varios') as any) : x.proteinChoice)
                        } : x)));
                      }}
                      className="w-full rounded border p-1 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="">{l.proteinChoice ? 'SELECCIONE' : 'ELIJA CATEGORÍA'}</option>
                      {(() => {
                        const known = ['res','pollo','cerdo','pescado'];
                        const choice = (l.proteinChoice || '').toLowerCase();
                        const filtered = (products || []).filter((p) => {
                          const slug = getTypeSlug(p);
                          if (!choice) return false;
                          if (choice === 'varios') return !known.includes(slug || '');
                          return slug === choice;
                        });
                        if (!filtered.length) {
                          return [<option key="__empty" value="" disabled>SIN PRODUCTOS EN ESTA CATEGORÍA</option>];
                        }
                        return filtered.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ));
                      })()}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    placeholder="ESCANEAR O ESCRIBIR SKU"
                    value={l.skuInput ?? ''}
                    disabled={l.lockBy === 'product'}
                    onChange={(e) => {
                      const text = e.target.value;
                      setLines((prev) => prev.map((x, i) => {
                        if (i !== idx) return x;
                        // Buscar coincidencia exacta por SKU (case-insensitive)
                        const skuNorm = text.trim();
                        let next = { ...x, skuInput: text } as Line;
                        if (skuNorm) {
                          const match = (products || []).find(p => (p.sku || '').toLowerCase() === skuNorm.toLowerCase());
                          if (match) {
                            next.productId = match.id;
                            next.unitPrice = match.price ?? 0;
                            next.unitPriceInput = formatWithCommas(match.price ?? 0);
                            next.unit = (match.unit as any) === 'pz' ? 'pz' : ((match.unit as any) === 'g' ? 'g' : ((match.unit as any) === 't' ? 't' : 'kg'));
                            next.lockBy = 'sku';
                            const slug = getTypeSlug(match);
                            next.proteinChoice = (['res','pollo','cerdo','pescado'].includes(slug) ? slug : 'varios') as any;
                          } else {
                            // si no hay match, no bloqueamos
                            if (next.lockBy === 'sku') next.lockBy = undefined;
                          }
                        } else {
                          // Campo vacío: liberar bloqueo si venía de SKU
                          if (next.lockBy === 'sku') next.lockBy = undefined;
                        }
                        return next;
                      }));
                    }}
                    className="w-40 rounded border p-1 disabled:bg-gray-100 disabled:text-gray-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        // Al presionar Enter, enfocar cantidad de la misma fila para agilizar
                        const qtyInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-role="qty-input"]'));
                        if (qtyInputs[idx]) qtyInputs[idx].focus();
                      }
                    }}
                  />
                  {(() => {
                    const p = (products || []).find(pp => pp.id === l.productId);
                    return p?.name ? (<div className="mt-1 text-[10px] text-gray-500">{p.name}</div>) : null;
                  })()}
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="text"
                    inputMode="decimal"
                    lang="en-US"
                    placeholder="0.00"
                    value={l.quantityInput ?? String(l.quantity ?? '')}
                    onChange={(e) => {
                      const text = e.target.value;
                      setLines((prev) => prev.map((x, i) => {
                        if (i !== idx) return x;
                        const normalized = text.replace(/,/g, '.');
                        const n = parseFloat(normalized);
                        // Autollenar precio si está en 0 y hay producto seleccionado
                        let unitPrice = x.unitPrice;
                        if ((unitPrice ?? 0) <= 0 && x.productId) {
                          const p = products?.find(pp => pp.id === x.productId);
                          if (p) unitPrice = p.price;
                        }
                        if (!isNaN(n) && n >= 0) {
                          return { ...x, quantityInput: text, quantity: n, unitPrice };
                        }
                        return { ...x, quantityInput: text, unitPrice };
                      }));
                    }}
                    className="w-24 rounded border p-1 text-right"
                    data-role="qty-input"
                  />
                  <div className="text-[10px] text-gray-500">{l.unit === 'kg' ? 'KG' : l.unit === 'g' ? 'GR' : l.unit === 't' ? 'TON' : 'PZ'}</div>
                </td>
                <td className="px-4 py-2">
                  <select className="rounded border p-1 text-sm uppercase" value={l.unit} onChange={(e)=> setLines(prev => prev.map((x,i)=> i===idx?{...x, unit: e.target.value as any }:x))}>
                    <option value="kg">KG</option>
                    <option value="pz">PZ</option>
                    <option value="g">GR</option>
                    <option value="t">TON</option>
                  </select>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-gray-500">$</span>
                    <input
                    type="text"
                    inputMode="decimal"
                    lang="en-US"
                    placeholder="0.00"
                    value={l.unitPriceInput ?? formatWithCommas(l.unitPrice ?? '')}
                    onChange={(e) => {
                      const text = e.target.value;
                      // Mantener solo dígitos y un punto decimal
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      const parts = cleaned.split('.');
                      const intRaw = parts[0] || '';
                      const decRaw = parts.length > 1 ? parts[1].replace(/\./g, '') : '';
                      const formatted = formatWithCommas(intRaw + (parts.length > 1 ? '.' + decRaw : ''));
                      const numeric = parseFloat((intRaw || '0') + (parts.length > 1 ? '.' + decRaw : ''));
                      setLines((prev) => prev.map((x, i) => {
                        if (i !== idx) return x;
                        if (!isNaN(numeric)) return { ...x, unitPriceInput: formatted, unitPrice: numeric };
                        return { ...x, unitPriceInput: formatted };
                      }));
                    }}
                    className="w-24 rounded border p-1 text-right"
                  />
                  </div>
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="text"
                    inputMode="decimal"
                    lang="en-US"
                    placeholder="0.00"
                    value={l.discountPctInput ?? String(l.discountPct ?? 0)}
                    onChange={(e) => {
                      const text = e.target.value;
                      const normalized = text.replace(/,/g, '.');
                      const v = parseFloat(normalized);
                      setLines((prev) => prev.map((x, i) => {
                        if (i !== idx) return x;
                        if (!isNaN(v) && v >= 0) return { ...x, discountPctInput: text, discountPct: v };
                        return { ...x, discountPctInput: text };
                      }));
                    }}
                    className="w-24 rounded border p-1 text-right"
                  />
                </td>
                <td className="px-4 py-2 text-right">{(() => { const base = (l.unitPrice || 0) * (l.quantity || 0); const disc = Math.max(0, Math.min(100, l.discountPct || 0)); return formatCurrency(Math.max(0, base - (base * disc)/100)); })()}</td>
                <td className="px-4 py-2 text-right">
                  <button className="rounded bg-red-500 px-2 py-1 text-white uppercase" onClick={() => removeLine(idx)}>
                    QUITAR
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button className="rounded bg-primary px-3 py-2 text-white disabled:opacity-50 uppercase" onClick={addLine} disabled={!products?.length}>
          AGREGAR PRODUCTO
        </button>
        <div className="text-right">
          <label className="block text-sm font-medium">NOTAS</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-96 rounded border p-2" />
          <div className="mt-2 text-xl font-bold">TOTAL: {formatCurrency(total)}</div>
        </div>
      </div>
      <div className="text-right">
        <button
          className="rounded bg-green-600 px-4 py-2 font-semibold text-white disabled:opacity-50 uppercase"
          disabled={createSale.isPending || !lines.length}
          onClick={onSubmit}
        >
          {createSale.isPending ? 'GUARDANDO...' : 'FINALIZAR VENTA'}
        </button>
        {recentSale && (
          <div className="mt-2 inline-flex items-center gap-2">
            <button
              className="rounded bg-gray-800 px-3 py-1 text-xs font-semibold text-white uppercase"
              onClick={() => {
                try {
                    const items = (recentSale.items || []).map((it: any) => ({
                    name: (it.product?.sku ? `${it.product.sku} - ` : '') + (it.product?.name || it.productId),
                    qty: Number(it.quantity) || 0,
                    unit: it.product?.unit || 'pz',
                    price: Number(it.unitPrice) || 0,
                    total: Number(it.lineTotal) || 0
                  }));
                  const mapUnit = (u: string | undefined) => (u === 'kg' ? 'KG' : u === 'g' ? 'GR' : u === 't' ? 'TON' : 'PZ');
                  printSaleTicket({
                    folio: (recentSale.id || '').slice(0, 8),
                    date: new Date(recentSale.createdAt || Date.now()),
                    storeName: 'Cuerámaro Prime',
                    vendor: user?.name,
                    customer: recentSale.customer?.name || 'Mostrador',
                    items: items.map(it => ({ ...it, unit: mapUnit(it.unit as any) })),
                    total: Number(recentSale.total) || 0,
                    paymentMethod: recentSale.paymentMethod
                  });
                } catch (e) {
                  alert('No se pudo imprimir el ticket');
                }
              }}
            >
              IMPRIMIR TICKET
            </button>
          </div>
        )}
        {invoiceUrl && (() => {
          const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api') as string;
          const apiOrigin = apiBase.replace(/\/api\/?$/, '');
          const href = invoiceUrl.startsWith('http') ? invoiceUrl : apiOrigin + invoiceUrl;
          return (
            <div className="mt-2 text-sm uppercase">
              <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">DESCARGAR FORMATO (XLSM)</a>
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
                  <div className="text-xs text-gray-500">CLIENTE</div>
                  <div className="font-semibold">{c.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">TELÉFONO CELULAR</div>
                  <div>{c.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">DIRECCIÓN</div>
                  <div>{c.businessAddress || c.personalAddress || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">TIPO / DÍAS / LÍMITE</div>
                  <div className="uppercase">{c.customerType || 'CONTADO'} · {c.creditDays ?? 0} · {formatCurrency(c.creditLimit ?? 0)}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
