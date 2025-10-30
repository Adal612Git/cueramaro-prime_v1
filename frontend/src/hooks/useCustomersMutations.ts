import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Customer } from './useCustomers';

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Customer> & { name: string }) => {
      const { data } = await api.post('/customers', payload);
      return data as Customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
    }
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Customer> & { id: string }) => {
      const { data } = await api.patch(`/customers/${id}`, payload);
      return data as Customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
    }
  });
}

