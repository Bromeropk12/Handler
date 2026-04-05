import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { warehouseAPI, samplesAPI } from '../services/api';

export interface MarketLine {
  id: string;
  name: string;
  shelfCount: number;
  sampleCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  commercial_lines: string[];
  is_active: boolean;
}

export interface Shelf {
  id: string;
  name: string;
  market_line_id: string;
  market_line: MarketLine;
  supplier_id?: string;
  supplier?: Supplier;
  grid_width: number;
  grid_height: number;
  total_capacity: number;
  occupied_cells: number;
  occupancy_percentage: number;
}

export interface DispensedSample {
  id: string;
  global_sample_id: string;
  qr_code: string;
  weight_grams: number;
  status: 'stored' | 'dispatched' | 'expired';
  shelf_id?: string;
  position_x?: number;
  position_y?: number;
  width: number;
  height: number;
}

export interface ShelfMap {
  shelf: Shelf;
  samples: DispensedSample[];
  grid_matrix: (DispensedSample | null)[][];
}

interface WarehouseState {
  // Data
  marketLines: MarketLine[];
  suppliers: Supplier[];
  shelves: Shelf[];
  selectedShelf: Shelf | null;
  shelfMap: ShelfMap | null;

  // UI State
  loading: {
    marketLines: boolean;
    suppliers: boolean;
    shelves: boolean;
    shelfMap: boolean;
  };

  error: {
    marketLines: string | null;
    suppliers: string | null;
    shelves: string | null;
    shelfMap: string | null;
  };

  // Filters
  selectedMarketLineId: string | null;
  searchQuery: string;
}

interface WarehouseActions {
  // Data fetching
  fetchMarketLines: () => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  fetchShelves: (marketLineId?: string) => Promise<void>;
  fetchShelfMap: (shelfId: string) => Promise<void>;

  // Selection
  selectShelf: (shelf: Shelf | null) => void;
  selectMarketLine: (marketLineId: string | null) => void;
  setSearchQuery: (query: string) => void;

  // UI State
  setLoading: (key: keyof WarehouseState['loading'], value: boolean) => void;
  setError: (key: keyof WarehouseState['error'], error: string | null) => void;

  // Utility
  clearErrors: () => void;
  reset: () => void;
}

type WarehouseStore = WarehouseState & WarehouseActions;

const initialState: WarehouseState = {
  marketLines: [],
  suppliers: [],
  shelves: [],
  selectedShelf: null,
  shelfMap: null,

  loading: {
    marketLines: false,
    suppliers: false,
    shelves: false,
    shelfMap: false,
  },

  error: {
    marketLines: null,
    suppliers: null,
    shelves: null,
    shelfMap: null,
  },

  selectedMarketLineId: null,
  searchQuery: '',
};

export const useWarehouseStore = create<WarehouseStore>()(
  immer((set, get) => ({
    ...initialState,

    // Data fetching actions
    fetchMarketLines: async () => {
      set((state) => { state.loading.marketLines = true; state.error.marketLines = null; });

      try {
        const response = await samplesAPI.getMarketLines();
        set((state) => {
          state.marketLines = response.data;
          state.loading.marketLines = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error.marketLines = error?.message || 'Error loading market lines';
          state.loading.marketLines = false;
        });
      }
    },

    fetchSuppliers: async () => {
      set((state) => { state.loading.suppliers = true; state.error.suppliers = null; });

      try {
        const response = await samplesAPI.getSuppliers();
        set((state) => {
          state.suppliers = response.data;
          state.loading.suppliers = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error.suppliers = error?.message || 'Error loading suppliers';
          state.loading.suppliers = false;
        });
      }
    },

    fetchShelves: async (marketLineId) => {
      const targetMarketLineId = marketLineId || get().selectedMarketLineId;

      set((state) => { state.loading.shelves = true; state.error.shelves = null; });

      try {
        const response = await warehouseAPI.getShelves(targetMarketLineId);
        set((state) => {
          state.shelves = response.data;
          state.loading.shelves = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error.shelves = error?.message || 'Error loading shelves';
          state.loading.shelves = false;
        });
      }
    },

    fetchShelfMap: async (shelfId) => {
      set((state) => { state.loading.shelfMap = true; state.error.shelfMap = null; });

      try {
        const response = await warehouseAPI.getShelfMap(shelfId);
        set((state) => {
          state.shelfMap = response.data;
          state.loading.shelfMap = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error.shelfMap = error?.message || 'Error loading shelf map';
          state.loading.shelfMap = false;
        });
      }
    },

    // Selection actions
    selectShelf: (shelf) => set({ selectedShelf: shelf }),

    selectMarketLine: (marketLineId) => set({ selectedMarketLineId: marketLineId }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    // UI State actions
    setLoading: (key, value) => set((state) => { state.loading[key] = value; }),

    setError: (key, error) => set((state) => { state.error[key] = error; }),

    // Utility actions
    clearErrors: () => set((state) => {
      state.error = {
        marketLines: null,
        suppliers: null,
        shelves: null,
        shelfMap: null,
      };
    }),

    reset: () => set(initialState),
  }))
);

// Selectors for optimized re-renders
export const useMarketLines = () => useWarehouseStore((state) => state.marketLines);
export const useSuppliers = () => useWarehouseStore((state) => state.suppliers);
export const useShelves = () => useWarehouseStore((state) => state.shelves);
export const useSelectedShelf = () => useWarehouseStore((state) => state.selectedShelf);
export const useShelfMap = () => useWarehouseStore((state) => state.shelfMap);
export const useWarehouseLoading = () => useWarehouseStore((state) => state.loading);
export const useWarehouseError = () => useWarehouseStore((state) => state.error);

// Computed selectors
export const useFilteredShelves = () => {
  const { shelves, searchQuery, selectedMarketLineId } = useWarehouseStore();

  return shelves.filter((shelf) => {
    const matchesSearch = !searchQuery ||
      shelf.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMarketLine = !selectedMarketLineId ||
      shelf.market_line_id === selectedMarketLineId;

    return matchesSearch && matchesMarketLine;
  });
};

export const useShelfStats = () => {
  const shelves = useWarehouseStore((state) => state.shelves);

  return {
    total: shelves.length,
    full: shelves.filter(s => s.occupancy_percentage >= 100).length,
    almostFull: shelves.filter(s => s.occupancy_percentage >= 80 && s.occupancy_percentage < 100).length,
    available: shelves.filter(s => s.occupancy_percentage < 80).length,
  };
};