import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type Product = {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  stock: number;
  unit?: string | null;
  category?: string | null;
  supplier?: { id: string; name: string } | null;
  proteinType?: { id: string; name: string } | null;
  proteinSubType?: { id: string; name: string } | null;
};

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get<Product[]>('/products');
      return data;
    }
  });
}
