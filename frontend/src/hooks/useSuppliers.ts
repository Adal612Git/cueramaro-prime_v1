import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type Supplier = {
  id: string;
  name: string; // negocio/empresa
  contact?: string | null; // persona de contacto
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  company?: string | null; // alias de negocio si aplica
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  website?: string | null;
  rfcCurp?: string | null;
  creditTerms?: 'contado' | 'credito' | null;
  creditDays?: number | null;
  proteinType?: { id: string; name: string } | null;
  proteinSubType?: { id: string; name: string } | null;
  commercialInfo?: any;
};

export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await api.get<Supplier[]>('/suppliers');
      return data;
    }
  });
}
