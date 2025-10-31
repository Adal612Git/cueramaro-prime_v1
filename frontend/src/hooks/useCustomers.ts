import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type Customer = {
  id: string;
  code?: number | null;
  name: string; // persona principal
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  businessName?: string | null;
  personalAddress?: string | null;
  personalPostalCode?: string | null;
  businessAddress?: string | null;
  businessPostalCode?: string | null;
  rfcCurp?: string | null;
  customerType?: 'contado' | 'credito' | null;
  creditDays?: number | null;
  creditLimit?: number | null;
};

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get<Customer[]>('/customers');
      return data;
    }
  });
}
