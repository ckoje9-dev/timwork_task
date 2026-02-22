import { useEffect, useState } from 'react';
import { Search, Plus, RotateCcw, PlusCircle, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useIssueStore } from '@/store/issue.store';
import { useDrawingStore } from '@/store/drawing.store';
import IssueDetailModal from '@/components/issues/IssueDetailModal';
import IssueCreateModal from '@/components/issues/IssueCreateModal';
import type { Issue, IssueStatus, IssuePriority, IssueType } from '@/types';

// ── 상수 ─────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: IssueStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'TODO', label: 'TODO' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { value: 'IN_REVIEW', label: 'IN REVIEW' },
  { value: 'DONE', label: 'DONE' },
];

const PRIORITY_OPTIONS: { value: IssuePriority | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체 우선순위' },
  { value: 'URGENT', label: '긴급' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'LOW', label: '낮음' },
];

const STATUS_LABEL: Record<IssueStatus, string> = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN PROGRESS',
  IN_REVIEW: 'IN REVIEW',
  DONE: 'DONE',
};

const STATUS_CLASS: Record<IssueStatus, string> = {
  TODO: 'pill-todo',
  IN_PROGRESS: 'pill-in-progress',
  IN_REVIEW: 'pill-in-review',
  DONE: 'pill-done',
};

const PRIORITY_CLASS: Record<IssuePriority, string> = {
  LOW: 'pill-low',
  MEDIUM: 'pill-medium',
  HIGH: 'pill-high',
  URGENT: 'pill-urgent',
};

const PRIORITY_LABEL: Record<IssuePriority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function IssuesPage() {
  const {
    issues,
    loading,
    filter,
    groups,
    selectedIssue,
    loadIssues,
    loadGroups,
    selectIssue,
    clearSelectedIssue,
    setFilter,
    resetFilter,
    createIssue,
  } = useIssueStore();
  const projectName = useDrawingStore((s) => s.projectName);

  const [keywordInput, setKeywordInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadIssues();
    loadGroups();
  }, [loadIssues, loadGroups]);

  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({ keyword: keywordInput });
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* 브레드크럼 */}
      <div className="mb-4">
        <p className="text-xs text-text-muted mb-0.5">{projectName || 'Demo Project'}</p>
        <h1 className="text-xl font-bold text-text-primary">이슈</h1>
      </div>

      {/* ── 필터 바 ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* 키워드 검색 */}
        <form onSubmit={handleKeywordSearch} className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="키워드로 검색하세요"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="input pl-8 w-52 text-sm"
          />
        </form>

        {/* 유형 필터 */}
        <select
          value={filter.type}
          onChange={(e) => setFilter({ type: e.target.value as IssueType | 'ALL' })}
          className="select w-28 text-sm"
        >
          <option value="ALL">전체 유형</option>
          <option value="추가">추가</option>
          <option value="수정">수정</option>
          <option value="삭제">삭제</option>
          <option value="간섭">간섭</option>
        </select>

        {/* 그룹 필터 */}
        <select
          value={filter.group}
          onChange={(e) => setFilter({ group: e.target.value })}
          className="select w-36 text-sm"
        >
          <option value="ALL">그룹 필터</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        {/* 우선순위 필터 */}
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ priority: e.target.value as IssuePriority | 'ALL' })}
          className="select w-36 text-sm"
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* 상태 필터 */}
        <select
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value as IssueStatus | 'ALL' })}
          className="select w-36 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* 필터 초기화 */}
        <button onClick={resetFilter} className="btn-ghost text-sm">
          <RotateCcw size={13} />
          초기화
        </button>

        {/* 이슈 생성 (우측 정렬) */}
        <div className="ml-auto">
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} />
            이슈 생성
          </button>
        </div>
      </div>

      {/* ── 이슈 테이블 ─────────────────────────────────────── */}
      <div className="flex-1 card overflow-hidden flex flex-col p-0">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* 헤더 행 */}
            <div className="grid grid-cols-[40px_80px_1fr_100px_80px_80px_70px_110px] gap-3
                           px-4 py-2.5 border-b border-border bg-surface text-xs font-semibold text-text-muted uppercase tracking-wide">
              <div />
              <div>번호</div>
              <div>제목</div>
              <div>그룹</div>
              <div>담당자</div>
              <div>보고자</div>
              <div>우선순위</div>
              <div>상태</div>
            </div>

            {/* 데이터 행 */}
            <div className="flex-1 overflow-y-auto">
              {issues.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-text-muted text-sm">
                  이슈가 없습니다
                </div>
              ) : (
                issues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    onClick={() => selectIssue(issue.id)}
                  />
                ))
              )}
            </div>

            {/* 페이지네이션 플레이스홀더 */}
            <div className="border-t border-border px-4 py-3 flex items-center justify-center">
              <span className="text-sm text-text-muted">
                총 {issues.length}건
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── 이슈 상세 모달 ──────────────────────────────────── */}
      {selectedIssue && (
        <IssueDetailModal issue={selectedIssue} onClose={clearSelectedIssue} />
      )}

      {/* ── 이슈 생성 모달 ──────────────────────────────────── */}
      {showCreateModal && (
        <IssueCreateModal
          groups={groups}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            await createIssue(data);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── 유형 아이콘 컴포넌트 ──────────────────────────────────────

const TYPE_ICON_CONFIG: Record<IssueType, { icon: React.ReactNode; bg: string; color: string; label: string }> = {
  추가: { icon: <PlusCircle size={13} />, bg: 'bg-green-500/15', color: 'text-green-500', label: '추가' },
  수정: { icon: <Pencil size={13} />, bg: 'bg-blue-500/15', color: 'text-blue-500', label: '수정' },
  삭제: { icon: <Trash2 size={13} />, bg: 'bg-red-500/15', color: 'text-red-500', label: '삭제' },
  간섭: { icon: <AlertTriangle size={13} />, bg: 'bg-amber-500/15', color: 'text-amber-500', label: '간섭' },
};

function IssueTypeIcon({ type }: { type: IssueType }) {
  const cfg = TYPE_ICON_CONFIG[type];
  return (
    <div
      className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}
      title={cfg.label}
    >
      {cfg.icon}
    </div>
  );
}

// ── 이슈 행 컴포넌트 ─────────────────────────────────────────

function IssueRow({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-[40px_80px_1fr_100px_80px_80px_70px_110px] gap-3
                 px-4 py-3 border-b border-border text-left hover:bg-surface-hover
                 transition-colors group"
    >
      {/* 유형 아이콘 */}
      <div className="flex items-center">
        <IssueTypeIcon type={issue.type} />
      </div>

      {/* 번호 */}
      <div className="flex items-center text-sm text-text-secondary">
        ISSUE#{issue.number}
      </div>

      {/* 제목 */}
      <div className="flex items-center">
        <span className="text-sm text-text-primary group-hover:text-brand transition-colors truncate">
          {issue.title}
        </span>
      </div>

      {/* 그룹 */}
      <div className="flex items-center text-sm text-text-secondary truncate">
        {issue.group ?? '—'}
      </div>

      {/* 담당자 */}
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center text-white text-xs flex-shrink-0">
          {issue.assignee.charAt(0)}
        </div>
        <span className="text-xs text-text-secondary truncate">{issue.assignee}</span>
      </div>

      {/* 보고자 */}
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-status-urgent flex items-center justify-center text-white text-xs flex-shrink-0">
          {issue.reporter.charAt(0)}
        </div>
        <span className="text-xs text-text-secondary truncate">{issue.reporter}</span>
      </div>

      {/* 우선순위 */}
      <div className="flex items-center">
        <span className={`pill ${PRIORITY_CLASS[issue.priority]}`}>
          {PRIORITY_LABEL[issue.priority]}
        </span>
      </div>

      {/* 상태 */}
      <div className="flex items-center">
        <span className={`pill ${STATUS_CLASS[issue.status]}`}>
          {STATUS_LABEL[issue.status]}
        </span>
      </div>
    </button>
  );
}
