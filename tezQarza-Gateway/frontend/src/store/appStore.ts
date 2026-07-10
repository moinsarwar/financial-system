import { create } from 'zustand';
import { Product, Application } from '../types';

interface AppState {
  products: Product[];
  applications: Application[];
  setProducts: (products: Product[]) => void;
  addApplication: (app: Application) => void;
}

export const useAppStore = create<AppState>((set) => ({
  products: [],
  applications: [],
  setProducts: (products) => set({ products }),
  addApplication: (app) => set((state) => ({ applications: [app, ...state.applications] })),
}));
