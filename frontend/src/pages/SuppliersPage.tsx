import { FormEvent, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useSuppliers } from '../hooks/useSuppliers';
import { useProducts } from '../hooks/useProducts';
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliersMutations';
import { useProteinCatalog } from '../hooks/useProteinCatalog';

export function SuppliersPage() {
  const { data, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const { data: catalog } = useProteinCatalog();
  const { data: allProducts } = useProducts();
  const [showNew, setShowNew] = useState(false);
  const [openProductsId, setOpenProductsId] = useState<string | null>(null);
  const [editLines, setEditLines] = useState<{ typeId: string; subTypeId: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    contact: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    rfcCurp: '',
    creditDays: '',
    acquisitionMethod: 'entrega_domicilio' as 'punto_recoleccion' | 'entrega_domicilio',
    // pares tipo/subtipo controlados por UI con "+"
    lines: [] as { typeId: string; subTypeId: string }[],
    proteinTypeIds: [] as string[],
    proteinSubTypeIds: [] as string[]
  });
  const VARIOS_ID = '__varios__';
  const typeOptions = useMemo(() => {
    const base = catalog || [];
    return [...base, { id: VARIOS_ID, name: 'Varios', subtypes: [] } as any];
  }, [catalog]);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Empresa requerida');
    // Construir arrays únicos basados en las líneas seleccionadas
    const typeSet = new Set<string>();
    const subTypeSet = new Set<string>();
    let hasVarios = false;
    const variosProductIds = new Set<string>();
    for (const ln of form.lines) {
      if (ln.typeId === VARIOS_ID) hasVarios = true;
      if (ln.typeId && ln.typeId !== VARIOS_ID) typeSet.add(ln.typeId);
      if (ln.subTypeId) {
        if (ln.typeId === VARIOS_ID) variosProductIds.add(ln.subTypeId);
        else subTypeSet.add(ln.subTypeId);
      }
    }
    await createSupplier.mutateAsync({
      name: form.name,
      contact: form.contact || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      postalCode: form.postalCode || undefined,
      rfcCurp: form.rfcCurp || undefined,
      creditDays: form.creditDays ? Number(form.creditDays) : undefined,
      acquisitionMethod: form.acquisitionMethod as any,
      // multiselección vía commercialInfo (el backend lo guarda ahí)
      proteinTypeIds: Array.from(typeSet),
      proteinSubTypeIds: Array.from(subTypeSet),
      commercialInfo: { varios: hasVarios, proteinTypeIds: Array.from(typeSet), proteinSubTypeIds: Array.from(subTypeSet), variosProductIds: Array.from(variosProductIds) }
    });
    setForm({ name: '', contact: '', phone: '', whatsapp: '', email: '', address: '', city: '', state: '', postalCode: '', rfcCurp: '', creditDays: '', acquisitionMethod: 'entrega_domicilio', lines: [], proteinTypeIds: [], proteinSubTypeIds: [] });
    setShowNew(false);
  };
  return (
    <div>
      <h2 className="module-title mb-4 text-2xl">Proveedores</h2>
      <div className="mb-4 flex items-center gap-2 uppercase">
        <button className="rounded bg-primary px-3 py-2 text-white uppercase" onClick={() => setShowNew((v) => !v)}>
          {showNew ? 'CERRAR' : 'NUEVO PROVEEDOR'}
        </button>
      </div>
      {showNew && (
        <form onSubmit={onSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-4 uppercase">
          <input className="rounded border p-2 uppercase" placeholder="EMPRESA" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="rounded border p-2 uppercase" placeholder="NOMBRE DE CONTACTO" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
          <input className="rounded border p-2 uppercase" placeholder="TELÉFONO" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <input className="rounded border p-2 uppercase" placeholder="WHATSAPP" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
          <input className="rounded border p-2 uppercase" placeholder="EMAIL" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <select className="rounded border p-2 uppercase" value={form.acquisitionMethod} onChange={(e)=> setForm((f)=> ({...f, acquisitionMethod: e.target.value as any}))}>
            <option value="punto_recoleccion">PUNTO DE RECOLECCIÓN</option>
            <option value="entrega_domicilio">ENTREGA A DOMICILIO</option>
          </select>
          <input className="rounded border p-2 md:col-span-2 uppercase" placeholder="DIRECCIÓN" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <input className="rounded border p-2 uppercase" placeholder="CIUDAD" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <input className="rounded border p-2 uppercase" placeholder="ESTADO" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
          <input className="rounded border p-2 uppercase" placeholder="CP" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
          <input className="rounded border p-2 uppercase" placeholder="RFC O CURP" value={form.rfcCurp} onChange={(e) => setForm((f) => ({ ...f, rfcCurp: e.target.value }))} />
          <input className="rounded border p-2 uppercase" placeholder="DÍAS DE CRÉDITO" value={form.creditDays} onChange={(e) => setForm((f) => ({ ...f, creditDays: e.target.value }))} />
          {/* Selector dinámico de pares (categoría/subcategoría) */}
          <div className="md:col-span-4">
            <div className="mb-2 text-sm font-semibold text-primary uppercase">CATEGORÍAS Y SUBCATEGORÍAS QUE MANEJA</div>
            <div className="space-y-2">
              {(form.lines || []).map((ln, idx) => {
                const selectedType = (catalog || []).find(t => t.id === ln.typeId);
                const isVariosSel = ln.typeId === VARIOS_ID;
                const subOpts = selectedType?.subtypes || [];
                const variosOpts = isVariosSel
                  ? (allProducts || []).filter(p => {
                      const cat = ((p as any).category || '').toString().toUpperCase();
                      const hasType = !!(p.proteinType?.id || p.proteinSubType?.id);
                      return !hasType && (cat === 'VARIOS' || !cat);
                    }).map(p => ({ id: p.id, name: p.name }))
                  : [];
                return (
                  <div key={idx} className="flex flex-wrap gap-2 items-center">
                    <select
                      className="rounded border p-2 uppercase"
                      value={ln.typeId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f)=> {
                          const lines = [...f.lines];
                          lines[idx] = { typeId: val, subTypeId: '' };
                          return { ...f, lines };
                        });
                      }}
                    >
                      <option value="">SELECCIONA CATEGORÍA</option>
                      {typeOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <select
                      className="rounded border p-2 uppercase"
                      value={ln.subTypeId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f)=> {
                          const lines = [...f.lines];
                          lines[idx] = { ...lines[idx], subTypeId: val };
                          return { ...f, lines };
                        });
                      }}
                      disabled={isVariosSel ? (variosOpts.length === 0) : (!selectedType || subOpts.length === 0)}
                    >
                      {isVariosSel ? (
                        <>
                          <option value="">{variosOpts.length ? 'SELECCIONA PRODUCTO' : 'SIN PRODUCTOS VARIOS'}</option>
                          {variosOpts.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </>
                      ) : (
                        <>
                          <option value="">{!selectedType ? 'ELIGE CATEGORÍA PRIMERO' : (subOpts.length ? 'SELECCIONA SUBCATEGORÍA' : 'SIN SUBCATEGORÍAS')}</option>
                          {subOpts.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </>
                      )}
                    </select>
                    <button
                      type="button"
                      className="rounded bg-red-100 px-2 py-2 text-red-700 hover:bg-red-200"
                      onClick={() => setForm((f)=> ({ ...f, lines: f.lines.filter((_, i)=> i !== idx) }))}
                      aria-label="Quitar"
                      title="Quitar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded bg-primary/10 px-3 py-2 text-primary hover:bg-primary/20 uppercase"
                onClick={() => setForm((f)=> ({ ...f, lines: [...(f.lines || []), { typeId: '', subTypeId: '' }] }))}
                aria-label="Agregar categoría"
              >
                <Plus size={16} /> AGREGAR CATEGORÍA
              </button>
            </div>
          </div>
          <div className="md:col-span-4 text-right">
            <button className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50 uppercase" disabled={createSupplier.isPending}>
              {createSupplier.isPending ? 'GUARDANDO...' : 'GUARDAR'}
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
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">RFC/CURP</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">WhatsApp</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Dirección</th>
                <th className="px-4 py-3 text-left">Condición</th>
                <th className="px-4 py-3 text-right">Días crédito</th>
                <th className="px-4 py-3 text-left">Productos</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((s) => (
                <>
                  <tr key={s.id} className="odd:bg-gray-50">
                    <td className="px-4 py-2">{s.name || '-'}</td>
                    <td className="px-4 py-2">{s.contact ?? '-'}</td>
                    <td className="px-4 py-2">{s.rfcCurp ?? '-'}</td>
                    <td className="px-4 py-2">{s.phone ?? '-'}</td>
                    <td className="px-4 py-2">{s.whatsapp ?? '-'}</td>
                    <td className="px-4 py-2">{s.email ?? '-'}</td>
                    <td className="px-4 py-2">
                      {s.address ? `${s.address}${s.city ? ', ' + s.city : ''}${s.state ? ', ' + s.state : ''}${s.postalCode ? ' CP ' + s.postalCode : ''}` : '-'}
                    </td>
                    <td className="px-4 py-2 uppercase">{s.creditTerms ?? '-'}</td>
                    <td className="px-4 py-2 text-right">{s.creditDays ?? '-'}</td>
                    <td className="px-4 py-2">
                      <button
                        className="rounded bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20 uppercase"
                        onClick={() => setOpenProductsId((v) => (v === s.id ? null : s.id))}
                      >
                        {openProductsId === s.id ? 'OCULTAR' : 'VER PRODUCTOS'}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="rounded bg-primary px-2 py-1 text-white uppercase" onClick={() => { 
                        setEditingId(s.id); 
                        setEditForm(s); 
                        try {
                          const typeIds: string[] = Array.isArray((s as any).commercialInfo?.proteinTypeIds)
                            ? (s as any).commercialInfo.proteinTypeIds
                            : (s.proteinType?.id ? [s.proteinType.id] : []);
                          const subIds: string[] = Array.isArray((s as any).commercialInfo?.proteinSubTypeIds)
                            ? (s as any).commercialInfo.proteinSubTypeIds
                            : (s.proteinSubType?.id ? [s.proteinSubType.id] : []);
                          const lines: { typeId: string; subTypeId: string }[] = [];
                          const subSet = new Set<string>();
                          for (const sid of subIds) {
                            const t = (catalog || []).find(tt => tt.subtypes.some(sb => sb.id === sid));
                            const subtype = t?.subtypes.find(sb => sb.id === sid);
                            if (t && subtype) { lines.push({ typeId: t.id, subTypeId: subtype.id }); subSet.add(sid); }
                          }
                          for (const tid of typeIds) {
                            const already = lines.some(ln => ln.typeId === tid);
                            if (!already) lines.push({ typeId: tid, subTypeId: '' });
                          }
                          const variosIds: string[] = Array.isArray((s as any).commercialInfo?.variosProductIds)
                            ? (s as any).commercialInfo?.variosProductIds
                            : [];
                          for (const pid of variosIds) {
                            lines.push({ typeId: VARIOS_ID, subTypeId: pid });
                          }
                          setEditLines(lines);
                        } catch { setEditLines([]); }
                      }}>EDITAR</button>
                    </td>
                  </tr>
                  {openProductsId === s.id && (
                    <tr>
                      <td colSpan={11} className="bg-white p-4 uppercase">
                        {(() => {
                          // Tomar de commercialInfo y también derivar de productos reales ligados al proveedor
                          const initialTypeIds: string[] = Array.isArray((s as any).commercialInfo?.proteinTypeIds)
                            ? (s as any).commercialInfo.proteinTypeIds
                            : (s.proteinType?.id ? [s.proteinType.id] : []);
                          const initialSubIds: string[] = Array.isArray((s as any).commercialInfo?.proteinSubTypeIds)
                            ? (s as any).commercialInfo.proteinSubTypeIds
                            : (s.proteinSubType?.id ? [s.proteinSubType.id] : []);
                          const typeSet = new Set<string>(initialTypeIds);
                          const subSet = new Set<string>(initialSubIds);
                          const linked = (allProducts || []).filter(p => p.supplier?.id === s.id);
                          for (const p of linked) {
                            // Resolver typeId por id directo o por nombre/categoría
                            const typeId = p.proteinType?.id
                              || (() => {
                                   const name = (p.proteinType?.name || p.category || '').toLowerCase();
                                   const match = (catalog || []).find(tt => (tt.name || '').toLowerCase() === name);
                                   return match?.id;
                                 })();
                            if (typeId) typeSet.add(typeId);
                            if (p.proteinSubType?.id) subSet.add(p.proteinSubType.id);
                          }
                          const typeIds = Array.from(typeSet);
                          const subIds = Array.from(subSet);
                          const types = (catalog || []).filter(t => typeSet.has(t.id));
                          const subMap = new Map<string, string[]>();
                          for (const t of catalog || []) {
                            for (const sb of t.subtypes) {
                              if (subIds.includes(sb.id)) {
                                const arr = subMap.get(t.id) || [];
                                arr.push(sb.name);
                                subMap.set(t.id, arr);
                              }
                            }
                          }
                          // VARIOS: productos sin tipo conocido
                          const norm = (str: string) => (str || '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
                          const isKnownTypeName = (nm: string) => {
                            const n = norm(nm);
                            return n.includes('pollo') || n.includes('res') || n.includes('cerdo') || n.includes('pescado');
                          };
                          const variosProducts = linked.filter(p => {
                            if (p.proteinType?.id || p.proteinSubType?.id) return false;
                            const cat = norm((p as any).category || '');
                            if (cat === 'varios') return true;
                            if (!cat) return true;
                            return !isKnownTypeName(cat);
                          });
                          const variosByConfigIds: string[] = Array.isArray((s as any).commercialInfo?.variosProductIds) ? (s as any).commercialInfo?.variosProductIds : [];
                          const variosByConfig = (allProducts || []).filter(p => variosByConfigIds.includes(p.id));
                          const variosAll = Array.from(new Map([...variosProducts, ...variosByConfig].map(p => [p.id, p])).values());
                          const hasAny = typeIds.length > 0 || subIds.length > 0 || variosAll.length > 0 || ((s as any).commercialInfo?.varios === true);
                          if (!hasAny) return <div className="text-sm text-gray-500">Sin productos registrados</div>;
                          return (
                            <div className="flex flex-col gap-2 text-sm">
                              {types.map(t => (
                                <div key={t.id}>
                                  <span className="font-semibold">{t.name}:</span>{' '}
                                  <span>{(subMap.get(t.id) || []).join(', ') || '—'}</span>
                                </div>
                              ))}
                              {/* Subtipos cuyo tipo no esté en typeIds explícitamente */}
                              {Array.from(subMap.entries())
                                .filter(([tid]) => !typeIds.includes(tid))
                                .map(([tid, names]) => {
                                  const t = (catalog || []).find(ct => ct.id === tid);
                                  return (
                                    <div key={tid}>
                                      <span className="font-semibold">{t?.name ?? 'OTRO'}:</span>{' '}
                                      <span>{names.join(', ')}</span>
                                    </div>
                                  );
                                })}
                              {variosAll.length > 0 ? (
                                <div>
                                  <span className="font-semibold">VARIOS:</span>{' '}
                                  <span>{variosAll.map(v => v.name).join(', ')}</span>
                                </div>
                              ) : ((s as any).commercialInfo?.varios ? (
                                <div>
                                  <span className="font-semibold">VARIOS:</span>{' '}
                                  <span>—</span>
                                </div>
                              ) : null)}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  )}
                  {editingId === s.id && editForm && (
                    <tr>
                      <td colSpan={11} className="bg-white p-4 uppercase">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                          <input className="rounded border p-2 uppercase" placeholder="EMPRESA" value={editForm.name || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, name: e.target.value }))} />
                          <input className="rounded border p-2 uppercase" placeholder="CONTACTO" value={editForm.contact || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, contact: e.target.value }))} />
                          <input className="rounded border p-2 uppercase" placeholder="TELÉFONO" value={editForm.phone || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} />
                          <input className="rounded border p-2 uppercase" placeholder="WHATSAPP" value={editForm.whatsapp || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, whatsapp: e.target.value }))} />
                          <input className="rounded border p-2 uppercase" placeholder="EMAIL" value={editForm.email || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, email: e.target.value }))} />
                          <input className="rounded border p-2 md:col-span-2 uppercase" placeholder="DIRECCIÓN" value={editForm.address || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, address: e.target.value }))} />
                          <input className="rounded border p-2 uppercase" placeholder="CIUDAD" value={editForm.city || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, city: e.target.value }))} />
                          <input className="rounded border p-2 uppercase" placeholder="ESTADO" value={editForm.state || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, state: e.target.value }))} />
                          <input className="rounded border p-2 uppercase" placeholder="CP" value={editForm.postalCode || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, postalCode: e.target.value }))} />
                          <input className="rounded border p-2 uppercase" placeholder="RFC O CURP" value={editForm.rfcCurp || ''} onChange={(e) => setEditForm((f: any) => ({ ...f, rfcCurp: e.target.value }))} />
                          <input className="rounded border p-2 uppercase" placeholder="DÍAS DE CRÉDITO" value={editForm.creditDays ?? ''} onChange={(e) => setEditForm((f: any) => ({ ...f, creditDays: e.target.value }))} />
                          {/* Selector dinámico de pares para edición */}
                          <div className="md:col-span-4">
                            <div className="mb-2 text-sm font-semibold text-primary">CATEGORÍAS Y SUBCATEGORÍAS QUE MANEJA</div>
                            <div className="space-y-2">
                              {(editLines || []).map((ln, idx) => {
                                const selectedType = (catalog || []).find(t => t.id === ln.typeId);
                                const isVariosSel = ln.typeId === VARIOS_ID;
                                const subOpts = selectedType?.subtypes || [];
                                return (
                                  <div key={idx} className="flex flex-wrap gap-2 items-center">
                                    <select
                                      className="rounded border p-2"
                                      value={ln.typeId}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditLines((ls)=> {
                                          const copy = [...ls];
                                          copy[idx] = { typeId: val, subTypeId: '' };
                                          return copy;
                                        });
                                      }}
                                    >
                                      <option value="">SELECCIONA CATEGORÍA</option>
                                      {typeOptions.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                    <select
                                      className="rounded border p-2"
                                      value={ln.subTypeId}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditLines((ls)=> {
                                          const copy = [...ls];
                                          copy[idx] = { ...copy[idx], subTypeId: val };
                                          return copy;
                                        });
                                      }}
                                      disabled={(!selectedType && !isVariosSel) || subOpts.length === 0}
                                    >
                                      <option value="">{!selectedType ? (isVariosSel ? 'SIN SUBCATEGORÍAS' : 'ELIGE CATEGORÍA PRIMERO') : (subOpts.length ? 'SELECCIONA SUBCATEGORÍA' : 'SIN SUBCATEGORÍAS')}</option>
                                      {subOpts.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      className="rounded bg-red-100 px-2 py-2 text-red-700 hover:bg-red-200"
                                      onClick={() => setEditLines((ls)=> ls.filter((_, i)=> i !== idx))}
                                      aria-label="Quitar"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded bg-primary/10 px-3 py-2 text-primary hover:bg-primary/20"
                                onClick={() => setEditLines((ls)=> ([...ls, { typeId: '', subTypeId: '' }]))}
                                aria-label="Agregar categoría"
                              >
                                <Plus size={16} /> AGREGAR CATEGORÍA
                              </button>
                            </div>
                          </div>
                          <div className="md:col-span-4 text-right space-x-2">
                            <button className="rounded bg-gray-200 px-3 py-2 uppercase" onClick={() => { setEditingId(null); setEditForm(null); }}>CANCELAR</button>
                            <button className="rounded bg-green-600 px-3 py-2 text-white uppercase" onClick={async () => {
                              const typeSet = new Set<string>();
                              const subTypeSet = new Set<string>();
                              for (const ln of editLines) {
                                if (ln.typeId && ln.typeId !== VARIOS_ID) typeSet.add(ln.typeId);
                                if (ln.subTypeId) subTypeSet.add(ln.subTypeId);
                              }
                              let hasVarios = false;
                              const variosProductIds = new Set<string>();
                              for (const ln of editLines) {
                                if (ln.typeId === VARIOS_ID) {
                                  hasVarios = true;
                                  if (ln.subTypeId) variosProductIds.add(ln.subTypeId);
                                }
                              }
                              await updateSupplier.mutateAsync({
                                id: s.id,
                                name: editForm.name,
                                contact: editForm.contact || undefined,
                                phone: editForm.phone || undefined,
                                whatsapp: editForm.whatsapp || undefined,
                                email: editForm.email || undefined,
                                address: editForm.address || undefined,
                                city: editForm.city || undefined,
                                state: editForm.state || undefined,
                                postalCode: editForm.postalCode || undefined,
                                rfcCurp: editForm.rfcCurp || undefined,
                                creditDays: editForm.creditDays ? Number(editForm.creditDays) : undefined,
                                proteinTypeIds: Array.from(typeSet),
                                proteinSubTypeIds: Array.from(subTypeSet),
                                commercialInfo: { varios: hasVarios, proteinTypeIds: Array.from(typeSet), proteinSubTypeIds: Array.from(subTypeSet), variosProductIds: Array.from(variosProductIds) }
                              });
                              setEditingId(null); setEditForm(null);
                            }}>GUARDAR CAMBIOS</button>
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
