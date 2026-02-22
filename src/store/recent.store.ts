import { create } from 'zustand';
import type { RecentItem } from '@/types';

const STORAGE_KEY = 'timwork-recent-items';
const MAX_ITEMS = 7;

function loadFromStorage(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentItem[];
  } catch {
    return [];
  }
}

function saveToStorage(items: RecentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

interface RecentState {
  recentItems: RecentItem[];
  addRecentItem: (item: RecentItem) => void;
  clearRecentItems: () => void;
}

export const useRecentStore = create<RecentState>((set) => ({
  recentItems: loadFromStorage(),

  addRecentItem: (item) => {
    set((s) => {
      // 동일 id 있으면 제거 후 맨 앞에 추가, 최대 MAX_ITEMS개 유지
      const filtered = s.recentItems.filter((i) => i.id !== item.id);
      const updated = [item, ...filtered].slice(0, MAX_ITEMS);
      saveToStorage(updated);
      return { recentItems: updated };
    });
  },

  clearRecentItems: () => {
    saveToStorage([]);
    set({ recentItems: [] });
  },
}));
