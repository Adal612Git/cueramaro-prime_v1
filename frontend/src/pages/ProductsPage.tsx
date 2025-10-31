import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useUpdateProductPrice } from '../hooks/useUpdateProductPrice';
import { useAuthStore } from '../store/useAuthStore';
import { useAdjustStock } from '../hooks/useAdjustStock';
import { useProteinCatalog } from '../hooks/useProteinCatalog';
import api from '../services/api';

export function ProductsPage() {
  const { data, isLoading } = useProducts();
  const updatePrice = useUpdateProductPrice();
  const adjustStock = useAdjustStock();
  const user = useAuthStore((s) => s.user);
  const { data: catalog } = useProteinCatalog();
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<any>({ name: '', sku: '', price: '', unit: 'kg', proteinTypeId: '', proteinSubTypeId: '', initialQty: '' });
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
  const onCreateProduct = async () => {
    if (!newForm.name.trim()) return alert('Nombre requerido');
    const price = Number(newForm.price);
    if (!isFinite(price) || price < 0) return alert('Precio inválido');
    const payload: any = {
      name: newForm.name,
      sku: newForm.sku || undefined,
      price,
      unit: newForm.unit,
      proteinTypeId: newForm.proteinTypeId || undefined,
      proteinSubTypeId: newForm.proteinSubTypeId || undefined
    };
    const { data: p } = await api.post('/products', payload);
    if (newForm.initialQty) {
      const q = Number(newForm.initialQty);
      if (isFinite(q) && q !== 0) await adjustStock.mutateAsync({ id: p.id, quantity: q });
    }
    setShowNew(false);
    setNewForm({ name: '', sku: '', price: '', unit: 'kg', proteinTypeId: '', proteinSubTypeId: '', initialQty: '' });
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
          <input className="rounded border p-2" placeholder="Precio" value={newForm.price} onChange={(e) => setNewForm((f: any) => ({ ...f, price: e.target.value }))} />
          <select className="rounded border p-2" value={newForm.unit} onChange={(e) => setNewForm((f: any) => ({ ...f, unit: e.target.value }))}>
            <option value="kg">kg</option>
            <option value="pz">pz</option>
          </select>
          <select className="rounded border p-2" value={newForm.proteinTypeId} onChange={(e) => setNewForm((f: any) => ({ ...f, proteinTypeId: e.target.value, proteinSubTypeId: '' }))}>
            <option value="">Tipo</option>
            {catalog?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select className="rounded border p-2" value={newForm.proteinSubTypeId} onChange={(e) => setNewForm((f: any) => ({ ...f, proteinSubTypeId: e.target.value }))} disabled={!newForm.proteinTypeId}>
            <option value="">Subtipo</option>
            {catalog?.find((t: any) => t.id === newForm.proteinTypeId)?.subtypes.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input className="rounded border p-2" placeholder="Cantidad inicial" value={newForm.initialQty} onChange={(e) => setNewForm((f: any) => ({ ...f, initialQty: e.target.value }))} />
          <div className="md:col-span-6 text-right">
            <button className="rounded bg-green-600 px-3 py-2 text-white" onClick={onCreateProduct}>Guardar</button>
          </div>
        </div>
      )}
      <div className="mb-6 rounded-xl bg-white p-4 shadow">
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
              {data?.map((p) => (
                <tr key={p.id} className="odd:bg-gray-50">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.sku ?? '-'}</td>
                  <td className="px-4 py-2">{p.unit ?? '-'}</td>
                  <td className="px-4 py-2 capitalize">{p.proteinType?.name ?? p.category ?? '-'}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-2 text-right">{p.stock}</td>
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
