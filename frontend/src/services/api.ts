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

export default api;
