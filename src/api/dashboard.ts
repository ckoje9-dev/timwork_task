/**
 * Dashboard API
 *
 * Mock: 하드코딩된 대시보드 데이터 반환
 * Real: apiFetch('/dashboard') 등으로 교체
 */

import { mockDelay, apiConfig, apiFetch } from './client';
import type { DashboardData } from '@/types';

// ── Mock 데이터 ──────────────────────────────────────────────

const MOCK_DASHBOARD: DashboardData = {
  project: {
    progressRate: 87,
    constructionCost: 999_999_999,
    startDate: '2025-02-18',
    completionDate: '2026-04-29',
  },
  building: {
    location: '서울시 강서구 마곡동 9999',
    siteArea: '9,999m²',
    purpose: '근린공공시설',
    scale: '지하2층 / 지상4층',
    buildingArea: '6,666m²',
    coverageRatio: '66.66%',
    totalFloorArea: '26,664m²',
    floorAreaRatio: '400%',
    landscapeArea: '333m²',
    parkingSpaces: 333,
  },
  issueStats: {
    total: 1199,
    todo: 78,
    inProgress: 76,
    inReview: 146,
    done: 899,
  },
  recentItems: [
    {
      id: 'drawing-01',
      label: '01_101동 지상1층 평면도',
      type: 'drawing',
      timestamp: '2시간 전',
      bookmarked: false,
    },
    {
      id: 'issue-33',
      label: '[issue#33] 구조 보, 덕트 간섭',
      type: 'issue',
      timestamp: '4시간 전',
      bookmarked: true,
    },
    {
      id: 'drawing-09',
      label: '09_주민공동시설 지상1층 평면도',
      type: 'drawing',
      timestamp: '어제',
      bookmarked: false,
    },
    {
      id: 'issue-24',
      label: '[issue#24] 구조보, 스프링클러 간섭',
      type: 'issue',
      timestamp: '어제',
      bookmarked: false,
    },
  ],
};

// ── Public API 함수 ──────────────────────────────────────────

export async function getDashboard(): Promise<DashboardData> {
  if (apiConfig.useMock) return mockDelay(MOCK_DASHBOARD);
  return apiFetch<DashboardData>('/dashboard');
}
