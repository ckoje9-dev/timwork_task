# DESIGN.md — UI 설계 과정 및 의사결정

## 데이터 분석

### metadata.json 해석

데이터는 **도면(drawing) 중심**으로 구성되어 있지만, 실제 사용자는 **공종(discipline) 중심**으로 탐색합니다.

```
metadata.json 구조  →  사용자 관점
drawing > discipline  →  discipline > drawing
```

주목한 특수 케이스:
- **101동 구조**: Region A/B로 분할. 각 영역이 독립적인 리비전을 가짐. 이는 대형 도면을 구역별로 나눠 관리하는 실무 패턴.
- **주민공동시설 건축**: 리비전마다 polygon + imageTransform이 다름. 설계 변경 범위가 리비전마다 달라지는 케이스.
- **주차장 구조**: 기준 도면 자체여서 polygon 없음.

### 개선 가능한 데이터 구조

현재 구조는 도면 기준이라 "건축 공종의 모든 도면"을 조회하려면 전체 순회가 필요합니다.
백엔드에서는 discipline을 1차 키로 하는 역인덱스를 제공하면 탐색 성능이 향상될 것입니다.

---

## 접근 방식

1. **사용자 시나리오 분석** → 3가지 핵심 태스크 도출
2. **데이터 구조 파악** → 탐색 축 결정 (공종 우선)
3. **레이아웃 설계** → 3패널 구조
4. **기술 스택 선택**
5. **컴포넌트 설계** → 상향식(atomic) 접근
6. **Mock API 레이어** → 백엔드 협업 준비

---

## UI 설계 결정

### 1. 탐색 구조: 공종 우선 vs 공간 우선

**고려한 대안:**

| 방식 | 장점 | 단점 |
|------|------|------|
| 공간 우선 (배치도 클릭) | 직관적인 지도 탐색, "어디"에 대한 질문에 강함 | 공종 횡단 탐색 불편, 배치도 없는 환경에서 불가 |
| **공종 우선 (트리)** | 실무 워크플로 일치, "건축 도면 전부" 조회 용이 | 공간 컨텍스트 약함 |

**선택: 공종 우선 트리 (메인) + 브레드크럼 (컨텍스트 보완)**

현장 소장 김철수 씨는 "101동 건축 도면"을 찾기보다 "건축 공종 전체를 훑어야 하는" 경우가 더 많습니다.
배치도 클릭 방식은 미완성으로 남기고, 추후 지도 탐색 탭으로 분리할 계획입니다.

### 2. 리비전 비교: 전환 vs 오버레이

**고려한 대안:**

| 방식 | 장점 | 단점 |
|------|------|------|
| 순차 전환 (Before/After 슬라이더) | 구현 단순, 차이가 명확 | 3개 이상 비교 불가 |
| **색상 오버레이 레이어** | REV1~REV3 동시 비교 가능 | 도면이 복잡할 때 가독성 저하 |

**선택: 색상 레이어 오버레이 + 투명도/가시성 조절**

시나리오 3 ("REV1→REV3 변경 방향 논의")에 가장 적합합니다.
각 레이어를 켜고 끄며 특정 변경 구간을 집중해서 볼 수 있습니다.

### 3. 레이아웃

```
┌────────────┬─────────────────────────────────┐
│  공종 트리  │       도면 뷰어 (줌/패닝)          │
│  (좌, 288px)│       (flex-1, 가변)              │
└────────────┴─────────────────────────────────┘
```

2패널 구조 (리비전 패널 → 상단 리비전 피커로 통합):
- 탐색(트리)과 확인(뷰어)을 한 화면에서 전환 없이 처리
- 리비전 이력은 상단 드롭다운으로 간소화하여 뷰어 공간 확보

### 4. CSS 구조

- **`tailwind.config.ts`**: 모든 색상·사이즈 토큰 중앙 관리. 디자인 변경 시 이 파일만 수정.
- **`src/index.css`**: `@layer components`로 `.btn`, `.card`, `.pill` 등 공통 컴포넌트 스타일 정의.
- 컴포넌트 내부는 Tailwind 유틸리티 클래스 사용.

이 구조는 "전체 테마 변경 → `tailwind.config.ts`", "공통 컴포넌트 스타일 → `index.css`", "레이아웃 → 컴포넌트 파일"로 역할이 분리되어 편집이 용이합니다.

---

## 상태 관리 설계

### Zustand 스토어 구조

```
drawing.store.ts  — 도면 선택, 레이어, 비교 모드, 이슈 핀, 북마크
issue.store.ts    — 이슈 목록, 선택된 이슈, 북마크
recent.store.ts   — 최근 열람 항목 (도면·이슈 통합)
```

### 영속성 전략

세 스토어 모두 localStorage를 사용해 새로고침 후에도 상태를 복원합니다.

| localStorage 키 | 저장 내용 |
|----------------|----------|
| `timwork-drawing-bookmarks` | `string[]` — `${drawingId}-${discipline}` 배열 |
| `timwork-issue-bookmarks` | `[string, BookmarkedIssueInfo][]` — Map entries 직렬화 |
| `timwork-recent-items` | `RecentItem[]` — 최대 7개 |

Set/Map은 JSON 직렬화가 불가하므로 배열로 변환하여 저장하고, 초기화 시 복원합니다.

### 이슈 핀 연동

`IssuePin.issueId` 필드로 도면 핀과 이슈를 양방향 연결합니다.

- **핀 생성 → 이슈 생성**: `addIssuePin` 후 이슈 생성 모달에서 `updateIssuePinData`로 이슈 ID를 핀에 기록
- **이슈 삭제**: IssueDetailModal에서 `issuePins.filter(p => p.issueId === issue.id)`로 연관 핀을 찾아 `removeIssuePin` 호출
- **도면에서 보기**: `relatedPin`이 있으면 메타 패널에 버튼 표시, 클릭 시 `selectDrawing` + navigate

순환 참조 방지: issue.store와 drawing.store가 서로를 직접 import하지 않고, IssueDetailModal 컴포넌트에서 두 store를 함께 사용합니다.

---

## Mock API 설계

### 스위칭 구조

```ts
// src/api/client.ts
const USE_MOCK_API = true; // false로 변경 시 실제 API 사용
```

각 API 함수는 `apiConfig.useMock` 플래그로 Mock/Real을 분기합니다:

```ts
export async function getIssues(params): Promise<Issue[]> {
  if (apiConfig.useMock) return mockDelay(_getIssues(params));
  return apiFetch<Issue[]>('/issues', { ... });
}
```

### Mock과 실제 API 경계

| 기능 | Mock 구현 | 실제 API 경로 |
|------|----------|-------------|
| 도면 트리 | `/metadata.json` fetch + 가공 | `GET /drawings/tree` |
| 이슈 CRUD | `MOCK_ISSUES` 배열 인메모리 | `GET/POST/PUT/DELETE /issues` |
| 이슈 통계 | MOCK_ISSUES 집계 | `GET /issues/stats` |
| 도면 업로드 | drawing.store 직접 처리 (blob URL) | `POST /drawings` |
| 도면 삭제 | drawing.store 직접 처리 | `DELETE /drawings/:id` |
| 이슈 핀 | drawing.store 인메모리 | 백엔드 협의 필요 |

---

## 기술 선택

| 항목 | 선택 | 이유 |
|------|------|------|
| 상태 관리 | Zustand | Redux보다 보일러플레이트 적음. 작은 스토어 여러 개로 관심사 분리. |
| 스타일링 | Tailwind CSS | 디자인 토큰을 config로 중앙 관리. 빠른 프로토타이핑. |
| 라우팅 | React Router v6 | URL 기반 탭 전환으로 북마크·공유 가능. |
| 차트 | SVG 직접 구현 | Chart.js/recharts 의존성 없이 도넛 차트만 필요. |
| 아이콘 | Lucide React | Tree-shakable, 일관된 스타일. |

---

## 어려웠던 점 및 개선 방안

### 어려웠던 점

1. **Vertex 좌표계 이해**: `imageTransform`과 `polygonTransform`의 관계. 두 좌표계가 다른 기준점을 가지고 있어, 배치도 위에 폴리곤을 정확히 그리려면 행렬 변환이 필요합니다. 시간 내에 완성하지 못해 미완성으로 남았습니다.

2. **리비전 비교 시각화**: CSS `mix-blend-mode: multiply`로 도면 이미지를 오버레이하면 색상이 정확히 원하는 대로 나오지 않습니다. 실제로는 이미지 diff나 SVG 기반 변경 마킹이 더 적합합니다.

3. **Set/Map 직렬화**: Zustand의 상태로 Set/Map을 사용할 경우 `JSON.stringify`가 빈 객체를 반환합니다. 배열로 변환해 저장하고 초기화 시 복원하는 패턴으로 해결했습니다.

### 시간이 더 주어진다면

1. **배치도 폴리곤 클릭 네비게이션** — Canvas 위에 좌표 변환을 적용해 건물 영역을 클릭 가능한 영역으로 렌더링. 공간 탐색 진입점으로 활용.

2. **도면 비교 품질 향상** — 두 이미지를 픽셀 단위로 diff하거나, 변경된 좌표(polygon)를 색상 하이라이트로 표시.

3. **이슈 핀 서버 저장** — 현재 핀은 클라이언트 인메모리 상태라 새로고침 시 사라집니다. 백엔드 API 연동 후 영속화 필요.

4. **반응형 레이아웃** — 태블릿 현장 사용을 고려한 모바일 대응.

5. **이슈 수정 기능** — 현재 이슈 생성·삭제만 지원. 상세 모달에서 인라인 편집 또는 수정 모달 추가 필요.
