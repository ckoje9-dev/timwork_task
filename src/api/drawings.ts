/**
 * Drawings API
 *
 * Mock: /metadata.json(public)을 fetch하여 가공 후 반환
 * Real: apiFetch('/drawings') 등으로 교체
 */

import { mockDelay, apiConfig, apiFetch } from './client';
import type {
  Metadata,
  Drawing,
  DrawingDiscipline,
  DrawingTreeByDiscipline,
  DrawingTreeNode,
  Revision,
} from '@/types';

// 이미지 경로를 public 폴더 기준으로 변환
export function getImageUrl(filename: string): string {
  return `/drawings/${filename}`;
}

// ── metadata 캐시 ────────────────────────────────────────────

let _metadataCache: Metadata | null = null;

async function ensureMetadata(): Promise<Metadata> {
  if (_metadataCache) return _metadataCache;
  const res = await fetch('/metadata.json');
  if (!res.ok) throw new Error(`Failed to load metadata: ${res.status}`);
  _metadataCache = (await res.json()) as Metadata;
  return _metadataCache;
}

// ── Mock 구현체 ──────────────────────────────────────────────

async function _getMetadata(): Promise<Metadata> {
  return ensureMetadata();
}

async function _getDrawings(): Promise<Record<string, Drawing>> {
  const m = await ensureMetadata();
  return m.drawings;
}

async function _getDrawingById(id: string): Promise<Drawing | null> {
  const m = await ensureMetadata();
  return m.drawings[id] ?? null;
}

/**
 * 공종(discipline)별로 도면을 그룹화한 트리 반환
 */
async function _getDrawingTree(): Promise<DrawingTreeByDiscipline> {
  const m = await ensureMetadata();
  const tree: DrawingTreeByDiscipline = {};

  // 전체 배치도(00)는 모든 공종의 최상단에 추가
  const rootDrawing = m.drawings['00'];
  if (rootDrawing) {
    const rootNode: DrawingTreeNode = {
      drawingId: '00',
      drawingName: rootDrawing.name,
      discipline: '전체',
      latestRevision: null,
      revisionCount: 0,
    };
    tree['전체'] = [rootNode];
  }

  // 나머지 도면들을 공종별로 그룹화
  Object.values(m.drawings).forEach((drawing) => {
    if (!drawing.disciplines) return;

    Object.entries(drawing.disciplines).forEach(([discipline, discData]) => {
      if (!tree[discipline]) tree[discipline] = [];

      const revisions = _getAllRevisions(discData);
      const latestRevision = revisions[revisions.length - 1] ?? null;

      tree[discipline].push({
        drawingId: drawing.id,
        drawingName: drawing.name,
        discipline,
        latestRevision,
        revisionCount: revisions.length,
      });
    });
  });

  // 공종 순서 정렬 (metadata.disciplines 순서 준수)
  const disciplineOrder = ['전체', ...m.disciplines.map((d) => d.name)];
  const sorted: DrawingTreeByDiscipline = {};
  disciplineOrder.forEach((d) => {
    if (tree[d]) sorted[d] = tree[d];
  });

  return sorted;
}

/** discipline 내 모든 revisions를 평탄화 (regions 포함) */
function _getAllRevisions(disciplineData: DrawingDiscipline): Revision[] {
  const revisions: Revision[] = [];

  if (disciplineData.revisions) {
    revisions.push(...disciplineData.revisions);
  }

  if (disciplineData.regions) {
    Object.values(disciplineData.regions).forEach((region) => {
      revisions.push(...region.revisions);
    });
  }

  return revisions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

// ── Public API 함수 (Mock ↔ Real 스위칭) ─────────────────────

export async function getMetadata(): Promise<Metadata> {
  if (apiConfig.useMock) return mockDelay(await _getMetadata());
  return apiFetch<Metadata>('/drawings/metadata');
}

export async function getDrawings(): Promise<Record<string, Drawing>> {
  if (apiConfig.useMock) return mockDelay(await _getDrawings());
  return apiFetch<Record<string, Drawing>>('/drawings');
}

export async function getDrawingById(id: string): Promise<Drawing | null> {
  if (apiConfig.useMock) return mockDelay(await _getDrawingById(id));
  return apiFetch<Drawing | null>(`/drawings/${id}`);
}

export async function getDrawingTree(): Promise<DrawingTreeByDiscipline> {
  if (apiConfig.useMock) return mockDelay(await _getDrawingTree());
  return apiFetch<DrawingTreeByDiscipline>('/drawings/tree');
}

export { _getAllRevisions as getAllRevisions };

/** parent가 parentId인 모든 Drawing 반환 */
export async function getChildDrawings(parentId: string): Promise<Drawing[]> {
  const m = await ensureMetadata();
  return Object.values(m.drawings).filter((d) => d.parent === parentId);
}
