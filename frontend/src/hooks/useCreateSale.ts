import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
};

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { customerId?: string; paymentMethod: 'efectivo' | 'transferencia' | 'credito' | 'tarjeta' | 'otro'; notes?: string; creditDueDate?: string; items: SaleItemInput[] }) => {
      const { data } = await api.post('/sales', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

