import { create } from 'zustand';

interface ConnectionState {
  status: 'online' | 'offline' | 'syncing';
  setStatus: (status: ConnectionState['status']) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'syncing',
  setStatus: (status) => set({ status })
}));
