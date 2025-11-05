import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type Expense = {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
  concept?: string | null;
  method?: 'efectivo' | 'transferencia' | 'credito' | 'tarjeta' | 'otro' | string | null;
  isDeductible?: boolean | null;
  attachmentUrl?: string | null;
};

export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data } = await api.get<Expense[]>('/expenses');
      return data;
    }
  });
}
