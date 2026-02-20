/**
 * Drawings API
 *
 * Mock: metadata.json을 직접 import하여 가공 후 반환
 * Real: apiFetch('/drawings') 등으로 교체
 */

import { mockDelay, apiConfig, apiFetch } from './client';
import metadataRaw from '../../instructions/data/metadata.json';
import type {
  Metadata,
  Drawing,
  DrawingDiscipline,
  DrawingTreeByDiscipline,
  DrawingTreeNode,
  Revision,
} from '@/types';

// JSON을 타입으로 캐스팅 (JSON import는 unknown을 경유해야 안전)
const metadata = metadataRaw as unknown as Metadata;

// 이미지 경로를 public 폴더 기준으로 변환
export function getImageUrl(filename: string): string {
  return `/drawings/${filename}`;
}

// ── Mock 구현체 ──────────────────────────────────────────────

function _getMetadata(): Metadata {
  return metadata;
}

function _getDrawings(): Record<string, Drawing> {
  return metadata.drawings;
}

function _getDrawingById(id: string): Drawing | null {
  return metadata.drawings[id] ?? null;
}

/**
 * 공종(discipline)별로 도면을 그룹화한 트리 반환
 * 스크린샷의 왼쪽 패널 트리 구조에 대응
 */
function _getDrawingTree(): DrawingTreeByDiscipline {
  const tree: DrawingTreeByDiscipline = {};

  // 전체 배치도(00)는 모든 공종의 최상단에 추가
  const rootDrawing = metadata.drawings['00'];
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
  Object.values(metadata.drawings).forEach((drawing) => {
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
  const disciplineOrder = ['전체', ...metadata.disciplines.map((d) => d.name)];
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
  if (apiConfig.useMock) return mockDelay(_getMetadata());
  return apiFetch<Metadata>('/drawings/metadata');
}

export async function getDrawings(): Promise<Record<string, Drawing>> {
  if (apiConfig.useMock) return mockDelay(_getDrawings());
  return apiFetch<Record<string, Drawing>>('/drawings');
}

export async function getDrawingById(id: string): Promise<Drawing | null> {
  if (apiConfig.useMock) return mockDelay(_getDrawingById(id));
  return apiFetch<Drawing | null>(`/drawings/${id}`);
}

export async function getDrawingTree(): Promise<DrawingTreeByDiscipline> {
  if (apiConfig.useMock) return mockDelay(_getDrawingTree());
  return apiFetch<DrawingTreeByDiscipline>('/drawings/tree');
}

export { _getAllRevisions as getAllRevisions };

/** parent가 parentId인 모든 Drawing 동기 반환 (metadata가 이미 로드되어 있음) */
export function getChildDrawings(parentId: string): Drawing[] {
  return Object.values(metadata.drawings).filter((d) => d.parent === parentId);
}
