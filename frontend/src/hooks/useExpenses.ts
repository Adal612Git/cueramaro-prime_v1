import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type Expense = { id: string; description: string; amount: number; createdAt: string };

export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data } = await api.get<Expense[]>('/expenses');
      return data;
    }
  });
}

