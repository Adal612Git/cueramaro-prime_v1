import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

type DashboardResponse = {
  totals: {
    sales: number;
    expenses: number;
    margin: number;
    products: number;
    customers: number;
  };
  recentSales: Array<{ id: string; total: number; createdAt: string }>;
};

export function useDashboardData() {
  return useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardResponse>('/reports/dashboard');
      return data;
    },
    staleTime: 10_000
  });
}
