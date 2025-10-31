import { useMemo, useState, lazy, Suspense } from 'react';
import { CreditCard, Package, ShoppingBag, Users } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useReceivables } from '../hooks/useReceivables';
import { useNearExpiry } from '../hooks/useNearExpiry';
import { formatCurrency } from '../utils/format';
const ReportLink = lazy(() => import('../services/pdfReports').then(m => ({ default: m.DashboardSalesReportLink })));

const fallbackCards = [
  {
    title: 'Ventas del Día',
    value: '$12,540',
    change: '+8.2%',
    icon: ShoppingBag,
    description: 'Comparado con ayer'
  },
  {
    title: 'Productos rezagados',
    value: '0',
    change: 'Prontos a vencer',
    icon: Package,
    description: 'Según fecha de llegada/caducidad'
  },
  {
    title: 'Clientes Activos',
    value: '89',
    change: '+5 nuevos',
    icon: Users,
    description: 'Últimos 7 días'
  },
  {
    title: 'Cuentas por Cobrar',
    value: '$4,320',
    change: 'Vencen pronto',
    icon: CreditCard,
    description: 'Gestiona abonos a tiempo'
  }
];

export function DashboardPage() {
  // Filtros de rango para la tarjeta "Ventas del Día"
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'custom'>('day');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const startOfWeek = useMemo(() => { const d = new Date(); const day = d.getDay(); const diff = (day + 6) % 7; d.setDate(d.getDate() - diff); d.setHours(0,0,0,0); return d; }, []);
  const startOfMonth = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }, []);
  const fmt = (d: Date) => d.toISOString().slice(0,10);

  const dashParams = useMemo(() => {
    if (range === 'day') return { from: fmt(today) };
    if (range === 'week') return { from: fmt(startOfWeek) };
    if (range === 'month') return { from: fmt(startOfMonth) };
    return { from: from || undefined, to: to || undefined };
  }, [range, from, to, today, startOfWeek, startOfMonth]);

  const { data } = useDashboardData(dashParams);
  const { data: recv } = useReceivables();
  const [showRecv, setShowRecv] = useState(false);
  const { data: near } = useNearExpiry({ days: 7, staleDays: 10 });
  const [showNear, setShowNear] = useState(false);
  const cards = useMemo(() => {
    if (!data) {
      return fallbackCards;
    }
    return [
      {
        title: range === 'day' ? 'Ventas del Día' : range === 'week' ? 'Ventas de la Semana' : range === 'month' ? 'Ventas del Mes' : 'Ventas del Rango',
        value: `${formatCurrency(data.totals.sales)}`,
        change: `${data.recentSales.length} ventas recientes`,
        icon: ShoppingBag,
        description: 'Datos en vivo desde ElectricSQL'
      },
      {
        title: 'Productos rezagados',
        value: String(near?.count ?? 0),
        change: 'Prontos a vencer',
        icon: Package,
        description: 'Según fecha de llegada/caducidad'
      },
      {
        title: 'Clientes cuentas por cobrar',
        value: `${recv?.byCustomer.length ?? 0}`,
        change: `Total adeudado: ${formatCurrency(recv?.total ?? 0)}`,
        icon: Users,
        description: 'Detalle disponible'
      },
      {
        title: 'Cuentas por Cobrar',
        value: `${formatCurrency(data.totals.accountsReceivable)}`,
        change: 'Saldo pendiente real',
        icon: CreditCard,
        description: 'Prepárate para gestionar abonos'
      }
    ];
  }, [data]);

  return (
    <div className="space-y-8">
      <section className="dashboard-grid">
        {cards.map(({ title, value, change, icon: Icon, description }) => (
          <article key={title} className="kpi-card card relative p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary/80 font-mont">{title}</p>
                <p className="mt-2 text-3xl font-bold text-text font-mont">{value}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Icon size={28} />
              </div>
            </div>
            <p className="mt-4 text-xs uppercase tracking-wide text-secondary">{change}</p>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
            {title === 'Productos rezagados' && (
              <div className="mt-3">
                <button
                  onClick={() => setShowNear((v) => !v)}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  {showNear ? 'Ocultar detalle' : 'Ver detalle'}
                </button>
                {showNear && (
                  <div className="absolute left-4 right-4 z-10 mt-2 max-h-64 overflow-auto rounded-xl border border-primary/20 bg-white p-3 shadow-2xl">
                    {near?.items?.length ? (
                      <ul className="space-y-2 text-sm">
                        {near.items.map((i) => (
                          <li key={i.id} className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="font-semibold text-text">{i.productName} {i.sku ? `· ${i.sku}` : ''}</p>
                              <p className="text-xs text-gray-500">Llega: {new Date(i.arrivalDate).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-primary">Cantidad: {i.quantity}</p>
                              <p className="text-xs text-gray-500">{i.expirationDate ? `Caduca: ${new Date(i.expirationDate).toLocaleDateString()} (${i.daysToExpire ?? 0} días)` : 'Sin fecha de caducidad'}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-xs text-gray-500">Sin productos rezagados</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {title.startsWith('Ventas') && (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="flex items-center gap-2">
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${range==='day'?'bg-primary/20 text-primary':'bg-primary/10 text-primary hover:bg-primary/20'}`}
                    onClick={() => setRange('day')}
                  >Día</button>
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${range==='week'?'bg-primary/20 text-primary':'bg-primary/10 text-primary hover:bg-primary/20'}`}
                    onClick={() => setRange('week')}
                  >Semana</button>
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${range==='month'?'bg-primary/20 text-primary':'bg-primary/10 text-primary hover:bg-primary/20'}`}
                    onClick={() => setRange('month')}
                  >Mes</button>
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${range==='custom'?'bg-primary/20 text-primary':'bg-primary/10 text-primary hover:bg-primary/20'}`}
                    onClick={() => setRange('custom')}
                  >Personalizar</button>
                </div>
                {range === 'custom' && (
                  <div className="flex items-end gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-500">Desde</label>
                      <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded border p-1 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500">Hasta</label>
                      <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded border p-1 text-xs" />
                    </div>
                  </div>
                )}
                <div className="ml-auto">
                  {data ? (
                    <Suspense fallback={<span className="rounded bg-gray-300 px-3 py-1 text-xs">Exportar</span>}>
                      <ReportLink
                        title={title}
                        rangeLabel={(range === 'day') ? `Día ${fmt(today)}` : (range === 'week') ? `Semana ${fmt(startOfWeek)} a ${fmt(new Date())}` : (range === 'month') ? `Mes desde ${fmt(startOfMonth)} a ${fmt(new Date())}` : `Rango ${from || 'inicio'} a ${to || fmt(new Date())}`}
                        total={data.totals.sales}
                        sales={data.recentSales}
                        fileName={`reporte_ventas_${range}_${(range==='custom' ? `${from || 'inicio'}_${to || fmt(new Date())}` : `${fmt(range==='day'?today:range==='week'?startOfWeek:startOfMonth)}_${fmt(new Date())}`)}.pdf`}
                      />
                    </Suspense>
                  ) : (
                    <span className="rounded bg-gray-300 px-3 py-1 text-xs opacity-60">Exportar</span>
                  )}
                </div>
              </div>
            )}
            {title === 'Clientes cuentas por cobrar' && (
              <div className="mt-3">
                <button
                  onClick={() => setShowRecv((v) => !v)}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  {showRecv ? 'Ocultar detalle' : 'Ver detalle'}
                </button>
                {showRecv && (
                  <div className="absolute left-4 right-4 z-10 mt-2 max-h-64 overflow-auto rounded-xl border border-primary/20 bg-white p-3 shadow-2xl">
                    {recv?.byCustomer.length ? (
                      <ul className="space-y-2 text-sm">
                        {recv.byCustomer.map((c) => (
                          <li key={c.customerId ?? 'MOSTRADOR'} className="flex items-center justify-between">
                            <span className="font-medium text-text">{c.customerName}</span>
                            <span className="text-primary">{formatCurrency(c.due)}{c.nextDueDate ? ` · vence ${new Date(c.nextDueDate).toLocaleDateString()}` : ''}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-xs text-gray-500">Sin saldos pendientes</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </section>
      <section className="rounded-2xl bg-primary/5 p-6 shadow-inner">
        <h2 className="module-title text-xl">Módulos Principales</h2>
        <div className="mt-4">
          <div className="card p-6 text-center text-sm text-gray-500">
            Espacio reservado
          </div>
        </div>
      </section>
    </div>
  );
}
