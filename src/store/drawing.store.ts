import { create } from 'zustand';
import type { DrawingTreeByDiscipline, DrawingSelection, Revision } from '@/types';
import { getDrawingTree, getDrawingById } from '@/api/drawings';

// 비교 모드에서 각 레이어 상태
export interface CompareLayer {
  revision: Revision;
  visible: boolean;
  opacity: number;
  color: string; // 색상 구분 (tailwind color class)
}

const COMPARE_COLORS = ['#374151', '#2563EB', '#F59E0B', '#10B981'];

interface DrawingState {
  // 트리 데이터
  tree: DrawingTreeByDiscipline;
  treeLoading: boolean;

  // 현재 선택
  selection: DrawingSelection | null;

  // 열린 공종 섹션 (accordion)
  expandedDisciplines: Set<string>;

  // 비교 모드
  compareMode: boolean;
  compareLayers: CompareLayer[];

  // 액션
  loadTree: () => Promise<void>;
  selectDrawing: (drawingId: string, discipline: string, revisionVersion: string) => void;
  toggleDiscipline: (discipline: string) => void;
  setCompareMode: (on: boolean) => void;
  toggleCompareLayer: (version: string) => void;
  setLayerOpacity: (version: string, opacity: number) => void;
  initCompareLayers: (revisions: Revision[]) => void;
}

export const useDrawingStore = create<DrawingState>((set, get) => ({
  tree: {},
  treeLoading: false,
  selection: null,
  expandedDisciplines: new Set<string>(),
  compareMode: false,
  compareLayers: [],

  loadTree: async () => {
    set({ treeLoading: true });
    try {
      const tree = await getDrawingTree();
      set({ tree, treeLoading: false });

      // 첫 번째 공종 자동 확장
      const firstDiscipline = Object.keys(tree)[0];
      if (firstDiscipline) {
        set((s) => ({
          expandedDisciplines: new Set([...s.expandedDisciplines, firstDiscipline]),
        }));
      }
    } catch (e) {
      console.error('Failed to load drawing tree', e);
      set({ treeLoading: false });
    }
  },

  selectDrawing: async (drawingId, discipline, revisionVersion) => {
    set({ selection: { drawingId, discipline, revisionVersion }, compareMode: false });

    // 선택된 도면의 모든 리비전으로 비교 레이어 초기화
    const drawing = await getDrawingById(drawingId);
    if (!drawing?.disciplines?.[discipline]) return;

    const discData = drawing.disciplines[discipline];
    const revisions: Revision[] = discData.revisions ?? [];

    // regions가 있는 경우 (구조 A/B)
    if (discData.regions) {
      Object.values(discData.regions).forEach((region) => {
        revisions.push(...region.revisions);
      });
    }

    get().initCompareLayers(revisions);
  },

  toggleDiscipline: (discipline) => {
    set((s) => {
      const next = new Set(s.expandedDisciplines);
      if (next.has(discipline)) {
        next.delete(discipline);
      } else {
        next.add(discipline);
      }
      return { expandedDisciplines: next };
    });
  },

  setCompareMode: (on) => set({ compareMode: on }),

  toggleCompareLayer: (version) => {
    set((s) => ({
      compareLayers: s.compareLayers.map((layer) =>
        layer.revision.version === version
          ? { ...layer, visible: !layer.visible }
          : layer,
      ),
    }));
  },

  setLayerOpacity: (version, opacity) => {
    set((s) => ({
      compareLayers: s.compareLayers.map((layer) =>
        layer.revision.version === version ? { ...layer, opacity } : layer,
      ),
    }));
  },

  initCompareLayers: (revisions) => {
    const layers: CompareLayer[] = revisions.map((rev, idx) => ({
      revision: rev,
      visible: true,
      opacity: idx === 0 ? 1 : 0.6,
      color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
    }));
    set({ compareLayers: layers });
  },
}));
