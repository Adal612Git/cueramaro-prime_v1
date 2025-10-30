import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Supplier } from './useSuppliers';

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Supplier> & { name: string }) => {
      const { data } = await api.post('/suppliers', payload);
      return data as Supplier;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] })
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Supplier> & { id: string }) => {
      const { data } = await api.patch(`/suppliers/${id}`, payload);
      return data as Supplier;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] })
  });
}

