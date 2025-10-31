import { useSettings } from '../hooks/useSettings';

export function SettingsPage() {
  const { data, isLoading } = useSettings();
  return (
    <div className="space-y-4">
      <h2 className="module-title text-2xl">Configuración</h2>
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="space-y-4">
          <section className="rounded-xl bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-primary">API</h3>
            <p className="text-sm text-gray-600">Puerto: {data?.api.port}</p>
            <p className="text-sm text-gray-600">CORS: {data?.cors ?? 'n/a'}</p>
          </section>
          <section className="rounded-xl bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-primary">Base de Datos</h3>
            <p className="text-sm text-gray-600">URL: {data?.database.url}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-primary/5 p-2">Productos: {data?.database.summary.products}</div>
              <div className="rounded bg-primary/5 p-2">Clientes: {data?.database.summary.customers}</div>
              <div className="rounded bg-primary/5 p-2">Proveedores: {data?.database.summary.suppliers}</div>
              <div className="rounded bg-primary/5 p-2">Gastos: {data?.database.summary.expenses}</div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
