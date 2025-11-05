import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

type IngressInput = {
  productId?: string;
  sku?: string;
  quantity: number;
  cost?: number;
  lotCode?: string;
  arrivalDate?: string;
  expirationDate?: string;
};

export function useIngress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: IngressInput) => {
      const { data } = await api.post('/inventory/ingress', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

