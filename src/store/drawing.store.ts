import { create } from 'zustand';
import type { DrawingTreeByDiscipline, DrawingSelection, DrawingTreeNode, Revision, ImageTransform } from '@/types';
import { getDrawingTree, getDrawingById } from '@/api/drawings';

export interface IssuePin {
  id: string;
  drawingId: string;
  discipline: string;
  revisionVersion: string;
  x: number; // image pixel coordinate
  y: number;
  issueNumber: number;
  title: string;
  reporter: string; // 성씨 한 글자 표시용
  status: 'open' | 'resolved';
}

export interface LayerItem {
  revision: Revision;
  opacity: number;
  color: string;
  imageTransform?: ImageTransform;
}

export interface DisciplineGroup {
  discipline: string;
  drawingName: string;
  visible: boolean;
  layers: LayerItem[]; // 최신 리비전이 앞 (newest first)
}

// 공종별 색상 팔레트 (같은 톤, 리비전마다 명도 변화)
const DISCIPLINE_COLORS: Record<string, string[]> = {
  '건축':    ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB'],
  '구조':    ['#B45309', '#D97706', '#FCD34D', '#FDE68A'],
  '소방':    ['#DC2626', '#EF4444', '#F87171', '#FCA5A5'],
  '공조설비': ['#1E40AF', '#2563EB', '#60A5FA', '#93C5FD'],
  '배관설비': ['#059669', '#10B981', '#34D399', '#6EE7B7'],
  '설비':    ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD'],
  '조경':    ['#16A34A', '#22C55E', '#4ADE80', '#86EFAC'],
};
const DEFAULT_COLORS = ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];

function getDisciplineColors(discipline: string): string[] {
  return DISCIPLINE_COLORS[discipline] ?? DEFAULT_COLORS;
}

interface DrawingState {
  // 트리 데이터
  tree: DrawingTreeByDiscipline;
  treeLoading: boolean;

  // 현재 선택
  selection: DrawingSelection | null;

  // 베이스 도면 이미지 (공종/리비전 없는 도면의 폴백)
  baseDrawingImage: string | null;

  // 열린 공종 섹션 (accordion)
  expandedDisciplines: Set<string>;

  // 북마크 (key: `${drawingId}-${discipline}`)
  bookmarkedDrawings: Set<string>;

  // 비교 모드
  compareMode: boolean;

  // 공종별 레이어 그룹 (선택 공종이 첫 번째)
  disciplineGroups: DisciplineGroup[];

  // 이슈 핀
  issueVisible: boolean;
  issuePins: IssuePin[];

  // 로컬(업로드/업데이트) 리비전 저장소 (key: `${drawingId}-${discipline}`)
  localRevisions: Record<string, Revision[]>;

  // 액션
  loadTree: () => Promise<void>;
  selectDrawing: (drawingId: string, discipline: string, revisionVersion: string) => void;
  toggleDiscipline: (discipline: string) => void;
  toggleBookmark: (drawingId: string, discipline: string) => void;
  setCompareMode: (on: boolean) => void;
  setRevisionVersion: (version: string) => void;
  setIssueVisible: (visible: boolean) => void;
  addIssuePin: (drawingId: string, discipline: string, revisionVersion: string, x: number, y: number) => void;
  removeIssuePin: (id: string) => void;
  expandDiscipline: (discipline: string) => void;
  toggleDisciplineGroup: (discipline: string) => void;
  setGroupLayerOpacity: (discipline: string, version: string, opacity: number) => void;
  deleteDrawing: (drawingId: string, discipline: string) => void;
  addDrawingToTree: (node: DrawingTreeNode) => void;
  updateDrawingRevision: (drawingId: string, discipline: string, revision: Revision) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  tree: {},
  treeLoading: false,
  selection: null,
  baseDrawingImage: null,
  expandedDisciplines: new Set<string>(),
  bookmarkedDrawings: new Set<string>(),
  compareMode: false,
  disciplineGroups: [],
  issueVisible: true,
  issuePins: [],
  localRevisions: {},

  loadTree: async () => {
    set({ treeLoading: true });
    try {
      const tree = await getDrawingTree();
      set({ tree, treeLoading: false });

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
    // 선택된 공종 섹션을 자동으로 펼침
    set((s) => ({
      selection: { drawingId, discipline, revisionVersion },
      compareMode: false,
      expandedDisciplines: new Set([...s.expandedDisciplines, discipline]),
    }));

    const drawing = await getDrawingById(drawingId);
    set({ baseDrawingImage: drawing?.image ?? null });

    if (!drawing?.disciplines) {
      // metadata에 없는 도면 (업로드된 도면): localRevisions로 DisciplineGroup 구성
      set((s) => {
        const key = `${drawingId}-${discipline}`;
        const revisions = s.localRevisions[key] ?? [];
        if (revisions.length === 0) return {};

        const colors = getDisciplineColors(discipline);
        const node = s.tree[discipline]?.find((n) => n.drawingId === drawingId);
        const sorted = [...revisions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        const layers: LayerItem[] = sorted.map((rev, idx) => ({
          revision: rev,
          opacity: idx === 0 ? 1 : 0.6,
          color: colors[idx % colors.length],
          imageTransform: rev.imageTransform,
        }));

        return {
          disciplineGroups: [{
            discipline,
            drawingName: node?.drawingName ?? drawingId,
            visible: true,
            layers,
          }],
          baseDrawingImage: sorted[0]?.image ?? null,
        };
      });
      return;
    }

    const groups: DisciplineGroup[] = Object.entries(drawing.disciplines)
      .map(([discName, discData]) => {
        const isSelected = discName === discipline;
        const colors = getDisciplineColors(discName);

        // 모든 리비전 수집 후 최신순 정렬
        const revs: Revision[] = [...(discData.revisions ?? [])];
        if (discData.regions) {
          Object.values(discData.regions).forEach((r) => revs.push(...r.revisions));
        }
        revs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        let layers: LayerItem[] = revs.map((rev, idx) => ({
          revision: rev,
          opacity: isSelected && idx === 0 ? 1 : 0.6,
          color: colors[idx % colors.length],
          // revision 자체에 transform이 없으면 discipline 공통 transform 사용
          imageTransform: rev.imageTransform ?? discData.imageTransform,
        }));

        // discipline.image가 있는데 revisions가 비어있으면 합성 레이어 추가
        if (layers.length === 0 && discData.image) {
          layers = [{
            revision: {
              version: discName,
              image: discData.image,
              date: '',
              description: '',
              changes: [],
              imageTransform: discData.imageTransform,
            },
            opacity: 0.6,
            color: colors[0],
            imageTransform: discData.imageTransform,
          }];
        }

        return {
          discipline: discName,
          drawingName: drawing.name,
          visible: isSelected,
          layers,
        } as DisciplineGroup;
      })
      .filter((g) => g.layers.length > 0);

    // 선택된 공종을 첫 번째로
    groups.sort((a, b) => {
      if (a.discipline === discipline) return -1;
      if (b.discipline === discipline) return 1;
      return 0;
    });

    set({ disciplineGroups: groups });
  },

  toggleDiscipline: (discipline) => {
    set((s) => {
      const next = new Set(s.expandedDisciplines);
      if (next.has(discipline)) next.delete(discipline);
      else next.add(discipline);
      return { expandedDisciplines: next };
    });
  },

  toggleBookmark: (drawingId, discipline) => {
    set((s) => {
      const key = `${drawingId}-${discipline}`;
      const next = new Set(s.bookmarkedDrawings);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { bookmarkedDrawings: next };
    });
  },

  setCompareMode: (on) => set({ compareMode: on }),

  setIssueVisible: (visible) => set({ issueVisible: visible }),

  addIssuePin: (drawingId, discipline, revisionVersion, x, y) => {
    set((s) => {
      const count = s.issuePins.filter(
        (p) =>
          p.drawingId === drawingId &&
          p.discipline === discipline &&
          p.revisionVersion === revisionVersion,
      ).length;
      const pin: IssuePin = {
        id: `${drawingId}-${discipline}-${revisionVersion}-${Date.now()}`,
        drawingId,
        discipline,
        revisionVersion,
        x,
        y,
        issueNumber: count + 1,
        title: `새 이슈 #${count + 1}`,
        reporter: '나',
        status: 'open',
      };
      return { issuePins: [...s.issuePins, pin] };
    });
  },

  removeIssuePin: (id) => {
    set((s) => ({ issuePins: s.issuePins.filter((p) => p.id !== id) }));
  },

  setRevisionVersion: (version) => {
    set((s) => ({
      selection: s.selection ? { ...s.selection, revisionVersion: version } : null,
    }));
  },

  expandDiscipline: (discipline) => {
    set((s) => ({
      expandedDisciplines: new Set([...s.expandedDisciplines, discipline]),
    }));
  },

  toggleDisciplineGroup: (discipline) => {
    set((s) => ({
      disciplineGroups: s.disciplineGroups.map((g) =>
        g.discipline === discipline ? { ...g, visible: !g.visible } : g,
      ),
    }));
  },

  setGroupLayerOpacity: (discipline, version, opacity) => {
    set((s) => ({
      disciplineGroups: s.disciplineGroups.map((g) =>
        g.discipline === discipline
          ? {
              ...g,
              layers: g.layers.map((l) =>
                l.revision.version === version ? { ...l, opacity } : l,
              ),
            }
          : g,
      ),
    }));
  },

  deleteDrawing: (drawingId, discipline) => {
    set((s) => {
      const newTree: DrawingTreeByDiscipline = {};
      for (const [disc, nodes] of Object.entries(s.tree)) {
        const filtered = nodes.filter(
          (n) => !(n.drawingId === drawingId && disc === discipline),
        );
        if (filtered.length > 0) newTree[disc] = filtered;
      }
      const wasSelected =
        s.selection?.drawingId === drawingId && s.selection?.discipline === discipline;
      const key = `${drawingId}-${discipline}`;
      const { [key]: _removed, ...remainingLocalRevisions } = s.localRevisions;
      return {
        tree: newTree,
        localRevisions: remainingLocalRevisions,
        ...(wasSelected
          ? { selection: null, disciplineGroups: [], baseDrawingImage: null }
          : {}),
      };
    });
  },

  addDrawingToTree: (node) => {
    set((s) => {
      const key = `${node.drawingId}-${node.discipline}`;
      const newRevisions = node.latestRevision
        ? [...(s.localRevisions[key] ?? []), node.latestRevision]
        : (s.localRevisions[key] ?? []);
      return {
        tree: {
          ...s.tree,
          [node.discipline]: [...(s.tree[node.discipline] ?? []), node],
        },
        localRevisions: {
          ...s.localRevisions,
          [key]: newRevisions,
        },
      };
    });
  },

  updateDrawingRevision: (drawingId, discipline, revision) => {
    set((s) => {
      // 트리 노드 latestRevision + revisionCount 업데이트
      const newTree: DrawingTreeByDiscipline = {};
      for (const [disc, nodes] of Object.entries(s.tree)) {
        newTree[disc] = nodes.map((n) =>
          n.drawingId === drawingId && disc === discipline
            ? { ...n, latestRevision: revision, revisionCount: n.revisionCount + 1 }
            : n,
        );
      }

      // disciplineGroups에 새 레이어 맨 앞에 추가 (나머지는 opacity 0.6으로)
      const colors = getDisciplineColors(discipline);
      const newLayer: LayerItem = {
        revision,
        opacity: 1,
        color: colors[0],
        imageTransform: revision.imageTransform,
      };
      const newDisciplineGroups = s.disciplineGroups.map((g) =>
        g.discipline === discipline
          ? {
              ...g,
              layers: [newLayer, ...g.layers.map((l) => ({ ...l, opacity: 0.6 }))],
            }
          : g,
      );

      // localRevisions에 새 리비전 추가 (재선택 시 복원용)
      const key = `${drawingId}-${discipline}`;
      const newLocalRevisions = {
        ...s.localRevisions,
        [key]: [...(s.localRevisions[key] ?? []), revision],
      };

      return {
        tree: newTree,
        disciplineGroups: newDisciplineGroups,
        localRevisions: newLocalRevisions,
        selection: s.selection
          ? { ...s.selection, revisionVersion: revision.version }
          : null,
      };
    });
  },
}));
