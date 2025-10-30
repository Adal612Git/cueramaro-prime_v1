import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

type DashboardResponse = {
  totals: {
    sales: number;
    expenses: number;
    margin: number;
    products: number;
    customers: number;
    accountsReceivable: number;
  };
  recentSales: Array<{ id: string; total: number; createdAt: string }>;
};

export function useDashboardData(params?: { from?: string; to?: string }) {
  return useQuery<DashboardResponse>({
    queryKey: ['dashboard', params?.from ?? '', params?.to ?? ''],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params?.from) search.set('from', params.from);
      if (params?.to) search.set('to', params.to);
      const qs = search.toString();
      const { data } = await api.get<DashboardResponse>(`/reports/dashboard${qs ? `?${qs}` : ''}`);
      return data;
    },
    staleTime: 10_000
  });
}
