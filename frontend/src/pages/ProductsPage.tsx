import { useProducts } from '../hooks/useProducts';
import { useUpdateProductPrice } from '../hooks/useUpdateProductPrice';
import { useAuthStore } from '../store/useAuthStore';
import { useAdjustStock } from '../hooks/useAdjustStock';

export function ProductsPage() {
  const { data, isLoading } = useProducts();
  const updatePrice = useUpdateProductPrice();
  const adjustStock = useAdjustStock();
  const user = useAuthStore((s) => s.user);
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
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-text">Productos</h2>
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
