import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useUpdateProductPrice } from '../hooks/useUpdateProductPrice';
import { useAuthStore } from '../store/useAuthStore';
import { useAdjustStock } from '../hooks/useAdjustStock';
import { useProteinCatalog } from '../hooks/useProteinCatalog';
import { useSuppliers } from '../hooks/useSuppliers';
import api from '../services/api';

export function ProductsPage() {
  const { data, isLoading } = useProducts();
  const updatePrice = useUpdateProductPrice();
  const adjustStock = useAdjustStock();
  const user = useAuthStore((s) => s.user);
  const { data: catalog } = useProteinCatalog();
  const { data: suppliers } = useSuppliers();
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<any>({ name: '', sku: '', price: '', unit: 'kg', supplierId: '', proteinTypeId: '', proteinSubTypeId: '', initialQty: '' });
  const [scanner, setScanner] = useState<any>({ sku: '', qty: '' });
  const onEditPrice = (id: string, current: number) => {
    const value = typeof window !== 'undefined' ? window.prompt('Nuevo precio', current.toString()) : null;
    if (value == null) return;
    const price = Number(value.replace(/,/g, '.'));
    if (!isFinite(price) || price < 0) {
      alert('Precio inválido');
      return;
    }
    updatePrice.mutate({ id, price });
  };
  const onAdjustStock = (id: string) => {
    const value = typeof window !== 'undefined' ? window.prompt('Cantidad a ingresar (+)', '1') : null;
    if (value == null) return;
    const quantity = Number(value.replace(/,/g, '.'));
    if (!isFinite(quantity)) {
      alert('Cantidad inválida');
      return;
    }
    adjustStock.mutate({ id, quantity });
  };
  const VARIOS_ID = '__varios__';
  const onCreateProduct = async () => {
    if (!newForm.name.trim()) return alert('NOMBRE REQUERIDO');
    if (!newForm.proteinTypeId) return alert('PROTEÍNA O VARIOS REQUERIDO');
    const price = Number(newForm.price);
    if (!isFinite(price) || price < 0) return alert('PRECIO INVÁLIDO');
    // Pre-validar duplicado en cliente (insensible a mayúsculas)
    const desired = newForm.name.trim().toLowerCase();
    const dupLocal = (data || []).some((p) => (p.name || '').trim().toLowerCase() === desired);
    if (dupLocal) {
      alert(`No se puede duplicar nombre "${newForm.name.trim()}"`);
      return;
    }
    const isVarios = newForm.proteinTypeId === VARIOS_ID;
    const payload: any = {
      name: newForm.name,
      sku: newForm.sku || undefined,
      price,
      unit: newForm.unit,
      supplierId: newForm.supplierId || undefined,
      proteinTypeId: isVarios ? undefined : (newForm.proteinTypeId || undefined),
      proteinSubTypeId: isVarios ? undefined : (newForm.proteinSubTypeId || undefined),
      category: isVarios ? 'VARIOS' : undefined
    };
    // Compatibilidad: enviar snake_case por si el backend lo requiere
    if (!isVarios && newForm.proteinTypeId) payload.protein_type_id = newForm.proteinTypeId;
    if (!isVarios && newForm.proteinSubTypeId) payload.protein_sub_type_id = newForm.proteinSubTypeId;
    let p;
    try {
      const resp = await api.post('/products', payload);
      p = resp.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      if (typeof msg === 'string' && /existe|duplic/i.test(msg)) {
        alert(`No se puede duplicar nombre "${newForm.name.trim()}"`);
      } else {
        alert(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al crear producto'));
      }
      return;
    }
    if (newForm.initialQty) {
      const q = Number(newForm.initialQty);
      if (isFinite(q) && q !== 0) await adjustStock.mutateAsync({ id: p.id, quantity: q });
    }
    setShowNew(false);
    setNewForm({ name: '', sku: '', price: '', unit: 'kg', supplierId: '', proteinTypeId: '', proteinSubTypeId: '', initialQty: '' });
  };
  const onScannerEntry = async () => {
    const sku = scanner.sku.trim();
    const qty = Number(scanner.qty);
    if (!sku) return alert('Escanee o ingrese SKU');
    if (!isFinite(qty)) return alert('Cantidad inválida');
    const product = (data || []).find((p) => (p.sku || '').toLowerCase() === sku.toLowerCase());
    if (!product) {
      alert('Producto no encontrado por SKU');
      return;
    }
    await adjustStock.mutateAsync({ id: product.id, quantity: qty });
    setScanner({ sku: '', qty: '' });
  };
  return (
    <div>
      <h2 className="module-title mb-4 text-2xl">Productos</h2>
      {user?.role === 'ADMIN' && (
        <div className="mb-4 flex items-center gap-2">
          <button className="rounded bg-primary px-3 py-2 text-white" onClick={() => setShowNew((v) => !v)}>
            {showNew ? 'Cerrar' : 'Nuevo producto'}
          </button>
        </div>
      )}
      {showNew && (
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-6">
          <input className="rounded border p-2" placeholder="Nombre" value={newForm.name} onChange={(e) => setNewForm((f: any) => ({ ...f, name: e.target.value }))} />
          <input className="rounded border p-2" placeholder="SKU (opcional)" value={newForm.sku} onChange={(e) => setNewForm((f: any) => ({ ...f, sku: e.target.value }))} />
          <input className="rounded border p-2" placeholder="$ Precio" value={newForm.price} onChange={(e) => setNewForm((f: any) => ({ ...f, price: e.target.value }))} />
          <select className="rounded border p-2 uppercase" value={newForm.unit} onChange={(e) => setNewForm((f: any) => ({ ...f, unit: e.target.value }))}>
            <option value="kg">KG</option>
            <option value="pz">PZ</option>
            <option value="g">GR</option>
            <option value="t">TON</option>
          </select>
          <select className="rounded border p-2" value={newForm.supplierId} onChange={(e) => setNewForm((f: any) => ({ ...f, supplierId: e.target.value }))}>
            <option value="">Proveedor</option>
            {(suppliers || []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select className="rounded border p-2 uppercase" value={newForm.proteinTypeId} onChange={(e) => setNewForm((f: any) => ({ ...f, proteinTypeId: e.target.value, proteinSubTypeId: '' }))}>
            <option value="">PROTEÍNA / VARIOS</option>
            <option value="__varios__">VARIOS</option>
            {catalog?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {/* Se omite Subtipo al crear para simplificar */}
          <input className="rounded border p-2" placeholder="Cantidad inicial" value={newForm.initialQty} onChange={(e) => setNewForm((f: any) => ({ ...f, initialQty: e.target.value }))} />
          <div className="md:col-span-6 text-right">
            <button className="rounded bg-green-600 px-3 py-2 text-white" onClick={onCreateProduct}>Guardar</button>
          </div>
        </div>
      )}
      <div className="mb-6 rounded-xl bg-white p-4 shadow">
        <div className="mb-3 flex items-center gap-2">
          <input
            className="rounded border p-2 md:w-1/2"
            placeholder="Buscar por nombre, SKU, unidad, proteína, precio, stock o proveedor"
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
        </div>
        <h3 className="mb-2 font-semibold">Entrada por Scanner</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input className="rounded border p-2" placeholder="SKU / Código de barras" value={scanner.sku} onChange={(e) => setScanner((f: any) => ({ ...f, sku: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Cantidad (+)" value={scanner.qty} onChange={(e) => setScanner((f: any) => ({ ...f, qty: e.target.value }))} />
          <div className="md:col-span-2 text-right">
            <button className="rounded bg-primary px-3 py-2 text-white" onClick={onScannerEntry} disabled={adjustStock.isPending}>Ingresar</button>
          </div>
        </div>
      </div>
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Unidad</th>
                <th className="px-4 py-3 text-left">Proteína</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).filter((p) => {
                const q = query.trim().toLowerCase();
                if (!q) return true;
                const protein = (() => {
                  const direct = (p.proteinType?.name || p.category || '').toLowerCase();
                  if (direct) return direct;
                  const typeId = (p as any).proteinTypeId || (p.proteinType as any)?.id || (() => {
                    const sid = (p as any).proteinSubTypeId || (p.proteinSubType as any)?.id;
                    if (!sid) return undefined;
                    const t = (catalog || []).find(tt => tt.subtypes.some(sb => sb.id === sid));
                    return t?.id;
                  })();
                  if (typeId) {
                    const t = (catalog || []).find(tt => tt.id === typeId);
                    if (t?.name) return t.name.toLowerCase();
                  }
                  // Inferir por nombre del producto si coincide con alguna proteína
                  const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '').toLowerCase();
                  const nameNorm = normalize(p.name || '');
                  for (const t of (catalog || [])) {
                    const tNorm = normalize(t.name || '');
                    if (tNorm && nameNorm.includes(tNorm)) return (t.name || '').toLowerCase();
                  }
                  return '';
                })();
                const supplier = (p.supplier?.name || '').toLowerCase();
                const unit = (p.unit || '').toLowerCase();
                const priceNum = String(p.price ?? '');
                const priceFmt = formatCurrency(p.price).toLowerCase();
                const stockStr = String((p as any).stockQty != null ? (p as any).stockQty : p.stock ?? '');
                const haystack = [
                  (p.name || '').toLowerCase(),
                  (p.sku || '').toLowerCase(),
                  unit,
                  protein,
                  supplier,
                  priceNum,
                  priceFmt,
                  stockStr
                ].join(' ');
                return haystack.includes(q);
              }).map((p) => (
                <tr key={p.id} className="odd:bg-gray-50">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.sku ?? '-'}</td>
                  <td className="px-4 py-2">{p.unit === 'kg' ? 'KG' : p.unit === 'g' ? 'GR' : p.unit === 't' ? 'TON' : (p.unit === 'pz' ? 'PZ' : (p.unit ?? '-'))}</td>
                  <td className="px-4 py-2 uppercase">
                    {(() => {
                      const direct = p.proteinType?.name || p.category;
                      if (direct) return direct;
                      const sid = (p as any).proteinSubTypeId || (p.proteinSubType as any)?.id;
                      if (sid) {
                        const t = (catalog || []).find(tt => tt.subtypes.some(sb => sb.id === sid));
                        if (t?.name) return t.name;
                      }
                      const typeId = (p as any).proteinTypeId || (p.proteinType as any)?.id;
                      if (typeId) {
                        const t = (catalog || []).find(tt => tt.id === typeId);
                        if (t?.name) return t.name;
                      }
                      // Inferencia por nombre
                      const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '').toLowerCase();
                      const nameNorm = normalize(p.name || '');
                      for (const t of (catalog || [])) {
                        const tNorm = normalize(t.name || '');
                        if (tNorm && nameNorm.includes(tNorm)) return t.name;
                      }
                      return 'NA';
                    })()}
                  </td>
                  <td className="px-4 py-2 text-right">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-2 text-right">{(p as any).stockQty != null ? (p as any).stockQty : p.stock}</td>
                  <td className="px-4 py-2">{p.supplier?.name ?? '-'}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    {user?.role === 'ADMIN' && (
                      <button
                        className="rounded bg-primary px-3 py-1 text-white hover:bg-primary/90 disabled:opacity-50"
                        onClick={() => onEditPrice(p.id, p.price)}
                        disabled={updatePrice.isPending}
                      >
                        {updatePrice.isPending ? 'Guardando...' : 'Editar precio'}
                      </button>
                    )}
                    <button
                      className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700 disabled:opacity-50"
                      onClick={() => onAdjustStock(p.id)}
                      disabled={adjustStock.isPending}
                    >
                      {adjustStock.isPending ? 'Aplicando...' : 'Ingresar inventario'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
import { formatCurrency } from '../utils/format';
