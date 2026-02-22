// ============================================================
// Drawing (도면) Types
// ============================================================

export interface ImageTransform {
  relativeTo?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface PolygonTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface DrawingPolygon {
  vertices: [number, number][];
  polygonTransform: PolygonTransform;
}

export interface Revision {
  version: string;
  image: string;
  date: string;
  description: string;
  changes: string[];
  imageTransform?: ImageTransform;
  polygon?: DrawingPolygon;
}

export interface Region {
  polygon: DrawingPolygon;
  revisions: Revision[];
}

export interface DrawingDiscipline {
  image?: string;
  imageTransform?: ImageTransform;
  polygon?: DrawingPolygon;
  regions?: Record<string, Region>;
  revisions: Revision[];
}

export interface Position {
  vertices: [number, number][];
  imageTransform: ImageTransform;
}

export interface Drawing {
  id: string;
  name: string;
  image: string;
  parent: string | null;
  position: Position | null;
  disciplines?: Record<string, DrawingDiscipline>;
}

export interface Metadata {
  project: { name: string; unit: string };
  disciplines: { name: string }[];
  drawings: Record<string, Drawing>;
}

// ============================================================
// Derived / View Types (프론트엔드 뷰용 가공 타입)
// ============================================================

/** 도면 트리에서 한 아이템을 나타내는 타입 */
export interface DrawingTreeNode {
  drawingId: string;
  drawingName: string;
  discipline: string;
  latestRevision: Revision | null;
  revisionCount: number;
}

/** 공종별로 그룹화된 트리 구조 */
export type DrawingTreeByDiscipline = Record<string, DrawingTreeNode[]>;

/** 현재 선택 상태 */
export interface DrawingSelection {
  drawingId: string;
  discipline: string;
  revisionVersion: string;
}

// ============================================================
// Issue (이슈) Types
// ============================================================

export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type IssueType = '추가' | '수정' | '삭제' | '간섭';

export interface Issue {
  id: string;
  number: number;
  type: IssueType;
  title: string;
  content: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: string;
  reporter: string;
  group: string | null;
  labels: string[];
  publishedAt: string;
  dueDate: string;
  relatedDrawings: string[]; // 연관 도면 pill 표시용
}

export interface IssueFilter {
  keyword: string;
  status: IssueStatus | 'ALL';
  priority: IssuePriority | 'ALL';
  group: string | 'ALL';
  type: IssueType | 'ALL';
}

// ============================================================
// Dashboard Types
// ============================================================

export interface ProjectStats {
  progressRate: number;       // 공정률 (%)
  constructionCost: number;   // 공사비 (원)
  startDate: string;          // 착공일
  completionDate: string;     // 준공일
}

export interface BuildingInfo {
  location: string;
  siteArea: string;
  purpose: string;
  scale: string;
  buildingArea: string;
  coverageRatio: string;
  totalFloorArea: string;
  floorAreaRatio: string;
  landscapeArea: string;
  parkingSpaces: number;
}

export interface IssueStats {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
}

export interface RecentItem {
  id: string;
  label: string;
  type: 'drawing' | 'issue';
  timestamp: string;
  bookmarked: boolean;
}

export interface DashboardData {
  project: ProjectStats;
  building: BuildingInfo;
  issueStats: IssueStats;
  recentItems: RecentItem[];
}

// ============================================================
// API Response Wrapper
// ============================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
