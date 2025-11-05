import { FormEvent, useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomersMutations';

export function CustomersPage() {
  const { data, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    whatsapp: '',
    phonePersonal: '',
    whatsappPersonal: '',
    phoneBusiness: '',
    whatsappBusiness: '',
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
  // Formateo con separador de miles por comas (ej: 12,345.67)
  const formatWithCommas = (value: string | number) => {
    const str = String(value ?? '');
    if (!str) return '';
    const parts = str.replace(/,/g, '').split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decPart = parts.length > 1 ? '.' + parts[1] : '';
    return intPart + decPart;
  };
  const getCP = (obj: any): string | undefined => {
    const candidates = [
      'businessPostalCode','personalPostalCode','postalCode','cp','zip','zipCode','businessZip','personalZip',
      'business_postal_code','personal_postal_code','postal_code','zip_code','cp_negocio','cp_personal','codigoPostal','codigo_postal'
    ];
    const probe = (source: any): string | undefined => {
      if (!source || typeof source !== 'object') return undefined;
      for (const k of candidates) {
        const v = source?.[k];
        if (v != null && String(v).trim() !== '') return String(v);
      }
      return undefined;
    };
    // Direct keys on root
    const root = probe(obj);
    if (root) return root;
    // Nested address objects
    const nestedKeys = ['businessAddress','personalAddress','address','direccion','domicilio'];
    for (const nk of nestedKeys) {
      const candidate = obj?.[nk];
      if (candidate && typeof candidate === 'object') {
        const got = probe(candidate);
        if (got) return got;
      }
      if (candidate && typeof candidate === 'string') {
        // Extraer cualquier bloque de 2 a 6 dígitos, priorizando 5
        const s = String(candidate);
        const m5 = s.match(/\b(\d{5})\b/);
        if (m5 && m5[1]) return m5[1];
        const mAny = s.match(/\b(\d{2,6})\b/);
        if (mAny && mAny[1]) return mAny[1];
      }
    }
    return undefined;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Nombre requerido');
    const cd = form.creditDays ? parseInt(form.creditDays, 10) : undefined;
    const customerType = cd && cd > 0 ? 'credito' : form.customerType;
    const postalCode = form.businessPostalCode || form.personalPostalCode || undefined;
    await createCustomer.mutateAsync({
      name: form.name,
      businessName: form.businessName || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      phonePersonal: form.phonePersonal || undefined,
      whatsappPersonal: form.whatsappPersonal || undefined,
      phoneBusiness: form.phoneBusiness || undefined,
      whatsappBusiness: form.whatsappBusiness || undefined,
      email: form.email || undefined,
      personalAddress: form.personalAddress || undefined,
      personalPostalCode: form.personalPostalCode || undefined,
      businessAddress: form.businessAddress || undefined,
      businessPostalCode: form.businessPostalCode || undefined,
      postalCode,
      rfcCurp: form.rfcCurp || undefined,
      customerType,
      creditDays: form.customerType === 'credito' ? cd : undefined,
      creditLimit: form.customerType === 'credito' && form.creditLimit ? Number(String(form.creditLimit).replace(/,/g, '')) : undefined
    });
    setForm({ name: '', businessName: '', phone: '', whatsapp: '', phonePersonal: '', whatsappPersonal: '', phoneBusiness: '', whatsappBusiness: '', email: '', personalAddress: '', personalPostalCode: '', businessAddress: '', businessPostalCode: '', rfcCurp: '', customerType: 'contado', creditDays: '', creditLimit: '' });
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
          <input className="rounded border p-2" placeholder="Teléfono/WhatsApp Personal (TEL)" value={form.phonePersonal} onChange={(e) => setForm((f) => ({ ...f, phonePersonal: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Teléfono/WhatsApp Personal (WA)" value={form.whatsappPersonal} onChange={(e) => setForm((f) => ({ ...f, whatsappPersonal: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Teléfono/WhatsApp Negocio (TEL)" value={form.phoneBusiness} onChange={(e) => setForm((f) => ({ ...f, phoneBusiness: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Teléfono/WhatsApp Negocio (WA)" value={form.whatsappBusiness} onChange={(e) => setForm((f) => ({ ...f, whatsappBusiness: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input className="rounded border p-2 md:col-span-2" placeholder="Dirección (personal)" value={form.personalAddress} onChange={(e) => setForm((f) => ({ ...f, personalAddress: e.target.value }))} />
          <input className="rounded border p-2" placeholder="CP (personal)" value={form.personalPostalCode} onChange={(e) => setForm((f) => ({ ...f, personalPostalCode: e.target.value }))} />
          <input className="rounded border p-2" placeholder="CP (negocio)" value={form.businessPostalCode} onChange={(e) => setForm((f) => ({ ...f, businessPostalCode: e.target.value }))} />
          <input className="rounded border p-2 md:col-span-2" placeholder="Dirección (negocio)" value={form.businessAddress} onChange={(e) => setForm((f) => ({ ...f, businessAddress: e.target.value }))} />
          <input className="rounded border p-2" placeholder="RFC/CURP" value={form.rfcCurp} onChange={(e) => setForm((f) => ({ ...f, rfcCurp: e.target.value }))} />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm">Tipo:</label>
              <select className="rounded border p-2" value={form.customerType} onChange={(e) => setForm((f) => ({ ...f, customerType: e.target.value as any, creditDays: e.target.value === 'contado' ? '' : f.creditDays, creditLimit: e.target.value === 'contado' ? '' : f.creditLimit }))} disabled={(Number(form.creditDays) || 0) > 0}>
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
            {form.customerType === 'credito' && (
              <input type="number" min={0} step={1} className="rounded border p-2" placeholder="Días de crédito" value={form.creditDays}
                onChange={(e) => {
                  const val = e.target.value;
                  // Sólo enteros positivos
                  const onlyInt = val === '' ? '' : String(Math.max(0, parseInt(val || '0', 10)));
                  setForm((f) => ({ ...f, creditDays: onlyInt }));
                }}
              />
            )}
          </div>
          {form.customerType === 'credito' && (
            <input
              className="rounded border p-2 text-right"
              placeholder="Límite de crédito"
              value={form.creditLimit}
              onChange={(e) => {
                const text = e.target.value;
                const cleaned = text.replace(/[^0-9.]/g, '');
                const parts = cleaned.split('.');
                const intRaw = parts[0] || '';
                const decRaw = parts.length > 1 ? parts[1].replace(/\./g, '') : '';
                const formatted = formatWithCommas(intRaw + (parts.length > 1 ? '.' + decRaw : ''));
                setForm((f) => ({ ...f, creditLimit: formatted }));
              }}
            />
          )}
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
        <div className="overflow-auto max-h-[75vh] rounded-xl bg-white shadow">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-primary/10 text-primary sticky top-0 z-10">
              <tr>
                <th className="px-2 md:px-4 py-3 text-left hidden md:table-cell">ID</th>
                <th className="px-2 md:px-4 py-3 text-left">Cliente</th>
                <th className="px-2 md:px-4 py-3 text-left">Negocio</th>
                <th className="px-2 md:px-4 py-3 text-left hidden lg:table-cell">RFC/CURP</th>
                <th className="px-2 md:px-4 py-3 text-left hidden sm:table-cell">TEL. PERSONAL</th>
                <th className="px-2 md:px-4 py-3 text-left hidden xl:table-cell">WA PERSONAL</th>
                <th className="px-2 md:px-4 py-3 text-left">TEL. NEGOCIO</th>
                <th className="px-2 md:px-4 py-3 text-left hidden lg:table-cell">WA NEGOCIO</th>
                <th className="px-2 md:px-4 py-3 text-left hidden lg:table-cell">Email</th>
                <th className="px-2 md:px-4 py-3 text-left hidden xl:table-cell">Dirección</th>
                <th className="px-2 md:px-4 py-3 text-left">CP</th>
                <th className="px-2 md:px-4 py-3 text-left">Tipo</th>
                <th className="px-2 md:px-4 py-3 text-right">Días</th>
                <th className="px-2 md:px-4 py-3 text-right">Límite</th>
                <th className="px-2 md:px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((c) => (
                <>
                  <tr key={c.id} className="odd:bg-gray-50">
                    <td className="px-2 md:px-4 py-2 font-mono text-xs hidden md:table-cell">{c.code != null ? `CU${String(c.code).padStart(6,'0')}` : c.id.slice(-8)}</td>
                    <td className="px-2 md:px-4 py-2 whitespace-nowrap">{c.name}</td>
                    <td className="px-2 md:px-4 py-2 max-w-[200px] truncate" title={c.businessName ?? ''}>{c.businessName ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2 hidden lg:table-cell">{c.rfcCurp ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2 hidden sm:table-cell">{(c as any).phonePersonal ?? c.phone ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2 hidden xl:table-cell">{(c as any).whatsappPersonal ?? c.whatsapp ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2">{(c as any).phoneBusiness ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2 hidden lg:table-cell">{(c as any).whatsappBusiness ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2 hidden lg:table-cell truncate max-w-[220px]" title={c.email ?? ''}>{c.email ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2 hidden xl:table-cell truncate max-w-[280px]" title={(c.businessAddress ?? c.personalAddress ?? '') as string}>{c.businessAddress ?? c.personalAddress ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2">{getCP(c) ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2 uppercase">{c.customerType ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2 text-right">{c.creditDays ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2 text-right whitespace-nowrap">{c.creditLimit != null ? formatCurrency(c.creditLimit) : '-'}</td>
                    <td className="px-2 md:px-4 py-2 text-right space-x-2 whitespace-nowrap">
                      <button
                        className="rounded bg-primary px-2 py-1 text-white"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditForm({
                            name: c.name || '',
                            businessName: c.businessName || '',
                            phone: c.phone || '',
                            whatsapp: c.whatsapp || '',
                            phonePersonal: (c as any).phonePersonal || '',
                            whatsappPersonal: (c as any).whatsappPersonal || '',
                            phoneBusiness: (c as any).phoneBusiness || '',
                            whatsappBusiness: (c as any).whatsappBusiness || '',
                            email: c.email || '',
                            personalAddress: c.personalAddress || '',
                            businessAddress: c.businessAddress || '',
                            rfcCurp: c.rfcCurp || '',
                            creditDays: c.creditDays?.toString() || '',
                            creditLimit: c.creditLimit?.toString() || '',
                            personalPostalCode: (c as any).personalPostalCode || (c as any).personalZip || (c as any).postalCode || (c as any).cp || '',
                            businessPostalCode: (c as any).businessPostalCode || (c as any).businessZip || (c as any).postalCode || (c as any).cp || ''
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="rounded bg-secondary px-2 py-1 text-white"
                        onClick={() => setExpandedId((v) => (v === c.id ? null : c.id))}
                      >
                        {expandedId === c.id ? 'Ocultar detalle' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <ReceivablesRow customerId={c.id} paymentInputs={paymentInputs} setPaymentInputs={setPaymentInputs} />
                  )}
                  {editingId === c.id && (
                    <tr>
                      <td colSpan={12} className="bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                          <input className="rounded border p-2" placeholder="Nombre" value={editForm.name} onChange={(e) => setEditForm((f: any) => ({ ...f, name: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Negocio" value={editForm.businessName} onChange={(e) => setEditForm((f: any) => ({ ...f, businessName: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Teléfono/WhatsApp Personal (TEL)" value={editForm.phonePersonal || editForm.phone || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, phonePersonal: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Teléfono/WhatsApp Personal (WA)" value={editForm.whatsappPersonal || editForm.whatsapp || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, whatsappPersonal: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Teléfono/WhatsApp Negocio (TEL)" value={editForm.phoneBusiness || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, phoneBusiness: e.target.value }))} />
                          <input className="rounded border p-2" placeholder="Teléfono/WhatsApp Negocio (WA)" value={editForm.whatsappBusiness || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, whatsappBusiness: e.target.value }))} />
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
                                const postalCode = editForm.businessPostalCode || editForm.personalPostalCode || undefined;
                                await updateCustomer.mutateAsync({
                                  id: c.id,
                                  name: editForm.name,
                                  businessName: editForm.businessName || undefined,
                                  phone: editForm.phone || undefined,
                                  whatsapp: editForm.whatsapp || undefined,
                                  phonePersonal: editForm.phonePersonal || undefined,
                                  whatsappPersonal: editForm.whatsappPersonal || undefined,
                                  phoneBusiness: editForm.phoneBusiness || undefined,
                                  whatsappBusiness: editForm.whatsappBusiness || undefined,
                                  email: editForm.email || undefined,
                                  personalAddress: editForm.personalAddress || undefined,
                                  personalPostalCode: editForm.personalPostalCode || undefined,
                                  businessAddress: editForm.businessAddress || undefined,
                                  businessPostalCode: editForm.businessPostalCode || undefined,
                                  postalCode,
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

import { useCustomerReceivables, useAddPayment } from '../hooks/useCustomerReceivables';

function ReceivablesRow({ customerId, paymentInputs, setPaymentInputs }: { customerId: string; paymentInputs: Record<string, string>; setPaymentInputs: (fn: (s: Record<string,string>)=>Record<string,string>) => void }) {
  const { data, isLoading, refetch } = useCustomerReceivables(customerId);
  const addPayment = useAddPayment();
  const formatWithCommas = (value: string | number) => {
    const str = String(value ?? '');
    if (!str) return '';
    const parts = str.replace(/,/g, '').split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decPart = parts.length > 1 ? '.' + parts[1] : '';
    return intPart + decPart;
  };
  if (isLoading) return (
    <tr>
      <td colSpan={12} className="bg-white p-4 text-sm">Cargando detalle...</td>
    </tr>
  );
  const items = data?.items || [];
  return (
    <tr>
      <td colSpan={12} className="bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <span className="mr-4">Deudas: <strong>{data?.debts ?? 0}</strong></span>
            <span>Saldo total: <strong>{formatCurrency(data?.totalDue ?? 0)}</strong></span>
          </div>
          <button className="rounded bg-gray-200 px-2 py-1" onClick={() => refetch()}>Refrescar</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-4 py-3 text-left">Folio</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Vence</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Pagado</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-right">Abonar</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? items.map((s) => {
                const overdue = !!(s.creditDueDate && new Date(s.creditDueDate).getTime() < Date.now() && (s.due || 0) > 0);
                return (
                <tr key={s.id} className={`odd:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2 font-mono text-xs">{s.folio}</td>
                  <td className="px-4 py-2">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    {s.creditDueDate ? (
                      <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                        {new Date(s.creditDueDate).toLocaleDateString()} {overdue ? ' · VENCIDA' : ''}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2 text-right">{formatCurrency(s.total)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(s.paidAmount)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(s.due)}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <input
                        className="w-28 rounded border p-1 text-right"
                        placeholder="$ ABONO"
                        value={paymentInputs[s.id] ?? ''}
                        onChange={(e) => {
                          const text = e.target.value;
                          const cleaned = text.replace(/[^0-9.]/g, '');
                          const parts = cleaned.split('.');
                          const intRaw = parts[0] || '';
                          const decRaw = parts.length > 1 ? parts[1].replace(/\./g, '') : '';
                          const formatted = formatWithCommas(intRaw + (parts.length > 1 ? '.' + decRaw : ''));
                          setPaymentInputs((st) => ({ ...st, [s.id]: formatted }));
                        }}
                      />
                      <button
                        className="rounded bg-green-600 px-2 py-1 text-white disabled:opacity-50"
                        disabled={addPayment.isPending}
                        onClick={async () => {
                          const raw = paymentInputs[s.id];
                          const v = Number(String(raw || '').replace(/,/g, ''));
                          if (!isFinite(v) || v <= 0) return alert('Monto inválido');
                          if (v > (s.due || 0)) return alert('El abono excede el saldo');
                          try {
                            await addPayment.mutateAsync({ saleId: s.id, amount: v });
                            setPaymentInputs((st) => ({ ...st, [s.id]: '' }));
                            await refetch();
                          } catch (e: any) {
                            const msg = e?.response?.data?.message || e?.message || 'No se pudo registrar el abono';
                            alert(Array.isArray(msg) ? msg.join(', ') : msg);
                          }
                        }}
                      >
                        {addPayment.isPending ? 'Aplicando...' : 'Abonar'}
                      </button>
                    </div>
                  </td>
                </tr>
              )}) : (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Sin deudas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}
