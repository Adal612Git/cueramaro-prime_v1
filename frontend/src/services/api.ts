import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
});

// Interceptor simple para mostrar estado de sincronización en consola.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error calling API', error);
    throw error;
  }
);

// Adjunta JWT si existe en localStorage
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('auth');
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // noop
  }
  return config;
});

export default api;
