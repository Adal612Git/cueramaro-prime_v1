import { FormEvent, useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { useCreateExpense } from '../hooks/useExpensesMutations';

export function ExpensesPage() {
  const { data, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ concept: '', description: '', amount: '', method: 'efectivo', isDeductible: false });
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number((form.amount || '').replace(/,/g, '.'));
    if (!form.description.trim() || !isFinite(amount) || amount < 0) return alert('Revisa los campos');
    await createExpense.mutateAsync({ concept: form.concept || undefined, description: form.description, amount, method: form.method as any, isDeductible: form.isDeductible });
    setForm({ concept: '', description: '', amount: '', method: 'efectivo', isDeductible: false });
    setShowNew(false);
  };
  const total = data?.reduce((acc, e) => acc + e.amount, 0) ?? 0;
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold text-text">Gastos</h2>
        <p className="text-sm text-secondary">Total: {formatCurrency(total)}</p>
      </div>
      <div className="mb-4">
        <button className="rounded bg-primary px-3 py-2 text-white" onClick={() => setShowNew((v) => !v)}>
          {showNew ? 'Cerrar' : 'Nuevo Gasto'}
        </button>
      </div>
      {showNew && (
        <form onSubmit={onSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-5">
          <input className="rounded border p-2" placeholder="Concepto" value={form.concept} onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))} />
          <input className="rounded border p-2 md:col-span-2" placeholder="Descripción" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Monto" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          <select className="rounded border p-2" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
            {['efectivo', 'transferencia', 'credito', 'tarjeta', 'otro'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 md:col-span-5">
            <input type="checkbox" checked={form.isDeductible} onChange={(e) => setForm((f) => ({ ...f, isDeductible: e.target.checked }))} />
            Deducible
          </label>
          <div className="md:col-span-5 text-right">
            <button className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50" disabled={createExpense.isPending}>
              {createExpense.isPending ? 'Guardando...' : 'Guardar gasto'}
            </button>
          </div>
        </form>
      )}
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((e) => (
                <tr key={e.id} className="odd:bg-gray-50">
                  <td className="px-4 py-2">{e.description}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(e.amount)}</td>
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
