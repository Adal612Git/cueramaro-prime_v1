import { PropsWithChildren } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Users, Package, ShoppingCart, Receipt, BarChart3, Settings } from 'lucide-react';
import { ConnectionBadge } from './ConnectionBadge';
import logoSymbol from '../assets/logo-placeholder.svg';

const links = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/sales', label: 'Ventas', icon: ShoppingCart },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/customers', label: 'Clientes', icon: Users },
  { to: '/suppliers', label: 'Proveedores', icon: Receipt },
  { to: '/expenses', label: 'Gastos', icon: Receipt },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '/settings', label: 'Configuración', icon: Settings }
];

export function ShellLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-transparent backdrop-blur-sm">
      <header className="flex flex-col gap-4 px-6 py-4 text-white md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Menu className="hidden md:block" />
          <img src={logoSymbol} alt="Cuerámaro Prime" className="h-12 w-12 rounded-full bg-white/10 p-1" />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">¡Bienvenido a</p>
            <h1 className="text-2xl font-bold">Cuerámaro Prime POS</h1>
          </div>
        </div>
        <ConnectionBadge />
      </header>
      <div className="grid gap-6 px-4 pb-10 md:grid-cols-[260px_1fr] md:px-10">
        <aside className="rounded-3xl bg-white/10 p-6 shadow-lg backdrop-blur-lg">
          <nav className="flex flex-col gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive ? 'bg-white text-primary shadow' : 'text-white hover:bg-white/20'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="rounded-3xl bg-white/90 p-6 shadow-2xl backdrop-blur-xl">
          {children}
        </main>
      </div>
      <footer className="px-6 pb-6 text-center text-xs text-white/70">
        <Link to="/reports">Ver reportes detallados</Link>
      </footer>
    </div>
  );
}
