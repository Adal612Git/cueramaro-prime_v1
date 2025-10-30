import { useMemo } from 'react';
import { CreditCard, Package, ShoppingBag, Users } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';

const fallbackCards = [
  {
    title: 'Ventas del Día',
    value: '$12,540',
    change: '+8.2%',
    icon: ShoppingBag,
    description: 'Comparado con ayer'
  },
  {
    title: 'Productos en Inventario',
    value: '156',
    change: '-4 unidades',
    icon: Package,
    description: 'Actualizado en tiempo real'
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
  const { data } = useDashboardData();
  const cards = useMemo(() => {
    if (!data) {
      return fallbackCards;
    }
    return [
      {
        title: 'Ventas del Día',
        value: `${formatCurrency(data.totals.sales)}`,
        change: `${data.recentSales.length} ventas recientes`,
        icon: ShoppingBag,
        description: 'Datos en vivo desde ElectricSQL'
      },
      {
        title: 'Productos en Inventario',
        value: data.totals.products.toString(),
        change: `${formatCurrency(data.totals.margin)} margen`,
        icon: Package,
        description: 'Conteo sincronizado'
      },
      {
        title: 'Clientes Activos',
        value: data.totals.customers.toString(),
        change: `${data.recentSales.length} ventas recientes`,
        icon: Users,
        description: 'Actualizado con CRDT LWW'
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
          <article key={title} className="kpi-card card p-5">
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
          </article>
        ))}
      </section>
      <section className="rounded-2xl bg-primary/5 p-6 shadow-inner">
        <h2 className="text-xl font-bold text-primary">Módulos Principales</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            'Ventas POS',
            'Inventario por Lotes',
            'Proveedores',
            'Clientes',
            'Cuentas por Cobrar',
            'Gastos',
            'Reportes',
            'Usuarios y Roles'
          ].map((module) => (
            <div key={module} className="card p-4 text-center">
              <p className="text-sm font-semibold text-text">{module}</p>
              <p className="mt-2 text-xs text-gray-500">Disponible offline con sincronización automática.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
import { formatCurrency } from '../utils/format';
