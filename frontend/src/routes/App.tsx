import { PropsWithChildren, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CustomersPage } from '../pages/CustomersPage';
import { SuppliersPage } from '../pages/SuppliersPage';
import { ExpensesPage } from '../pages/ExpensesPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { LoginPage } from '../pages/LoginPage';
import { ShellLayout } from '../components/ShellLayout';
import { useConnectionStore } from '../store/useConnectionStore';
import { useAuthStore } from '../store/useAuthStore';
import { SalesPage } from '../pages/SalesPage';
import { IngresoPage } from '../pages/IngresoPage';

const modules = [
  { path: '/', element: <DashboardPage /> },
  { path: '/sales', element: <SalesPage /> },
  { path: '/products', element: <ProductsPage /> },
  { path: '/customers', element: <CustomersPage /> },
  { path: '/suppliers', element: <SuppliersPage /> },
  { path: '/expenses', element: <ExpensesPage /> },
  { path: '/reports', element: <ReportsPage /> },
  { path: '/settings', element: <SettingsPage /> }
];

function RequireAuth({ children }: PropsWithChildren) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children as any;
}

function AdminOnly({ children }: PropsWithChildren) {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'ADMIN') return <Navigate to="/sales" replace />;
  return children as any;
}

export default function App() {
  const setStatus = useConnectionStore((state) => state.setStatus);
  const location = useLocation();

  useEffect(() => {
    const updateStatus = () => setStatus(navigator.onLine ? 'online' : 'offline');
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, [setStatus]);

  // Toggle a body class for login route to control global background
  useEffect(() => {
    const isLogin = location.pathname === '/login';
    document.body.classList.toggle('login-page', isLogin);
    return () => {
      // ensure cleanup if component unmounts
      document.body.classList.remove('login-page');
    };
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ShellLayout>
            <Routes>
              <Route path="/" element={<RequireAuth><AdminOnly><DashboardPage /></AdminOnly></RequireAuth>} />
              <Route path="/sales" element={<RequireAuth><SalesPage /></RequireAuth>} />
              <Route path="/products" element={<RequireAuth><ProductsPage /></RequireAuth>} />
              <Route path="/customers" element={<RequireAuth><AdminOnly><CustomersPage /></AdminOnly></RequireAuth>} />
              <Route path="/suppliers" element={<RequireAuth><AdminOnly><SuppliersPage /></AdminOnly></RequireAuth>} />
              <Route path="/expenses" element={<RequireAuth><AdminOnly><ExpensesPage /></AdminOnly></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth><AdminOnly><ReportsPage /></AdminOnly></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><AdminOnly><SettingsPage /></AdminOnly></RequireAuth>} />
              <Route path="/ingreso" element={<RequireAuth><IngresoPage /></RequireAuth>} />
            </Routes>
          </ShellLayout>
        }
      />
    </Routes>
  );
}
