import { useMemo } from 'react';
import { create } from 'zustand';
import { calculateLoan } from '../utils/calculations';
import type { CalculationResult, LoanInput, WiborEntry } from '../utils/calculations';
import { getDefaultWiborEntries } from '../data/defaults';
import type { Case, WiborDataset } from './types';
import { toDateString } from '../utils/formatters';
import { toLoanInput, toStoredInput } from './serialization';
import * as caseStore from './caseStore';
import * as wiborStore from './wiborStore';

const DEFAULT_APP_MODULES = ['calculator'];

function loadEnabledAppModules(): string[] {
  try {
    const stored = localStorage.getItem('enabledAppModules');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return DEFAULT_APP_MODULES;
}

function parseHash(): string {
  return location.hash.replace(/^#\/?/, '') || 'summary';
}

interface CaseStore {
  // State
  cases: Case[];
  activeCaseId: string | null;
  activeInput: LoanInput | null;
  wiborData: WiborEntry[];
  wiborDatasetId: string | null;
  activeTab: string;
  enabledAppModules: string[];
  openSheet: string | null;
  ready: boolean;

  // Actions
  init: () => Promise<void>;
  createCase: (name: string) => Promise<void>;
  loadCase: (id: string) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  renameCase: (id: string, name: string) => void;
  updateInput: (input: LoanInput) => void;
  updateWiborData: (data: WiborEntry[]) => Promise<void>;
  setActiveTab: (tab: string) => void;
  setEnabledAppModules: (ids: string[]) => void;
  openSheetModule: (id: string) => void;
  closeSheet: () => void;
}

async function doLoadCase(c: Case, datasets?: WiborDataset[]) {
  const patch: Partial<CaseStore> = {
    activeCaseId: c.id,
    activeInput: toLoanInput(c.input),
    activeTab: 'summary',
  };

  if (c.wiborDatasetId) {
    const ds = datasets
      ? datasets.find(d => d.id === c.wiborDatasetId)
      : await wiborStore.getDataset(c.wiborDatasetId);
    if (ds) {
      useCases.setState({ ...patch, wiborData: ds.entries, wiborDatasetId: ds.id });
      return;
    }
  }
  useCases.setState({ ...patch, wiborData: getDefaultWiborEntries(), wiborDatasetId: null });
}

function updateCaseAndSave(id: string, patch: Partial<Case>) {
  const { cases } = useCases.getState();
  const updated = cases.map(c => c.id === id ? { ...c, ...patch } : c);
  useCases.setState({ cases: updated });
  const updatedCase = updated.find(c => c.id === id);
  if (updatedCase) caseStore.saveCase(updatedCase);
}

export const useCases = create<CaseStore>((set, get) => ({
  cases: [],
  activeCaseId: null,
  activeInput: null,
  wiborData: getDefaultWiborEntries(),
  wiborDatasetId: null,
  activeTab: 'summary',
  enabledAppModules: loadEnabledAppModules(),
  openSheet: null,
  ready: false,

  init: async () => {
    set({ activeTab: parseHash() });
    window.addEventListener('hashchange', () => {
      useCases.setState({ activeTab: parseHash() });
    });

    const [allCases, allDatasets] = await Promise.all([
      caseStore.getAllCases(),
      wiborStore.getAllDatasets(),
    ]);
    set({ cases: allCases });
    if (allCases.length > 0) await doLoadCase(allCases[0], allDatasets);
    set({ ready: true });
  },

  createCase: async (name) => {
    const c = caseStore.createNewCase(name);
    await caseStore.saveCase(c);
    set(s => ({ cases: [c, ...s.cases] }));
    await doLoadCase(c);
  },

  loadCase: async (id) => {
    const c = await caseStore.getCase(id);
    if (c) await doLoadCase(c);
  },

  deleteCase: async (id) => {
    await caseStore.deleteCase(id);
    const { activeCaseId } = get();
    set(s => ({
      cases: s.cases.filter(c => c.id !== id),
      ...(activeCaseId === id ? { activeCaseId: null, activeInput: null } : {}),
    }));
  },

  renameCase: (id, name) => {
    updateCaseAndSave(id, { name, updatedAt: new Date().toISOString() });
  },

  updateInput: (input) => {
    set({ activeInput: input });
    const { activeCaseId } = get();
    if (activeCaseId) {
      updateCaseAndSave(activeCaseId, {
        input: toStoredInput(input),
        updatedAt: new Date().toISOString(),
      });
    }
  },

  updateWiborData: async (data) => {
    const ds: WiborDataset = {
      id: crypto.randomUUID(),
      name: `Import ${toDateString(new Date())}`,
      createdAt: new Date().toISOString(),
      entries: data,
    };
    await wiborStore.saveDataset(ds);
    set({ wiborData: data, wiborDatasetId: ds.id });

    const { activeCaseId, cases } = get();
    if (activeCaseId) {
      const activeCase = cases.find(c => c.id === activeCaseId);
      const oldDatasetId = activeCase?.wiborDatasetId;
      updateCaseAndSave(activeCaseId, { wiborDatasetId: ds.id });
      if (oldDatasetId) {
        const otherUsesOld = cases.some(c => c.id !== activeCaseId && c.wiborDatasetId === oldDatasetId);
        if (!otherUsesOld) wiborStore.deleteDataset(oldDatasetId);
      }
    }
  },

  setActiveTab: (tab) => {
    location.hash = tab === 'summary' ? '/' : `/${tab}`;
    set({ activeTab: tab });
  },
  setEnabledAppModules: (ids) => {
    set({ enabledAppModules: ids });
    try { localStorage.setItem('enabledAppModules', JSON.stringify(ids)); } catch {}
  },
  openSheetModule: (id) => set({ openSheet: id }),
  closeSheet: () => set({ openSheet: null }),
}));

// Derived selectors
export function useResult(): CalculationResult | null {
  const activeInput = useCases(s => s.activeInput);
  const wiborData = useCases(s => s.wiborData);
  return useMemo(
    () => activeInput ? calculateLoan({ ...activeInput, wiborData }) : null,
    [activeInput, wiborData],
  );
}

export function useInput(): LoanInput | null {
  return useCases(s => s.activeInput);
}

export function useWiborSource(): 'default' | 'custom' {
  return useCases(s => s.wiborDatasetId ? 'custom' : 'default');
}
