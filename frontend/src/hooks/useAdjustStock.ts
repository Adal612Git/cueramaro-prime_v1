import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data } = await api.patch(`/products/${id}/stock`, { quantity });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

