# Timwork 건설 도면 탐색 인터페이스

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 기술 스택

- **React 18** + **TypeScript** — UI 및 타입 안전성
- **Vite** — 빌드 도구
- **React Router v6** — SPA 라우팅
- **Zustand** — 전역 상태 관리
- **Tailwind CSS v3** — 유틸리티 기반 스타일링
- **Lucide React** — 아이콘

## 프로젝트 구조

```
src/
├── api/              # Mock API 레이어 (백엔드 연동 준비됨)
│   ├── client.ts     # API 클라이언트 기반 + Mock/Real 스위치
│   ├── drawings.ts   # 도면 API
│   ├── issues.ts     # 이슈 API
│   └── dashboard.ts  # 대시보드 API
├── types/            # TypeScript 타입 정의 (공통)
├── store/            # Zustand 전역 상태
│   ├── drawing.store.ts
│   └── issue.store.ts
├── components/
│   ├── layout/       # AppLayout, Sidebar, Header
│   ├── drawings/     # DrawingTree, DrawingViewer, RevisionPanel, CompareModal
│   ├── issues/       # IssueDetailModal
│   └── dashboard/    # DonutChart
└── pages/            # DashboardPage, DrawingsPage, IssuesPage, PlaceholderPage
```

## 구현 기능

- [x] **대시보드** — 공정률·공사비·착공일·준공일 카드, 건축 개요, 이슈 현황 도넛 차트, 최근 항목
- [x] **도면 탐색** — 공종별 아코디언 트리, 키워드 검색, 공종 필터
- [x] **도면 뷰어** — 마우스 휠 줌, 드래그 패닝, Fit to screen
- [x] **브레드크럼** — 현재 도면 컨텍스트 표시
- [x] **리비전 패널** — 타임라인 UI, 변경 이력, 최신 배지
- [x] **비교 모드** — 다중 리비전 레이어 오버레이, 투명도·가시성 조절
- [x] **이슈 목록** — 테이블 뷰, 키워드·상태·우선순위·그룹 필터
- [x] **이슈 상세** — 모달, 내용·연관 도면·메타 정보

## 미완성 기능

- [ ] 전체 배치도에서 건물 폴리곤 클릭 → 도면 진입 (Canvas 렌더링 필요)
- [ ] 지도 API 연동 (대시보드 위치 표시)
- [ ] 이슈 생성 / 수정 폼
- [ ] 이슈 핀 — 도면 위 좌표 기반 이슈 위치 표시
- [ ] 사진대지 / 멤버 / 보안 탭 (기획 확정 후 구현 예정)
- [ ] 페이지네이션

## 백엔드 연동 방법

`src/api/client.ts`에서 한 줄만 변경:

```ts
// 변경 전
const USE_MOCK_API = true;

// 변경 후
const USE_MOCK_API = false;
```

그리고 `.env` 파일에 API 주소 설정:

```env
VITE_API_BASE_URL=https://api.timwork.kr/v1
```

각 `api/*.ts` 파일의 함수들이 자동으로 실제 API를 호출합니다.
