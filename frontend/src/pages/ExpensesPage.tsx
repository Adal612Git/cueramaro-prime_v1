import { FormEvent, useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { useCreateExpense } from '../hooks/useExpensesMutations';

export function ExpensesPage() {
  const { data, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ concept: '', description: '', amount: '', method: 'efectivo', isDeductible: false });
  const [file, setFile] = useState<File | null>(null);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number((form.amount || '').replace(/,/g, '.'));
    if (!form.description.trim() || !isFinite(amount) || amount < 0) return alert('Revisa los campos');
    let attachmentUrl: string | undefined = undefined;
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      const { data: resp } = await (await import('../services/api')).default.post('/uploads/expenses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      attachmentUrl = resp.url;
    }
    await createExpense.mutateAsync({ concept: form.concept || undefined, description: form.description, amount, method: form.method as any, isDeductible: form.isDeductible, attachmentUrl });
    setForm({ concept: '', description: '', amount: '', method: 'efectivo', isDeductible: false });
    setFile(null);
    setShowNew(false);
  };
  const total = data?.reduce((acc, e) => acc + e.amount, 0) ?? 0;
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="module-title text-2xl">Gastos</h2>
        <p className="text-sm text-secondary">Total: {formatCurrency(total)}</p>
      </div>
      <div className="mb-4">
        <button className="rounded bg-primary px-3 py-2 text-white" onClick={() => setShowNew((v) => !v)}>
          {showNew ? 'Cerrar' : 'Nuevo Gasto'}
        </button>
      </div>
      {showNew && (
        <form onSubmit={onSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-6">
          <input className="rounded border p-2" placeholder="CONCEPTO" value={form.concept} onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))} />
          <input className="rounded border p-2 md:col-span-2" placeholder="DESCRIPCIÓN" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <input className="rounded border p-2" placeholder="$ MONTO" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          <select className="rounded border p-2 uppercase" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
            <option value="efectivo">EFECTIVO</option>
            <option value="transferencia">TRANSFERENCIA</option>
            <option value="credito">CRÉDITO</option>
            <option value="tarjeta">TARJETA</option>
            <option value="otro">OTRO</option>
          </select>
          <input type="file" accept="application/pdf,image/*" onChange={(e)=> setFile(e.target.files?.[0] || null)} className="rounded border p-2" />
          <label className="flex items-center gap-2 md:col-span-6">
            <input type="checkbox" checked={form.isDeductible} onChange={(e) => setForm((f) => ({ ...f, isDeductible: e.target.checked }))} />
            DEDUCIBLE
          </label>
          <div className="md:col-span-6 text-right">
            <button className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50 uppercase" disabled={createExpense.isPending}>
              {createExpense.isPending ? 'GUARDANDO...' : 'GUARDAR GASTO'}
            </button>
          </div>
        </form>
      )}
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-primary/10 text-primary uppercase">
              <tr>
                <th className="px-4 py-3 text-left">DESCRIPCIÓN</th>
                <th className="px-4 py-3 text-right">MONTO</th>
                <th className="px-4 py-3 text-left">MÉTODO</th>
                <th className="px-4 py-3 text-left">DEDUCIBLE</th>
                <th className="px-4 py-3 text-left">ARCHIVO</th>
                <th className="px-4 py-3 text-left">FECHA</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((e) => (
                <tr key={e.id} className="odd:bg-gray-50">
                  <td className="px-4 py-2">{e.description}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(e.amount)}</td>
                  <td className="px-4 py-2">{(e.method || '').toString().toUpperCase() || '-'}</td>
                  <td className="px-4 py-2">{e.isDeductible ? 'SÍ' : 'NO'}</td>
                  <td className="px-4 py-2">{e.attachmentUrl ? (() => {
                    const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api') as string;
                    const apiOrigin = apiBase.replace(/\/?api\/?$/, '');
                    const href = e.attachmentUrl.startsWith('http') ? e.attachmentUrl : (apiOrigin + e.attachmentUrl);
                    return (<a className="text-primary underline" href={href} target="_blank" rel="noreferrer">VER ARCHIVO</a>);
                  })() : '-'}</td>
                  <td className="px-4 py-2">{new Date(e.createdAt).toLocaleString()}</td>
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
