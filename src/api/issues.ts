/**
 * Issues API
 *
 * Mock: 하드코딩된 이슈 데이터 반환
 * Real: apiFetch('/issues') 등으로 교체
 */

import { mockDelay, apiConfig, apiFetch } from './client';
import type { Issue, IssueFilter } from '@/types';

// ── Mock 데이터 ──────────────────────────────────────────────

const MOCK_ISSUES: Issue[] = [
  // ── 오래된 순 (낮은 번호) → 최신 순 (높은 번호) ──────────────
  {
    id: 'issue-21',
    number: 21,
    type: '추가',
    title: '독서실 추가 반영 검토',
    content: '주민공동시설 REV3에 독서실이 추가되었습니다. 설비/소방 도면 반영 여부 확인 필요.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    assignee: '송하용',
    reporter: '정지원',
    group: null,
    labels: ['설비', '소방'],
    publishedAt: '2026-02-10',
    dueDate: '2026-03-10',
    relatedDrawings: ['09_주민공동시설 건축 REV3'],
  },
  {
    id: 'issue-22',
    number: 22,
    type: '수정',
    title: '내진 설계 반영 확인',
    content: '101동 구조 REV2A에 내진 설계 반영 여부 현장 확인 요청.',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    assignee: '박현근',
    reporter: '홍지호',
    group: null,
    labels: ['구조'],
    publishedAt: '2026-02-11',
    dueDate: '2026-02-28',
    relatedDrawings: ['05_구조 REV2A'],
  },
  {
    id: 'issue-23',
    number: 23,
    type: '추가',
    title: '회의실 확장',
    content: '주민공동시설 회의실을 REV2 도면 기준으로 확장 요청이 들어왔습니다. 관련 팀 검토 요청드립니다.',
    status: 'DONE',
    priority: 'MEDIUM',
    assignee: '박현근',
    reporter: '정지원',
    group: null,
    labels: [],
    publishedAt: '2026-02-12',
    dueDate: '2026-02-22',
    relatedDrawings: ['09_주민공동시설 건축 평면도'],
  },
  {
    id: 'issue-24',
    number: 24,
    type: '추가',
    title: '소방 배관 도면 누락',
    content: '주차장 소방 배관 도면에서 A구역 일부 누락 확인. 재발행 요청.',
    status: 'TODO',
    priority: 'HIGH',
    assignee: '김미네',
    reporter: '양승호',
    group: null,
    labels: [],
    publishedAt: '2026-02-13',
    dueDate: '2026-03-03',
    relatedDrawings: ['14_주차장 소방 평면도'],
  },
  {
    id: 'issue-25',
    number: 25,
    type: '간섭',
    title: '배수관 간섭',
    content: '주차장 배수관이 조경 수목 위치와 겹칩니다. 조경팀과 협의 후 배수관 경로 조정 필요.',
    status: 'DONE',
    priority: 'MEDIUM',
    assignee: '양승호',
    reporter: '정지원',
    group: null,
    labels: [],
    publishedAt: '2026-02-14',
    dueDate: '2026-02-25',
    relatedDrawings: ['15_주차장 설비 평면도'],
  },
  {
    id: 'issue-26',
    number: 26,
    type: '수정',
    title: '장애인 주차칸 배치 변경',
    content: '장애인 주차 구역 위치가 법규 기준 거리를 만족하지 않습니다. 재배치가 필요합니다.',
    status: 'DONE',
    priority: 'HIGH',
    assignee: '송하용',
    reporter: '김미네',
    group: '03.08 회의',
    labels: [],
    publishedAt: '2026-02-17',
    dueDate: '2026-02-27',
    relatedDrawings: ['주차장 평면도'],
  },
  {
    id: 'issue-27',
    number: 27,
    type: '간섭',
    title: '구조보, 스프링클러 배관 간섭',
    content:
      '101동 1층 구조보 하단부와 스프링클러 배관이 간섭됩니다. 배관 경로 조정 또는 보 높이 검토가 필요합니다.',
    status: 'IN_REVIEW',
    priority: 'URGENT',
    assignee: '송하용',
    reporter: '홍지호',
    group: '03.08 회의',
    labels: [],
    publishedAt: '2026-02-18',
    dueDate: '2026-03-01',
    relatedDrawings: ['04_구조 평면도', '08_소방 평면도'],
  },
  {
    id: 'issue-28',
    number: 28,
    type: '간섭',
    title: '공조실 덕트 변경',
    content: '공조실 덕트 경로가 구조 보와 간섭됩니다. 설비 도면 수정 필요합니다.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignee: '박현근',
    reporter: '홍지호',
    group: '03.08 회의',
    labels: [],
    publishedAt: '2026-02-19',
    dueDate: '2026-03-08',
    relatedDrawings: ['03_공조설비 평면도'],
  },
  {
    id: 'issue-29',
    number: 29,
    type: '수정',
    title: 'EPS실 변경',
    content: 'EPS실 위치가 구조 도면과 상이합니다. 건축 도면 기준으로 수정 요청드립니다.',
    status: 'TODO',
    priority: 'HIGH',
    assignee: '양승호',
    reporter: '김미네',
    group: '03.08 회의',
    labels: [],
    publishedAt: '2026-02-20',
    dueDate: '2026-03-05',
    relatedDrawings: ['01_101동 지상1층 평면도'],
  },
  {
    id: 'issue-30',
    number: 30,
    type: '수정',
    title: '화장실 마감재 변경',
    content:
      '1층을 제외한 전층 화장실 마감재 타일 300x300에서 600x900으로 변경했습니다.\n\n전개도 및 내역 반영 바랍니다.',
    status: 'DONE',
    priority: 'URGENT',
    assignee: '양승호',
    reporter: '홍지호',
    group: '03.08 회의',
    labels: [],
    publishedAt: '2026-02-21',
    dueDate: '2026-02-28',
    relatedDrawings: ['여자화장실 전개도', '남자화장실 전개도'],
  },
];

// ── Mock 구현체 ──────────────────────────────────────────────

function _getIssues(filter?: Partial<IssueFilter>): Issue[] {
  let issues = [...MOCK_ISSUES];

  if (filter?.keyword) {
    const kw = filter.keyword.toLowerCase();
    issues = issues.filter(
      (i) =>
        i.title.toLowerCase().includes(kw) ||
        i.content.toLowerCase().includes(kw),
    );
  }

  if (filter?.status && filter.status !== 'ALL') {
    issues = issues.filter((i) => i.status === filter.status);
  }

  if (filter?.priority && filter.priority !== 'ALL') {
    issues = issues.filter((i) => i.priority === filter.priority);
  }

  if (filter?.group && filter.group !== 'ALL') {
    issues = issues.filter((i) => i.group === filter.group);
  }

  if (filter?.type && filter.type !== 'ALL') {
    issues = issues.filter((i) => i.type === filter.type);
  }

  // 최신순 정렬
  issues.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return issues;
}

function _getIssueById(id: string): Issue | null {
  return MOCK_ISSUES.find((i) => i.id === id) ?? null;
}

function _getIssueGroups(): string[] {
  const groups = MOCK_ISSUES.map((i) => i.group).filter(Boolean) as string[];
  return [...new Set(groups)];
}

// ── Public API 함수 ──────────────────────────────────────────

export async function getIssues(filter?: Partial<IssueFilter>): Promise<Issue[]> {
  if (apiConfig.useMock) return mockDelay(_getIssues(filter));
  return apiFetch<Issue[]>('/issues', {
    method: 'GET',
  });
}

export async function getIssueById(id: string): Promise<Issue | null> {
  if (apiConfig.useMock) return mockDelay(_getIssueById(id));
  return apiFetch<Issue | null>(`/issues/${id}`);
}

export async function getIssueGroups(): Promise<string[]> {
  if (apiConfig.useMock) return mockDelay(_getIssueGroups());
  return apiFetch<string[]>('/issues/groups');
}

export async function deleteIssue(id: string): Promise<void> {
  if (apiConfig.useMock) {
    const idx = MOCK_ISSUES.findIndex((i) => i.id === id);
    if (idx !== -1) MOCK_ISSUES.splice(idx, 1);
    return mockDelay(undefined);
  }
  return apiFetch<void>(`/issues/${id}`, { method: 'DELETE' });
}

export async function createIssue(
  data: Omit<Issue, 'id' | 'number' | 'publishedAt'>,
): Promise<Issue> {
  if (apiConfig.useMock) {
    const nextNumber = Math.max(...MOCK_ISSUES.map((i) => i.number)) + 1;
    const issue: Issue = {
      ...data,
      id: `issue-${nextNumber}`,
      number: nextNumber,
      publishedAt: new Date().toISOString(), // 밀리초 단위로 저장해 동일 날짜 생성 순서 보장
    };
    MOCK_ISSUES.push(issue);
    return mockDelay(issue);
  }
  return apiFetch<Issue>('/issues', { method: 'POST', body: JSON.stringify(data) });
}
