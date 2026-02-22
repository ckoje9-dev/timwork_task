import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileStack, AlertCircle, Bookmark, MapPin } from 'lucide-react';
import { getDashboard } from '@/api/dashboard';
import { getIssueStats } from '@/api/issues';
import type { DashboardData, IssueStats } from '@/types';
import DonutChart from '@/components/dashboard/DonutChart';
import { useDrawingStore } from '@/store/drawing.store';
import { useRecentStore } from '@/store/recent.store';
import { useIssueStore } from '@/store/issue.store';

function formatTimestamp(isoString: string): string {
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay === 1) return '어제';
  return `${diffDay}일 전`;
}

const ISSUE_CHART_SEGMENTS = (stats: IssueStats) => [
  { value: stats.todo, color: '#F97316', label: '할일' },
  { value: stats.inProgress, color: '#EAB308', label: '진행중' },
  { value: stats.inReview, color: '#10B981', label: '검토중' },
  { value: stats.done, color: '#2563EB', label: '완료' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [issueStats, setIssueStats] = useState<IssueStats | null>(null);

  useEffect(() => {
    getDashboard().then(setData);
    getIssueStats().then(setIssueStats);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner" />
      </div>
    );
  }

  const { project, building } = data;

  return (
    <div className="p-6 space-y-5">
      {/* 브레드크럼 */}
      <div>
        <p className="text-xs text-text-muted mb-0.5">Demo Project – 마곡동 주민공동시설</p>
        <h1 className="text-xl font-bold text-text-primary">대시보드</h1>
      </div>

      {/* ── 상단 스탯 카드 4등분 ───────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="공정률" value={`${project.progressRate}%`} accent />
        <StatCard label="공사비" value={`₩${project.constructionCost.toLocaleString()}`} />
        <StatCard label="착공일" value={project.startDate} />
        <StatCard label="준공일" value={project.completionDate} />
      </div>

      {/* ── 중간 섹션: 건축 개요 | 위치 (1:1) ─────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {/* 건축 개요 */}
        <div className="card">
          <h2 className="text-sm font-semibold text-text-primary mb-3">건축 개요</h2>
          <div className="space-y-1.5">
            {[
              ['위치', building.location],
              ['대지면적', building.siteArea],
              ['용도', building.purpose],
              ['규모', building.scale],
              ['건축면적', building.buildingArea],
              ['건폐율', building.coverageRatio],
              ['연면적', building.totalFloorArea],
              ['용적률', building.floorAreaRatio],
              ['조경면적', building.landscapeArea],
              ['주차대수', `${building.parkingSpaces}대`],
            ].map(([k, v]) => (
              <div key={k} className="flex text-sm">
                <span className="w-20 text-text-muted flex-shrink-0">{k}</span>
                <span className="text-text-primary">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 위치 (지도) */}
        <div className="card flex flex-col">
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin size={14} className="text-brand" />
            <span className="text-sm font-semibold text-text-primary">위치</span>
          </div>
          <div className="flex-1 bg-surface rounded border border-border flex items-center justify-center min-h-[180px]">
            <div className="text-center text-text-muted">
              <MapPin size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">서울시 강서구 마곡동 9999</p>
              <p className="text-xs mt-1 opacity-60">지도 API 연동 영역</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 하단 섹션: 이슈 현황 | 최근 항목/북마크 (1:1) ─── */}
      <div className="grid grid-cols-2 gap-4">
        {/* 이슈 현황 도넛 차트 */}
        <div className="card">
          <h2 className="text-sm font-semibold text-text-primary mb-4">이슈 현황</h2>
          {issueStats ? (
            <DonutChart
              segments={ISSUE_CHART_SEGMENTS(issueStats)}
              total={issueStats.total}
            />
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="spinner" />
            </div>
          )}
        </div>

        {/* 최근 항목 / 북마크 탭 */}
        <RecentItemsCard />
      </div>
    </div>
  );
}

// ── 최근 항목 / 북마크 탭 카드 ──────────────────────────────

type TabKey = 'recent' | 'bookmark';

function RecentItemsCard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('recent');

  const { recentItems } = useRecentStore();
  const { bookmarkedDrawings, tree, selectDrawing } = useDrawingStore();
  const { bookmarkedIssues, selectIssue } = useIssueStore();

  // store 북마크에서 표시 항목 생성
  const storeBookmarks = useMemo(() => {
    return [...bookmarkedDrawings].flatMap((key) => {
      // key 형식: `${drawingId}-${discipline}` — discipline은 한글이므로 끝에서 매칭
      const discipline = Object.keys(tree).find((d) => key.endsWith(`-${d}`));
      if (!discipline) return [];
      const drawingId = key.slice(0, key.length - discipline.length - 1);
      const node = tree[discipline]?.find((n) => n.drawingId === drawingId);
      const drawingName = node?.drawingName ?? drawingId;
      const latestRevision = node?.latestRevision ?? null;
      return [{ key, drawingId, discipline, drawingName, latestRevision }];
    });
  }, [bookmarkedDrawings, tree]);

  return (
    <div className="card flex flex-col">
      {/* 탭 헤더 */}
      <div className="flex border-b border-border mb-3 -mx-4 px-4">
        {(['recent', 'bookmark'] as TabKey[]).map((tab) => {
          const label = tab === 'recent' ? '최근 항목' : '북마크';
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'pb-2 mr-4 text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 항목 목록 */}
      <div className="space-y-1 flex-1 overflow-y-auto max-h-[252px]">
        {activeTab === 'recent' && (
          <>
            {recentItems.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">항목이 없습니다</p>
            ) : (
              recentItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.type === 'issue') {
                      selectIssue(item.id.replace(/^issue-/, ''));
                    }
                    navigate(item.type === 'drawing' ? '/drawings' : '/issues');
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-surface-hover text-left group"
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {item.type === 'drawing' ? (
                      <FileStack size={14} className="text-brand" />
                    ) : (
                      <AlertCircle size={14} className="text-status-urgent" />
                    )}
                  </div>
                  <span className="flex-1 text-xs text-text-secondary truncate group-hover:text-text-primary">
                    {item.label}
                  </span>
                  {(item.type === 'drawing' ? item.bookmarked : bookmarkedIssues.has(item.id.replace(/^issue-/, ''))) && (
                    <Bookmark size={12} className="text-brand fill-brand flex-shrink-0" />
                  )}
                  <span className="text-xs text-text-muted flex-shrink-0">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </button>
              ))
            )}
          </>
        )}

        {activeTab === 'bookmark' && (
          <>
            {storeBookmarks.length === 0 && bookmarkedIssues.size === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">북마크된 항목이 없습니다</p>
            ) : (
              <>
                {storeBookmarks.map((bm) => (
                  <button
                    key={bm.key}
                    onClick={() => {
                      selectDrawing(bm.drawingId, bm.discipline, bm.latestRevision?.version ?? '');
                      navigate('/drawings');
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-surface-hover text-left group"
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <FileStack size={14} className="text-brand" />
                    </div>
                    <span className="flex-1 text-xs text-text-secondary truncate group-hover:text-text-primary">
                      <span className="text-text-muted">[{bm.discipline}]</span> {bm.drawingName}
                    </span>
                    <Bookmark size={12} className="text-brand fill-brand flex-shrink-0" />
                  </button>
                ))}
                {[...bookmarkedIssues.values()].map((bm) => (
                  <button
                    key={bm.id}
                    onClick={() => {
                      selectIssue(bm.id);
                      navigate('/issues');
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-surface-hover text-left group"
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={14} className="text-status-urgent" />
                    </div>
                    <span className="flex-1 text-xs text-text-secondary truncate group-hover:text-text-primary">
                      ISSUE#{bm.number} {bm.title}
                    </span>
                    <Bookmark size={12} className="text-brand fill-brand flex-shrink-0" />
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── StatCard ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`card ${accent ? 'border-brand' : ''}`}>
      <p className="text-xs text-text-muted mb-2">{label}</p>
      <p className={`text-xl font-bold truncate ${accent ? 'text-brand' : 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}
