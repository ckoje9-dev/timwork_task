import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bookmark, Trash2, ChevronDown, PlusCircle, Pencil, AlertTriangle, FileStack } from 'lucide-react';
import type { Issue, IssueType } from '@/types';
import { useIssueStore } from '@/store/issue.store';
import { useDrawingStore } from '@/store/drawing.store';
import IssueCreateModal from './IssueCreateModal';
import { STATUS_LABEL, STATUS_CLASS, PRIORITY_LABEL, PRIORITY_CLASS, ISSUE_TYPE_META } from '@/constants/issue';

interface Props {
  issue: Issue;
  onClose: () => void;
}

const TYPE_ICONS: Record<IssueType, React.ReactNode> = {
  추가: <PlusCircle size={12} />,
  수정: <Pencil size={12} />,
  삭제: <Trash2 size={12} />,
  간섭: <AlertTriangle size={12} />,
};

export default function IssueDetailModal({ issue: issueProp, onClose }: Props) {
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue>(issueProp);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { bookmarkedIssues, toggleIssueBookmark, deleteIssue, updateIssue, groups, loadGroups } = useIssueStore();
  const { issuePins, removeIssuePin, selectDrawing } = useDrawingStore();

  const isBookmarked = bookmarkedIssues.has(issue.id);

  // 이 이슈와 연결된 핀 (도면 위 핀에서 생성된 이슈)
  const relatedPin = issuePins.find((p) => p.issueId === issue.id);

  const handleDelete = async () => {
    // 연결된 핀도 함께 제거
    issuePins.filter((p) => p.issueId === issue.id).forEach((p) => removeIssuePin(p.id));
    await deleteIssue(issue.id);
    onClose();
  };

  const handleViewOnDrawing = () => {
    if (!relatedPin) return;
    selectDrawing(relatedPin.drawingId, relatedPin.discipline, relatedPin.revisionVersion);
    navigate('/drawings');
    onClose();
  };

  return (
    <>
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
              const meta = ISSUE_TYPE_META[issue.type];
              return (
                <div className={`w-5 h-5 rounded flex items-center justify-center ${meta.bg} ${meta.color}`}>
                  {TYPE_ICONS[issue.type]}
                </div>
              );
            })()}
            <span className="font-semibold">ISSUE#{issue.number}</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => { loadGroups(); setShowEditModal(true); }}
              className="btn-icon text-white/80 hover:text-white hover:bg-white/10"
              title="이슈 수정"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-icon text-white/80 hover:text-white hover:bg-white/10"
              title="이슈 삭제"
            >
              <Trash2 size={15} />
            </button>
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
                  해당 도면
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
                    const meta = ISSUE_TYPE_META[issue.type];
                    return (
                      <span className={`flex items-center gap-1 text-xs font-medium ${meta.color}`}>
                        {TYPE_ICONS[issue.type]}
                        {meta.label}
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

              {/* 도면 핀 연결 — 핀에서 생성된 이슈인 경우 표시 */}
              {relatedPin && (
                <>
                  <div className="divider" />
                  <button
                    onClick={handleViewOnDrawing}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-brand bg-brand-muted hover:bg-brand/10 transition-colors"
                  >
                    <FileStack size={12} />
                    도면에서 보기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 삭제 확인 바 */}
        {showDeleteConfirm && (
          <div className="border-t border-red-200 px-5 py-3 bg-red-50 flex items-center justify-between flex-shrink-0">
            <p className="text-sm text-red-700 font-medium">이슈를 삭제하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-ghost text-sm"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    {showEditModal && (
      <IssueCreateModal
        groups={groups}
        onClose={() => setShowEditModal(false)}
        onSubmit={async (data) => {
          const updated = await updateIssue(issue.id, data);
          setIssue(updated);
          setShowEditModal(false);
        }}
        initialData={{
          type: issue.type,
          title: issue.title,
          content: issue.content,
          status: issue.status,
          priority: issue.priority,
          assignee: issue.assignee,
          reporter: issue.reporter,
          group: issue.group ?? '',
          labels: issue.labels,
          dueDate: issue.dueDate,
          relatedDrawings: issue.relatedDrawings,
        }}
        submitLabel="저장"
      />
    )}
    </>
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
