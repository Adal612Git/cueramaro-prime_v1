import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useProteinCatalog } from '../hooks/useCatalogs';
import { useIngress } from '../hooks/useIngress';

export function IngresoPage() {
  const { data: products } = useProducts();
  const { data: catalog } = useProteinCatalog();
  const ingress = useIngress();
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState('');
  const [typeId, setTypeId] = useState('');
  const filtered = (products || []).filter((p) => (!typeId || p.proteinType?.id === typeId));
  const [selectedProductId, setSelectedProductId] = useState('');
  const [manualQty, setManualQty] = useState('');

  const onScannerIngress = async () => {
    const s = sku.trim();
    const q = Number(qty.replace(/,/g, '.'));
    if (!s) return alert('Escanee o ingrese SKU');
    if (!isFinite(q) || q <= 0) return alert('Cantidad inválida');
    try {
      await ingress.mutateAsync({ sku: s, quantity: q });
      setSku('');
      setQty('');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error de ingreso';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const onManualIngress = async () => {
    const pid = selectedProductId.trim();
    const q = Number(manualQty.replace(/,/g, '.'));
    if (!pid) return alert('Seleccione un producto');
    if (!isFinite(q) || q <= 0) return alert('Cantidad inválida');
    try {
      await ingress.mutateAsync({ productId: pid, quantity: q });
      setManualQty('');
      setSelectedProductId('');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error de ingreso';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="module-title text-2xl">Ingreso</h2>

      <section className="rounded-xl bg-white p-4 shadow">
        <h3 className="mb-2 font-semibold">Entrada por Scanner</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input className="rounded border p-2" placeholder="SKU / Código de barras" value={sku} onChange={(e) => setSku(e.target.value)} />
          <input className="rounded border p-2" placeholder="Cantidad" value={qty} onChange={(e) => setQty(e.target.value)} />
          <div className="md:col-span-2 text-right">
            <button className="rounded bg-primary px-3 py-2 text-white" onClick={onScannerIngress} disabled={ingress.isPending}>
              {ingress.isPending ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <h3 className="mb-2 font-semibold">Entrada Manual</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select className="rounded border p-2" value={typeId} onChange={(e) => { setTypeId(e.target.value); }}>
            <option value="">Proteína</option>
            {catalog?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select className="rounded border p-2" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
            <option value="">Producto</option>
            {filtered.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input className="rounded border p-2" placeholder="Cantidad" value={manualQty} onChange={(e) => setManualQty(e.target.value)} />
          <div className="text-right">
            <button className="rounded bg-primary px-3 py-2 text-white" onClick={onManualIngress} disabled={ingress.isPending}>
              {ingress.isPending ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
