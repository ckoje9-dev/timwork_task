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
│   ├── issues.ts     # 이슈 API (getIssueStats 포함)
│   └── dashboard.ts  # 대시보드 API
├── types/            # TypeScript 타입 정의 (공통)
├── store/            # Zustand 전역 상태
│   ├── drawing.store.ts  # 도면 선택·북마크·레이어·이슈 핀 (localStorage 영속)
│   ├── issue.store.ts    # 이슈 CRUD·북마크·선택 (localStorage 영속)
│   └── recent.store.ts   # 최근 항목 기록 (localStorage 영속, 최대 7개)
├── components/
│   ├── layout/       # AppLayout, Sidebar, Header
│   ├── drawings/     # DrawingTree, DrawingViewer, RevisionPanel, CompareModal
│   ├── issues/       # IssueCreateModal, IssueDetailModal
│   └── dashboard/    # DonutChart
└── pages/            # DashboardPage, DrawingsPage, IssuesPage, PlaceholderPage
```

## 구현 기능

### 대시보드
- [x] 공정률·공사비·착공일·준공일 카드
- [x] 건축 개요 테이블
- [x] 이슈 현황 도넛 차트 (실 데이터 연동 — getIssueStats())
- [x] 최근 항목 탭 — 최근 열람한 도면·이슈 최대 7개 (localStorage 영속)
- [x] 북마크 탭 — 북마크된 도면·이슈 목록, 클릭 시 바로 이동

### 도면 탐색
- [x] 공종별 아코디언 트리, 키워드 검색, 공종 필터
- [x] Empty State — 미선택 시 안내 화면
- [x] 도면 뷰어 — 마우스 휠 줌, 드래그 패닝, Fit to screen
- [x] 브레드크럼 — 현재 도면 컨텍스트 표시
- [x] 리비전 피커 — 드롭다운으로 리비전 전환
- [x] 비교 모드 — 다중 리비전 레이어 오버레이, 투명도·가시성 조절
- [x] 도면 업로드 (복수 파일, 공종 지정)
- [x] 도면 개별 다운로드 / 전체 ZIP 다운로드
- [x] 새 리비전 업데이트
- [x] 도면 삭제 (확인 모달)
- [x] 도면 북마크 (localStorage 영속)
- [x] 이슈 핀 — 도면 위 좌표 기반 핀 표시, 클릭하여 이슈 생성

### 이슈 관리
- [x] 이슈 목록 — 테이블 뷰, 키워드·상태·우선순위·그룹 필터
- [x] 이슈 상세 모달 — 내용·연관 도면·메타 정보
- [x] 이슈 생성 모달 (유형·상태·우선순위·담당자·마감일 등)
- [x] 이슈 삭제 — 상세 모달에서 삭제 버튼 + 확인 UI
- [x] 이슈 북마크 (localStorage 영속)
- [x] 핀 연동 — 이슈 삭제 시 연관 도면 핀 자동 제거
- [x] 도면에서 보기 — 핀에서 생성된 이슈는 "도면에서 보기" 버튼으로 해당 도면으로 이동

## Mock API 구조

| 기능 | 방식 | 백엔드 연동 시 |
|------|------|---------------|
| 도면 조회 (트리·상세) | Mock JSON fetch | `GET /drawings/tree`, `GET /drawings/:id` |
| 이슈 CRUD | Mock 인메모리 | `GET/POST/PUT/DELETE /issues` |
| 이슈 통계 | Mock 인메모리 집계 | `GET /issues/stats` |
| 대시보드 | Mock JSON | `GET /dashboard` |
| 도면 업로드·삭제·리비전 업데이트 | drawing.store 직접 처리 | `POST /drawings`, `DELETE /drawings/:id`, `POST /drawings/:id/revisions` |
| 이슈 핀 | 클라이언트 전용 | 핀 저장 API 협의 필요 |

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

## 미완성 기능

- [ ] 전체 배치도에서 건물 폴리곤 클릭 → 도면 진입 (Canvas 렌더링 필요)
- [ ] 지도 API 연동 (대시보드 위치 표시)
- [ ] 이슈 수정 폼
- [ ] 사진대지 / 멤버 / 보안 탭 (기획 확정 후 구현 예정)
- [ ] 페이지네이션
- [ ] 이슈 댓글 기능
