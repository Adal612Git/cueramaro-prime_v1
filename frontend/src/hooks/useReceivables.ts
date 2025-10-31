import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type ReceivableItem = { customerId: string | null; customerName: string; due: number; nextDueDate: string | null };
export type ReceivablesResponse = { total: number; byCustomer: ReceivableItem[] };

export function useReceivables(params?: { from?: string; to?: string }) {
  return useQuery<ReceivablesResponse>({
    queryKey: ['receivables', params?.from ?? '', params?.to ?? ''],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params?.from) search.set('from', params.from);
      if (params?.to) search.set('to', params.to);
      const qs = search.toString();
      const { data } = await api.get<ReceivablesResponse>(`/reports/receivables${qs ? `?${qs}` : ''}`);
      return data;
    },
    staleTime: 10_000
  });
}

