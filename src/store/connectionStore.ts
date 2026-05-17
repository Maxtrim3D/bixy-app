import { create } from 'zustand';
import type { ConnectionMode } from '@/types';

interface ConnectionState {
  mode: ConnectionMode;
  setMode: (mode: ConnectionMode) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  mode: 'connecting',
  setMode: (mode) => set({ mode }),
}));
