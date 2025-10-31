import { useMemo, useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { formatCurrency } from '../utils/format';

export function ReportsPage() {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const { data, isLoading, refetch } = useDashboardData({ from, to });
  const applyRange = (start?: Date, end?: Date) => {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    if (start) setFrom(fmt(start));
    if (end) setTo(fmt(end));
    setTimeout(() => refetch(), 0);
  };
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);
  const startOfWeek = useMemo(() => {
    const d = new Date();
    const day = d.getDay(); // 0 dom ... 6 sab
    const diff = (day + 6) % 7; // lunes como inicio
    d.setDate(d.getDate() - diff);
    d.setHours(0,0,0,0);
    return d;
  }, []);
  const startOfMonth = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }, []);

  const exportCsv = () => {
    const rows = [
      ['id', 'total', 'fecha'],
      ...(data?.recentSales || []).map((s) => [s.id, String(s.total), new Date(s.createdAt).toISOString()])
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0,10);
    a.download = `reporte_${from || 'inicio'}_${to || stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      <h2 className="module-title text-2xl">Reportes</h2>
      <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow">
        <div className="flex items-center gap-2">
          <button className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20" onClick={() => applyRange(today, new Date())}>Día</button>
          <button className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20" onClick={() => applyRange(startOfWeek, new Date())}>Semana</button>
          <button className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20" onClick={() => applyRange(startOfMonth, new Date())}>Mes</button>
        </div>
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
        <div className="ml-auto">
          <button className="rounded bg-green-600 px-3 py-2 font-semibold text-white" onClick={exportCsv}>Exportar</button>
        </div>
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
