import { X, Bookmark, ChevronDown, PlusCircle, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { Issue, IssueStatus, IssuePriority, IssueType } from '@/types';
import { useIssueStore } from '@/store/issue.store';

interface Props {
  issue: Issue;
  onClose: () => void;
}

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

const PRIORITY_LABEL: Record<IssuePriority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

const PRIORITY_CLASS: Record<IssuePriority, string> = {
  LOW: 'pill-low',
  MEDIUM: 'pill-medium',
  HIGH: 'pill-high',
  URGENT: 'pill-urgent',
};

const TYPE_CONFIG: Record<IssueType, { icon: React.ReactNode; bg: string; color: string; label: string }> = {
  추가: { icon: <PlusCircle size={12} />, bg: 'bg-green-500/15', color: 'text-green-500', label: '추가' },
  수정: { icon: <Pencil size={12} />, bg: 'bg-blue-500/15', color: 'text-blue-500', label: '수정' },
  삭제: { icon: <Trash2 size={12} />, bg: 'bg-red-500/15', color: 'text-red-500', label: '삭제' },
  간섭: { icon: <AlertTriangle size={12} />, bg: 'bg-amber-500/15', color: 'text-amber-500', label: '간섭' },
};

export default function IssueDetailModal({ issue, onClose }: Props) {
  const { bookmarkedIssues, toggleIssueBookmark } = useIssueStore();
  const isBookmarked = bookmarkedIssues.has(issue.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '760px' }}
      >
        {/* 헤더 */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            {(() => {
              const cfg = TYPE_CONFIG[issue.type];
              return (
                <div className={`w-5 h-5 rounded flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                </div>
              );
            })()}
            <span className="font-semibold">ISSUE#{issue.number}</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => toggleIssueBookmark({ id: issue.id, number: issue.number, title: issue.title })}
              className="btn-icon text-white/80 hover:text-white hover:bg-white/10"
              title={isBookmarked ? '북마크 해제' : '북마크'}
            >
              <Bookmark size={16} className={isBookmarked ? 'fill-white' : ''} />
            </button>
            <button onClick={onClose} className="btn-icon text-white/80 hover:text-white hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 좌측: 내용 */}
          <div className="flex-1 overflow-y-auto p-5">
            <h2 className="text-lg font-semibold text-text-primary mb-4">{issue.title}</h2>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-text-primary mb-2">내용</h3>
              <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed bg-surface rounded-lg p-3">
                {issue.content}
              </p>
            </div>

            {/* 연관 도면 */}
            {issue.relatedDrawings.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  해당 도면 (pill형식)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {issue.relatedDrawings.map((d) => (
                    <span key={d} className="pill bg-brand-muted text-brand border border-brand/20">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 댓글 입력 */}
            <div className="mt-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                  양
                </div>
                <textarea
                  placeholder="Add a comment"
                  rows={3}
                  className="input resize-none flex-1"
                />
              </div>
            </div>
          </div>

          {/* 우측: 메타 정보 */}
          <div className="w-56 flex-shrink-0 border-l border-border bg-surface overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* 상태 */}
              <div>
                <button
                  className={`pill ${STATUS_CLASS[issue.status]} flex items-center gap-1`}
                >
                  {STATUS_LABEL[issue.status]}
                  <ChevronDown size={11} />
                </button>
              </div>

              <div className="divider" />

              {/* 상세 정보 그리드 */}
              <div className="space-y-3 text-sm">
                <MetaRow
                  label="유형"
                  value={(() => {
                    const cfg = TYPE_CONFIG[issue.type];
                    return (
                      <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    );
                  })()}
                />
                <MetaRow label="담당자" value={issue.assignee} avatar />
                <MetaRow label="보고자" value={issue.reporter} avatar secondary />
                <MetaRow label="그룹" value={issue.group ?? '—'} />
                <MetaRow
                  label="우선순위"
                  value={
                    <span className={`pill ${PRIORITY_CLASS[issue.priority]}`}>
                      {PRIORITY_LABEL[issue.priority]}
                    </span>
                  }
                />
                <MetaRow label="발행일" value={issue.publishedAt.slice(0, 10)} />
                <MetaRow label="마감일" value={issue.dueDate} />
                <MetaRow label="레이블" value={issue.labels.join(', ') || '—'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  avatar = false,
  secondary = false,
}: {
  label: string;
  value: React.ReactNode;
  avatar?: boolean;
  secondary?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-xs text-text-muted flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">
        {avatar && (
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0
              ${secondary ? 'bg-status-urgent' : 'bg-brand'}`}
          >
            {typeof value === 'string' ? value.charAt(0) : ''}
          </div>
        )}
        {typeof value === 'string' ? (
          <span className="text-xs text-text-primary">{value}</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
