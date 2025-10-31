import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useProteinCatalog } from '../hooks/useCatalogs';

export function IngresoPage() {
  const { data: products } = useProducts();
  const { data: catalog } = useProteinCatalog();
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState('');
  const [typeId, setTypeId] = useState('');
  const [subId, setSubId] = useState('');
  const filtered = (products || []).filter(
    (p) => (!typeId || p.proteinType?.id === typeId) && (!subId || p.proteinSubType?.id === subId)
  );
  const [selectedProductId, setSelectedProductId] = useState('');

  return (
    <div className="space-y-6">
      <h2 className="module-title text-2xl">Ingreso</h2>

      <section className="rounded-xl bg-white p-4 shadow">
        <h3 className="mb-2 font-semibold">Entrada por Scanner</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input className="rounded border p-2" placeholder="SKU / Código de barras" value={sku} onChange={(e) => setSku(e.target.value)} />
          <input className="rounded border p-2" placeholder="Cantidad" value={qty} onChange={(e) => setQty(e.target.value)} />
          <div className="md:col-span-2 text-right">
            <button className="rounded bg-primary px-3 py-2 text-white" disabled>
              Ingresar (próximamente)
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <h3 className="mb-2 font-semibold">Entrada Manual</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <select className="rounded border p-2" value={typeId} onChange={(e) => { setTypeId(e.target.value); setSubId(''); }}>
            <option value="">Proteína</option>
            {catalog?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select className="rounded border p-2" value={subId} onChange={(e) => setSubId(e.target.value)} disabled={!typeId}>
            <option value="">Subproteína</option>
            {catalog?.find((t) => t.id === typeId)?.subtypes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select className="rounded border p-2" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
            <option value="">Producto</option>
            {filtered.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input className="rounded border p-2" placeholder="Cantidad" />
          <div className="text-right">
            <button className="rounded bg-primary px-3 py-2 text-white" disabled>
              Agregar (próximamente)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

