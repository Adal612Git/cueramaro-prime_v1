import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { ShellLayout } from '../components/ShellLayout';
import { useConnectionStore } from '../store/useConnectionStore';

const modules = [
  { path: '/', element: <DashboardPage /> },
  { path: '/sales', element: <div className="p-6 text-white">Ventas</div> },
  { path: '/products', element: <div className="p-6 text-white">Productos</div> },
  { path: '/customers', element: <div className="p-6 text-white">Clientes</div> },
  { path: '/suppliers', element: <div className="p-6 text-white">Proveedores</div> },
  { path: '/expenses', element: <div className="p-6 text-white">Gastos</div> },
  { path: '/reports', element: <div className="p-6 text-white">Reportes</div> },
  { path: '/settings', element: <div className="p-6 text-white">Configuración</div> }
];

export default function App() {
  const setStatus = useConnectionStore((state) => state.setStatus);

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

  return (
    <ShellLayout>
      <Routes>
        {modules.map((module) => (
          <Route key={module.path} path={module.path} element={module.element} />
        ))}
      </Routes>
    </ShellLayout>
  );
}
