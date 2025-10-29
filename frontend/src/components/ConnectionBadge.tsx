import { useConnectionStore } from '../store/useConnectionStore';

export function ConnectionBadge() {
  const status = useConnectionStore((state) => state.status);
  const label = status === 'online' ? 'En línea' : status === 'offline' ? 'Sin conexión' : 'Sincronizando';
  const color = status === 'online' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : 'bg-amber-500';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${color}`}>
      <span className="h-2 w-2 rounded-full bg-white" />
      {label}
    </span>
  );
}
