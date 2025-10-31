import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type NearExpiryItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  arrivalDate: string;
  expirationDate: string | null;
  daysToExpire: number | null;
};

export function useNearExpiry(params?: { days?: number; staleDays?: number }) {
  return useQuery<{ count: number; items: NearExpiryItem[] }>({
    queryKey: ['near-expiry', params?.days ?? 7, params?.staleDays ?? 10],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params?.days != null) search.set('days', String(params.days));
      if (params?.staleDays != null) search.set('staleDays', String(params.staleDays));
      const { data } = await api.get(`/reports/near-expiry?${search.toString()}`);
      return data as any;
    },
    staleTime: 10_000
  });
}

