/**
 * API Client
 *
 * 현재는 Mock 데이터를 반환합니다.
 * 백엔드 연동 시 이 파일에서 fetch 설정만 변경하면 됩니다.
 *
 * 변경 방법:
 *   1. VITE_API_BASE_URL 환경 변수 설정 (.env 파일)
 *   2. USE_MOCK_API = false 로 변경
 *   3. 각 api/*.ts 파일의 함수가 자동으로 실제 API 호출
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const USE_MOCK_API = true; // 백엔드 연동 시 false로 변경

export const apiConfig = {
  baseUrl: API_BASE_URL,
  useMock: USE_MOCK_API,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

/** 실제 API 호출용 유틸 (백엔드 연동 시 사용) */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...apiConfig.defaultHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/** Mock API 딜레이 시뮬레이션 (실제 네트워크 응답처럼 보이게) */
export function mockDelay<T>(data: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
