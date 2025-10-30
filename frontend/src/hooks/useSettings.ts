import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type SettingsResponse = {
  api: { port: number };
  cors: string | null;
  database: { url: string; summary: { products: number; customers: number; suppliers: number; expenses: number } };
};

export function useSettings() {
  return useQuery<SettingsResponse>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<SettingsResponse>('/settings');
      return data;
    }
  });
}

