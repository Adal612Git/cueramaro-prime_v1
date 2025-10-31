import { FormEvent, useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomersMutations';

export function CustomersPage() {
  const { data, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    whatsapp: '',
    email: '',
    personalAddress: '',
    personalPostalCode: '',
    businessAddress: '',
    businessPostalCode: '',
    rfcCurp: '',
    customerType: 'contado' as 'contado' | 'credito',
    creditDays: '',
    creditLimit: ''
  });
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Nombre requerido');
    const cd = form.creditDays ? parseInt(form.creditDays, 10) : undefined;
    const customerType = cd && cd > 0 ? 'credito' : form.customerType;
    await createCustomer.mutateAsync({
      name: form.name,
      businessName: form.businessName || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      personalAddress: form.personalAddress || undefined,
      personalPostalCode: form.personalPostalCode || undefined,
      businessAddress: form.businessAddress || undefined,
      businessPostalCode: form.businessPostalCode || undefined,
      rfcCurp: form.rfcCurp || undefined,
      customerType,
      creditDays: cd,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined
    });
    setForm({ name: '', businessName: '', phone: '', whatsapp: '', email: '', personalAddress: '', personalPostalCode: '', businessAddress: '', businessPostalCode: '', rfcCurp: '', customerType: 'contado', creditDays: '', creditLimit: '' });
    setShowNew(false);
  };
  return (
    <div>
      <h2 className="module-title mb-4 text-2xl">Clientes</h2>
      <div className="mb-4 flex items-center gap-2">
        <button className="rounded bg-primary px-3 py-2 text-white" onClick={() => setShowNew((v) => !v)}>
          {showNew ? 'Cerrar' : 'Nuevo Cliente'}
        </button>
      </div>
      {showNew && (
        <form onSubmit={onSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-4">
          <input className="rounded border p-2" placeholder="Nombre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Negocio" value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Teléfono Celular" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <input className="rounded border p-2" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input className="rounded border p-2 md:col-span-2" placeholder="Dirección (personal)" value={form.personalAddress} onChange={(e) => setForm((f) => ({ ...f, personalAddress: e.target.value }))} />
          <input className="rounded border p-2" placeholder="CP (personal)" value={form.personalPostalCode} onChange={(e) => setForm((f) => ({ ...f, personalPostalCode: e.target.value }))} />
          <input className="rounded border p-2" placeholder="CP (negocio)" value={form.businessPostalCode} onChange={(e) => setForm((f) => ({ ...f, businessPostalCode: e.target.value }))} />
          <input className="rounded border p-2 md:col-span-2" placeholder="Dirección (negocio)" value={form.businessAddress} onChange={(e) => setForm((f) => ({ ...f, businessAddress: e.target.value }))} />
          <input className="rounded border p-2" placeholder="RFC/CURP" value={form.rfcCurp} onChange={(e) => setForm((f) => ({ ...f, rfcCurp: e.target.value }))} />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm">Tipo:</label>
              <select className="rounded border p-2" value={form.customerType} onChange={(e) => setForm((f) => ({ ...f, customerType: e.target.value as any }))} disabled={(Number(form.creditDays) || 0) > 0}>
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
            <input type="number" min={0} step={1} className="rounded border p-2" placeholder="Días de crédito" value={form.creditDays}
              onChange={(e) => {
                const val = e.target.value;
                // Sólo enteros positivos
                const onlyInt = val === '' ? '' : String(Math.max(0, parseInt(val || '0', 10)));
                setForm((f) => ({ ...f, creditDays: onlyInt }));
              }}
            />
          </div>
          <input className="rounded border p-2" placeholder="Límite de crédito" value={form.creditLimit} onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))} />
          <div className="md:col-span-4 text-right">
            <button className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50" disabled={createCustomer.isPending}>
              {createCustomer.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="overflow-auto rounded-xl bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Negocio</th>
                <th className="px-4 py-3 text-left">RFC/CURP</th>
                <th className="px-4 py-3 text-left">Teléfono Celular</th>
                <th className="px-4 py-3 text-left">WhatsApp</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Dirección</th>
                <th className="px-4 py-3 text-left">CP</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-right">Días</th>
                <th className="px-4 py-3 text-right">Límite</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((c) => (
                <>
                  <tr key={c.id} className="odd:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{c.code != null ? `C-${String(c.code).padStart(6,'0')}` : c.id.slice(-8)}</td>
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2">{c.businessName ?? '-'}</td>
                    <td className="px-4 py-2">{c.rfcCurp ?? '-'}</td>
                    <td className="px-4 py-2">{c.phone ?? '-'}</td>
                    <td className="px-4 py-2">{c.whatsapp ?? '-'}</td>
                    <td className="px-4 py-2">{c.email ?? '-'}</td>
                    <td className="px-4 py-2">{c.businessAddress ?? c.personalAddress ?? '-'}</td>
                    <td className="px-4 py-2">{(c as any).businessPostalCode ?? (c as any).personalPostalCode ?? '-'}</td>
                    <td className="px-4 py-2 capitalize">{c.customerType ?? '-'}</td>
                    <td className="px-4 py-2 text-right">{c.creditDays ?? '-'}</td>
                    <td className="px-4 py-2 text-right">{c.creditLimit != null ? formatCurrency(c.creditLimit) : '-'}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className="rounded bg-primary px-2 py-1 text-white"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditForm({
                            name: c.name || '',
                            businessName: c.businessName || '',
                            phone: c.phone || '',
                            whatsapp: c.whatsapp || '',
                            email: c.email || '',
                            personalAddress: c.personalAddress || '',
                            businessAddress: c.businessAddress || '',
                            rfcCurp: c.rfcCurp || '',
                            creditDays: c.creditDays?.toString() || '',
                            creditLimit: c.creditLimit?.toString() || ''
                          });
                        }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                  {editingId === c.id && (
                    <tr>
                      <td colSpan={12} className="bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                          <input className="rounded border p-2" placeholder="Nombre" value={editForm.name} onChange={(e) => setEditForm((f: any) => ({ ...f, name: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Negocio" value={editForm.businessName} onChange={(e) => setEditForm((f: any) => ({ ...f, businessName: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Teléfono Celular" value={editForm.phone} onChange={(e) => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="WhatsApp" value={editForm.whatsapp} onChange={(e) => setEditForm((f: any) => ({ ...f, whatsapp: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm((f: any) => ({ ...f, email: e.target.value }))} />
                          <input className="rounded border p-2 md:col-span-2" placeholder="Dirección (personal)" value={editForm.personalAddress} onChange={(e) => setEditForm((f: any) => ({ ...f, personalAddress: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="CP (personal)" value={editForm.personalPostalCode || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, personalPostalCode: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="CP (negocio)" value={editForm.businessPostalCode || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, businessPostalCode: e.target.value }))} />
                          <input className="rounded border p-2 md:col-span-2" placeholder="Dirección (negocio)" value={editForm.businessAddress} onChange={(e) => setEditForm((f: any) => ({ ...f, businessAddress: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="RFC/CURP" value={editForm.rfcCurp} onChange={(e) => setEditForm((f: any) => ({ ...f, rfcCurp: e.target.value }))} />
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-sm">Tipo:</label>
                              <select className="rounded border p-2" value={editForm.customerType || 'contado'} onChange={(e) => setEditForm((f: any) => ({ ...f, customerType: e.target.value }))} disabled={(Number(editForm.creditDays) || 0) > 0}>
                                <option value="contado">Contado</option>
                                <option value="credito">Crédito</option>
                              </select>
                            </div>
                            <input type="number" min={0} step={1} className="rounded border p-2" placeholder="Días de crédito" value={editForm.creditDays}
                              onChange={(e) => {
                                const val = e.target.value;
                                const onlyInt = val === '' ? '' : String(Math.max(0, parseInt(val || '0', 10)));
                                setEditForm((f: any) => ({ ...f, creditDays: onlyInt }));
                              }}
                            />
                          </div>
                          <input className="rounded border p-2" placeholder="Límite de crédito" value={editForm.creditLimit} onChange={(e) => setEditForm((f: any) => ({ ...f, creditLimit: e.target.value }))} />
                          <div className="md:col-span-4 text-right space-x-2">
                            <button className="rounded bg-gray-200 px-3 py-2" onClick={() => { setEditingId(null); setEditForm(null); }}>Cancelar</button>
                            <button
                              className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50"
                              onClick={async () => {
                                await updateCustomer.mutateAsync({
                                  id: c.id,
                                  name: editForm.name,
                                  businessName: editForm.businessName || undefined,
                                  phone: editForm.phone || undefined,
                                  whatsapp: editForm.whatsapp || undefined,
                                  email: editForm.email || undefined,
                                  personalAddress: editForm.personalAddress || undefined,
                                  personalPostalCode: editForm.personalPostalCode || undefined,
                                  businessAddress: editForm.businessAddress || undefined,
                                  businessPostalCode: editForm.businessPostalCode || undefined,
                                  rfcCurp: editForm.rfcCurp || undefined,
                                  customerType: (parseInt(editForm.creditDays || '0', 10) || 0) > 0 ? 'credito' : (editForm.customerType || 'contado'),
                                  creditDays: editForm.creditDays ? parseInt(editForm.creditDays, 10) : undefined,
                                  creditLimit: editForm.creditLimit ? Number(editForm.creditLimit) : undefined
                                });
                                setEditingId(null);
                                setEditForm(null);
                              }}
                            >
                              Guardar cambios
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
import { formatCurrency } from '../utils/format';
