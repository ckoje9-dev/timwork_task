/**
 * Revision polygon overrides
 *
 * metadata.json의 revision.polygon 데이터를 UI 레벨에서 대체합니다.
 *   null  → 해당 리비전에 폴리곤 없음
 *   array → 커스텀 폴리곤 버텍스 (global 좌표계, [x, y])
 *
 * 키: { [realDrawingId]: { [revisionVersion]: override } }
 */
type PolygonOverride = [number, number][] | null;

export const revisionPolygonOverrides: Record<string, Record<string, PolygonOverride>> = {
  // 09_주민공동시설 지상1층 평면도 — 건축 revision 수정 커버리지
  '09': {
    REV1: null,   // 초기 설계: 수정 영역 없음
    REV2: [       // 중앙~우측 하단 수정 영역
      [1926, 1650],
      [3050, 1650],
      [3050, 2414],
      [1926, 2414],
    ],
    REV3: [       // 좌측~중앙 확장 수정 영역
      [1500, 1582],
      [3035, 1582],
      [3035, 2414],
      [950, 2414],
      [950, 1100],
      [1500, 1100],
    ],
  },
};
