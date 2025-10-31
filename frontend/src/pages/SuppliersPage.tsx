import { FormEvent, useState } from 'react';
import { useSuppliers } from '../hooks/useSuppliers';
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliersMutations';
import { useProteinCatalog } from '../hooks/useProteinCatalog';

export function SuppliersPage() {
  const { data, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const { data: catalog } = useProteinCatalog();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contact: '',
    clientName: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    rfcCurp: '',
    creditDays: '',
    proteinTypeId: '',
    proteinSubTypeId: ''
  });
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Empresa requerida');
    await createSupplier.mutateAsync({
      name: form.name,
      contact: form.contact || undefined,
      clientName: form.clientName || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      postalCode: form.postalCode || undefined,
      rfcCurp: form.rfcCurp || undefined,
      creditDays: form.creditDays ? Number(form.creditDays) : undefined,
      proteinTypeId: form.proteinTypeId || undefined,
      proteinSubTypeId: form.proteinSubTypeId || undefined
    });
    setForm({ name: '', contact: '', clientName: '', phone: '', whatsapp: '', email: '', address: '', city: '', state: '', postalCode: '', rfcCurp: '', creditDays: '', proteinTypeId: '', proteinSubTypeId: '' });
    setShowNew(false);
  };
  return (
    <div>
      <h2 className="module-title mb-4 text-2xl">Proveedores</h2>
      <div className="mb-4 flex items-center gap-2">
        <button className="rounded bg-primary px-3 py-2 text-white" onClick={() => setShowNew((v) => !v)}>
          {showNew ? 'Cerrar' : 'Nuevo Proveedor'}
        </button>
      </div>
      {showNew && (
        <form onSubmit={onSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-4">
          <input className="rounded border p-2" placeholder="Empresa" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Nombre de Contacto" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Nombre de Cliente" value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <input className="rounded border p-2" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input className="rounded border p-2 md:col-span-2" placeholder="Dirección" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Ciudad" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Estado" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
          <input className="rounded border p-2" placeholder="CP" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
          <input className="rounded border p-2" placeholder="RFC o CURP" value={form.rfcCurp} onChange={(e) => setForm((f) => ({ ...f, rfcCurp: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Días de crédito" value={form.creditDays} onChange={(e) => setForm((f) => ({ ...f, creditDays: e.target.value }))} />
          <select className="rounded border p-2" value={form.proteinTypeId} onChange={(e) => setForm((f) => ({ ...f, proteinTypeId: e.target.value, proteinSubTypeId: '' }))}>
            <option value="">Tipo de proteína</option>
            {catalog?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select className="rounded border p-2" value={form.proteinSubTypeId} onChange={(e) => setForm((f) => ({ ...f, proteinSubTypeId: e.target.value }))} disabled={!form.proteinTypeId}>
            <option value="">Subtipo</option>
            {catalog?.find((t) => t.id === form.proteinTypeId)?.subtypes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="md:col-span-4 text-right">
            <button className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50" disabled={createSupplier.isPending}>
              {createSupplier.isPending ? 'Guardando...' : 'Guardar'}
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
                <th className="px-4 py-3 text-left">Empresa</th>
                <th className="px-4 py-3 text-left">Nombre de Cliente</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">RFC/CURP</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">WhatsApp</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Dirección</th>
                <th className="px-4 py-3 text-left">Condición</th>
                <th className="px-4 py-3 text-right">Días crédito</th>
                <th className="px-4 py-3 text-left">Proteína</th>
                <th className="px-4 py-3 text-left">Subtipo</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((s) => (
                <>
                  <tr key={s.id} className="odd:bg-gray-50">
                    <td className="px-4 py-2">{s.name || '-'}</td>
                    <td className="px-4 py-2">{s.clientName ?? '-'}</td>
                    <td className="px-4 py-2">{s.contact ?? '-'}</td>
                    <td className="px-4 py-2">{s.rfcCurp ?? '-'}</td>
                    <td className="px-4 py-2">{s.phone ?? '-'}</td>
                    <td className="px-4 py-2">{s.whatsapp ?? '-'}</td>
                    <td className="px-4 py-2">{s.email ?? '-'}</td>
                    <td className="px-4 py-2">
                      {s.address ? `${s.address}${s.city ? ', ' + s.city : ''}${s.state ? ', ' + s.state : ''}${s.postalCode ? ' CP ' + s.postalCode : ''}` : '-'}
                    </td>
                    <td className="px-4 py-2 capitalize">{s.creditTerms ?? '-'}</td>
                    <td className="px-4 py-2 text-right">{s.creditDays ?? '-'}</td>
                    <td className="px-4 py-2 capitalize">{s.proteinType?.name ?? s.commercialInfo?.proteinTypeId ?? '-'}</td>
                    <td className="px-4 py-2 capitalize">{s.proteinSubType?.name ?? s.commercialInfo?.proteinSubTypeId ?? '-'}</td>
                    <td className="px-4 py-2 text-right">
                      <button className="rounded bg-primary px-2 py-1 text-white" onClick={() => { setEditingId(s.id); setEditForm(s); }}>Editar</button>
                    </td>
                  </tr>
                  {editingId === s.id && editForm && (
                    <tr>
                      <td colSpan={13} className="bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                          <input className="rounded border p-2" placeholder="Empresa" value={editForm.name || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, name: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Nombre de Cliente" value={editForm.clientName || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, clientName: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Contacto" value={editForm.contact || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, contact: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Teléfono" value={editForm.phone || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="WhatsApp" value={editForm.whatsapp || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, whatsapp: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Email" value={editForm.email || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, email: e.target.value }))} />
                          <input className="rounded border p-2 md:col-span-2" placeholder="Dirección" value={editForm.address || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, address: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Ciudad" value={editForm.city || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, city: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Estado" value={editForm.state || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, state: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="CP" value={editForm.postalCode || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, postalCode: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="RFC o CURP" value={editForm.rfcCurp || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, rfcCurp: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Días de crédito" value={editForm.creditDays ?? ''} onChange={(e) => setEditForm((f: any) => ({ ...f, creditDays: e.target.value }))} />
                          <div className="md:col-span-4 text-right space-x-2">
                            <button className="rounded bg-gray-200 px-3 py-2" onClick={() => { setEditingId(null); setEditForm(null); }}>Cancelar</button>
                            <button className="rounded bg-green-600 px-3 py-2 text-white" onClick={async () => {
                              await updateSupplier.mutateAsync({
                                id: s.id,
                                name: editForm.name,
                                clientName: editForm.clientName || undefined,
                                contact: editForm.contact || undefined,
                                phone: editForm.phone || undefined,
                                whatsapp: editForm.whatsapp || undefined,
                                email: editForm.email || undefined,
                                address: editForm.address || undefined,
                                city: editForm.city || undefined,
                                state: editForm.state || undefined,
                                postalCode: editForm.postalCode || undefined,
                                rfcCurp: editForm.rfcCurp || undefined,
                                creditDays: editForm.creditDays ? Number(editForm.creditDays) : undefined
                              });
                              setEditingId(null); setEditForm(null);
                            }}>Guardar cambios</button>
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
