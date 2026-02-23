/**
 * 비교 모드에서 특정 도면의 특정 공종을 오버레이 대상에서 제외
 *
 * 이유: 해당 공종의 revision imageTransform이 건축 기준이 아닌
 * 자체 도면 좌표계(relativeTo)를 사용하는 경우 스케일/위치 오정렬 발생
 *
 * 키: { [realDrawingId]: string[] }  — 제외할 공종 목록
 */
export const compareExclusions: Record<string, string[]> = {
  // 01_101동 지상1층 평면도 — 구조는 region별 도면(01:A, 01:B)으로 분리되어 있어
  // 건축 전체 뷰에서 중첩 비교에 부적합 (revision이 구조PNG 좌표계 기준)
  '01': ['구조'],
};
