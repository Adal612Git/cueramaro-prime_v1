import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

type Params = { id: string; price: number };

export function useUpdateProductPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, price }: Params) => {
      const { data } = await api.patch(`/products/${id}/price`, { price });
      return data as { id: string; price: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

