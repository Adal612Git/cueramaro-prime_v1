import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export type CustomerReceivableItem = {
  id: string;
  folio: string;
  createdAt: string;
  creditDueDate?: string | null;
  total: number;
  paidAmount: number;
  due: number;
  paymentMethod: string;
};

export function useCustomerReceivables(customerId?: string) {
  return useQuery<{ customer: { id: string; name: string; creditDays?: number | null }; totalDue: number; debts: number; items: CustomerReceivableItem[] }>({
    queryKey: ['customer-receivables', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data } = await api.get(`/customers/${customerId}/receivables`);
      return {
        ...data,
        items: (data.items || []).map((i: any) => ({ ...i, createdAt: new Date(i.createdAt).toISOString(), creditDueDate: i.creditDueDate ? new Date(i.creditDueDate).toISOString() : null }))
      };
    }
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { saleId: string; amount: number; method?: string; notes?: string }) => {
      const { data } = await api.patch(`/sales/${p.saleId}/payments`, { amount: p.amount, method: p.method, notes: p.notes });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries();
    }
  });
}

