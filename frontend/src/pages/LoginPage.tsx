import { FormEvent, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate, useNavigate } from 'react-router-dom';
import { Fingerprint, Lock, User } from 'lucide-react';
import logoFull from '../assets/CUERAMARO-CARNES-LOGO-COMPLETO-sin-fondo.png';

export function LoginPage() {
  const [email, setEmail] = useState('admin@pos.local');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuthStore();
  const navigate = useNavigate();

  if (auth.user && auth.token) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      auth.login(data.user, data.access_token);
      navigate('/');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-blurs" />
      <div className="login-card mx-4 p-10 fade-in">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logoFull} alt="Cuerámaro Prime" className="mb-3 w-[220px] max-w-[70vw] object-contain" />
          <h1 className="login-title text-[20px] sm:text-[22px] tracking-wide">INICIANDO SISTEMA...</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[color:var(--color-primary)]">Usuario</label>
            <div className="input-group mt-1">
              <User size={18} className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-control"
                placeholder="usuario@pos.local"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[color:var(--color-primary)]">PIN</label>
            <div className="input-group mt-1">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-control"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary mx-auto flex items-center justify-center text-[18px] font-bold disabled:opacity-60"
          >
            {loading ? <span className="btn-spinner" /> : 'INGRESAR'}
          </button>
          <div className="flex items-center justify-center gap-2 pt-2 text-[color:var(--color-primary)]">
            <Fingerprint className="pulse opacity-70" size={18} />
            <span className="text-xs">Acceso rápido disponible</span>
          </div>
          <p className="pt-4 text-center login-phrase">EXCELENCIA EN CADA CORTE</p>
          <p className="text-center text-xs text-gray-500">Usa admin@pos.local / admin123 o caja@pos.local / caja123</p>
        </form>
      </div>
    </div>
  );
}
