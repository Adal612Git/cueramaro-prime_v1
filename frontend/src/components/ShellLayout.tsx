import { PropsWithChildren } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Users, Package, ShoppingCart, Receipt, BarChart3, Settings } from 'lucide-react';
import { ConnectionBadge } from './ConnectionBadge';
import logoSymbol from '../assets/CUERAMARO-CARNES-LOGO-SIMBOLO-sin-fondo.png';
import { useAuthStore } from '../store/useAuthStore';

const links = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/sales', label: 'Ventas', icon: ShoppingCart },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/customers', label: 'Clientes', icon: Users },
  { to: '/suppliers', label: 'Proveedores', icon: Receipt },
  { to: '/expenses', label: 'Gastos', icon: Receipt },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '/settings', label: 'Configuración', icon: Settings },
  { to: '/ingreso', label: 'Ingreso', icon: Package }
];

export function ShellLayout({ children }: PropsWithChildren) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const visible = (() => {
    if (!user) return links;
    if (user.role === 'MOSTRADOR') {
      return links.filter((l) => ['/', '/sales', '/products', '/ingreso'].includes(l.to));
    }
    return links;
  })();
  return (
    <div className="min-h-screen app-bg uppercase">
      <header className="flex flex-col gap-4 px-2 md:px-4 lg:px-6 py-4 text-primary md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Menu className="hidden md:block" />
          <img src={logoSymbol} alt="Cuerámaro Prime" className="h-16 w-16 rounded-full bg-white/10 p-1" />
          <div>
            <p className="text-sm tracking-[0.3em] text-primary/70">¡Bienvenido a</p>
            <h1 className="text-2xl font-bold text-white">Cuerámaro Prime</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionBadge />
          {user && (
            <button onClick={logout} className="logout-btn">
              Cerrar sesión
            </button>
          )}
        </div>
      </header>
      <div className="grid gap-4 px-0 md:px-4 lg:px-6 pb-10 md:grid-cols-[240px_minmax(0,1fr)] w-full">
        <aside className="sidebar rounded-none md:rounded-3xl p-4 md:p-6 shadow-lg md:ml-0">
          <nav className="flex flex-col gap-2">
            {visible.map(({ to, label, icon: Icon }) => (
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
        <main className="panel p-4 md:p-6 overflow-x-auto">
          {children}
        </main>
      </div>
      <footer className="px-6 pb-8 text-center text-primary/80">
        <div className="mt-6 text-sm">"lo unico imposible es aquello que no intentas"</div>
        <div className="mt-2 text-xs text-primary/70">
          {(!user || user.role === 'ADMIN') && <Link to="/reports">Ver reportes detallados</Link>}
        </div>
      </footer>
    </div>
  );
}
