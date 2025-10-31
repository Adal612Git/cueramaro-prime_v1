import { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';

export function ReportsPage() {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const { data, isLoading, refetch } = useDashboardData({ from, to });
  return (
    <div className="space-y-6">
      <h2 className="module-title text-2xl">Reportes</h2>
      <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow">
        <div>
          <label className="block text-sm font-medium text-gray-600">Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border p-2" />
        </div>
        <button className="rounded bg-primary px-3 py-2 text-white" onClick={() => refetch()}>
          Aplicar
        </button>
        <button className="rounded bg-gray-200 px-3 py-2" onClick={() => { setFrom(''); setTo(''); refetch(); }}>
          Limpiar
        </button>
      </div>
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl bg-white p-5 shadow-md">
              <p className="text-sm font-semibold text-primary/80">Ventas (recientes)</p>
              <p className="mt-2 text-3xl font-bold text-text">{formatCurrency(data?.totals.sales ?? 0)}</p>
            </article>
            <article className="rounded-2xl bg-white p-5 shadow-md">
              <p className="text-sm font-semibold text-primary/80">Gastos</p>
              <p className="mt-2 text-3xl font-bold text-text">{formatCurrency(data?.totals.expenses ?? 0)}</p>
            </article>
            <article className="rounded-2xl bg-white p-5 shadow-md">
              <p className="text-sm font-semibold text-primary/80">Margen</p>
              <p className="mt-2 text-3xl font-bold text-text">{Math.round(((data?.totals.margin ?? 0) * 100))}%</p>
            </article>
            <article className="rounded-2xl bg-white p-5 shadow-md">
              <p className="text-sm font-semibold text-primary/80">Clientes</p>
              <p className="mt-2 text-3xl font-bold text-text">{data?.totals.customers ?? 0}</p>
            </article>
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-4 py-3 text-left">ID Venta</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentSales.map((s) => (
                  <tr key={s.id} className="odd:bg-gray-50">
                    <td className="px-4 py-2">{s.id}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(s.total)}</td>
                    <td className="px-4 py-2">{new Date(s.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
import { formatCurrency } from '../utils/format';
