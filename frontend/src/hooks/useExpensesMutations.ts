import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Expense } from './useExpenses';

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Expense, 'id' | 'createdAt'> & { concept?: string; method: 'efectivo'|'transferencia'|'credito'|'tarjeta'|'otro'; isDeductible?: boolean }) => {
      const { data } = await api.post('/expenses', payload);
      return data as Expense;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] })
  });
}

