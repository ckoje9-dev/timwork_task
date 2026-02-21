import { create } from 'zustand';
import type { Issue, IssueFilter } from '@/types';
import { getIssues, getIssueById, getIssueGroups, createIssue as apiCreateIssue } from '@/api/issues';
import type { CreateIssueData } from '@/components/issues/IssueCreateModal';

interface IssueState {
  issues: Issue[];
  loading: boolean;
  selectedIssue: Issue | null;
  filter: IssueFilter;
  groups: string[];

  // 액션
  loadIssues: () => Promise<void>;
  loadGroups: () => Promise<void>;
  selectIssue: (id: string) => Promise<void>;
  clearSelectedIssue: () => void;
  setFilter: (patch: Partial<IssueFilter>) => void;
  resetFilter: () => void;
  createIssue: (data: CreateIssueData) => Promise<void>;
}

const DEFAULT_FILTER: IssueFilter = {
  keyword: '',
  status: 'ALL',
  priority: 'ALL',
  group: 'ALL',
};

export const useIssueStore = create<IssueState>((set, get) => ({
  issues: [],
  loading: false,
  selectedIssue: null,
  filter: DEFAULT_FILTER,
  groups: [],

  loadIssues: async () => {
    set({ loading: true });
    try {
      const issues = await getIssues(get().filter);
      set({ issues, loading: false });
    } catch (e) {
      console.error('Failed to load issues', e);
      set({ loading: false });
    }
  },

  loadGroups: async () => {
    const groups = await getIssueGroups();
    set({ groups });
  },

  selectIssue: async (id) => {
    const issue = await getIssueById(id);
    set({ selectedIssue: issue });
  },

  clearSelectedIssue: () => set({ selectedIssue: null }),

  setFilter: (patch) => {
    set((s) => ({ filter: { ...s.filter, ...patch } }));
    get().loadIssues();
  },

  resetFilter: () => {
    set({ filter: DEFAULT_FILTER });
    get().loadIssues();
  },

  createIssue: async (data) => {
    await apiCreateIssue(data);
    await get().loadIssues();
    await get().loadGroups();
  },
}));
