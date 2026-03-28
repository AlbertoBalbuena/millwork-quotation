import { create } from 'zustand';
import { supabase } from './supabase';

export interface SettingsCache {
  laborCostNoDrawers: number;
  laborCostWithDrawers: number;
  laborCostAccessories: number;
  wastePercentageBox: number;
  wastePercentageDoors: number;
  exchangeRateUsdToMxn: number;
}

const DEFAULT_SETTINGS: SettingsCache = {
  laborCostNoDrawers: 400,
  laborCostWithDrawers: 600,
  laborCostAccessories: 100,
  wastePercentageBox: 10,
  wastePercentageDoors: 10,
  exchangeRateUsdToMxn: 18,
};

const CACHE_DURATION = 5 * 60 * 1000;

interface SettingsStore {
  settings: SettingsCache;
  isLoaded: boolean;
  isLoading: boolean;
  lastFetch: number;
  fetchSettings: () => Promise<SettingsCache>;
}

let pendingFetch: Promise<SettingsCache> | null = null;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  isLoaded: false,
  isLoading: false,
  lastFetch: 0,

  fetchSettings: async () => {
    const { lastFetch, settings, isLoaded } = get();
    const now = Date.now();

    if (isLoaded && (now - lastFetch) < CACHE_DURATION) {
      return settings;
    }

    if (pendingFetch) return pendingFetch;

    pendingFetch = (async () => {
      set({ isLoading: true });
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value');

        if (error) throw error;

        const raw = data?.reduce((acc, item) => {
          acc[item.key] = parseFloat(item.value);
          return acc;
        }, {} as Record<string, number>) || {};

        const newSettings: SettingsCache = {
          laborCostNoDrawers: raw.labor_cost_no_drawers || 400,
          laborCostWithDrawers: raw.labor_cost_with_drawers || 600,
          laborCostAccessories: raw.labor_cost_accessories || 100,
          wastePercentageBox: raw.waste_percentage_box || 10,
          wastePercentageDoors: raw.waste_percentage_doors || 10,
          exchangeRateUsdToMxn: raw.exchange_rate_usd_to_mxn || 18,
        };

        set({ settings: newSettings, isLoaded: true, isLoading: false, lastFetch: Date.now() });
        return newSettings;
      } catch (error) {
        console.error('Error loading settings:', error);
        set({ isLoading: false });
        return get().settings;
      } finally {
        pendingFetch = null;
      }
    })();

    return pendingFetch;
  },
}));

// Backward-compatible async function for lib/ consumers
export async function getSettings(): Promise<SettingsCache> {
  return useSettingsStore.getState().fetchSettings();
}

// Backward-compatible cache invalidation
export function clearSettingsCache() {
  useSettingsStore.setState({ lastFetch: 0, isLoaded: false });
}
