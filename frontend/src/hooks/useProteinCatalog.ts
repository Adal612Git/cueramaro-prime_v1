import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type ProteinSubType = { id: string; name: string; typeId: string };
export type ProteinType = { id: string; name: string; subtypes: ProteinSubType[] };

export function useProteinCatalog() {
  return useQuery<ProteinType[]>({
    queryKey: ['protein-catalog'],
    queryFn: async () => {
      const { data } = await api.get<ProteinType[]>('/catalogs/protein-types');
      return data;
    },
    staleTime: 60_000
  });
}

