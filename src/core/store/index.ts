import { create } from 'zustand';

interface CounterState {
  count: number;
  history: number[];
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  history: [],
  increment: () => set((state) => ({ count: state.count + 1, history: [...state.history, state.count + 1] })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0, history: [] }),
}));
