import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import type { IssueStatus, IssuePriority } from '@/types';

// ── 타입 ─────────────────────────────────────────────────────

export interface CreateIssueData {
  title: string;
  content: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: string;
  reporter: string;
  group: string | null;
  labels: string[];
  dueDate: string;
  relatedDrawings: string[];
}

interface Props {
  groups: string[];
  onClose: () => void;
  onSubmit: (data: CreateIssueData) => void;
  initialRelatedDrawings?: string[];
}

// ── 상수 ─────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'TODO', label: 'TODO' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { value: 'IN_REVIEW', label: 'IN REVIEW' },
  { value: 'DONE', label: 'DONE' },
];

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: 'URGENT', label: '긴급' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'LOW', label: '낮음' },
];

const STATUS_CLASS: Record<IssueStatus, string> = {
  TODO: 'pill-todo',
  IN_PROGRESS: 'pill-in-progress',
  IN_REVIEW: 'pill-in-review',
  DONE: 'pill-done',
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function IssueCreateModal({ groups, onClose, onSubmit, initialRelatedDrawings }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<IssueStatus>('TODO');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [assignee, setAssignee] = useState('');
  const [reporter, setReporter] = useState('');
  const [group, setGroup] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [drawingInput, setDrawingInput] = useState('');
  const [relatedDrawings, setRelatedDrawings] = useState<string[]>(initialRelatedDrawings ?? []);

  // 태그 추가 헬퍼
  const addTag = (
    val: string,
    list: string[],
    setList: (v: string[]) => void,
    clearInput: () => void,
  ) => {
    const trimmed = val.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    clearInput();
  };

  const handleTagKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    val: string,
    list: string[],
    setList: (v: string[]) => void,
    clearInput: () => void,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(val, list, setList, clearInput);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      content,
      status,
      priority,
      assignee,
      reporter,
      group: group || null,
      labels,
      dueDate,
      relatedDrawings,
    });
  };

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
            <div className="w-4 h-4 rounded-sm bg-white/20" />
            <span className="font-semibold">새 이슈 생성</span>
          </div>
          <button
            onClick={onClose}
            className="btn-icon text-white/80 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 좌측: 제목 / 내용 / 연관 도면 */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {/* 제목 */}
            <input
              type="text"
              placeholder="이슈 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full text-base font-semibold"
              autoFocus
            />

            {/* 내용 */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">내용</h3>
              <textarea
                placeholder="이슈 내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="input resize-none w-full text-sm leading-relaxed"
              />
            </div>

            {/* 연관 도면 */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">연관 도면</h3>
              {relatedDrawings.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {relatedDrawings.map((d) => (
                    <span
                      key={d}
                      className="pill bg-brand-muted text-brand border border-brand/20 flex items-center gap-1"
                    >
                      {d}
                      <button
                        onClick={() =>
                          setRelatedDrawings(relatedDrawings.filter((x) => x !== d))
                        }
                        className="hover:text-red-400 leading-none"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="도면명 입력 후 Enter 또는 +"
                  value={drawingInput}
                  onChange={(e) => setDrawingInput(e.target.value)}
                  onKeyDown={(e) =>
                    handleTagKeyDown(
                      e,
                      drawingInput,
                      relatedDrawings,
                      setRelatedDrawings,
                      () => setDrawingInput(''),
                    )
                  }
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={() =>
                    addTag(drawingInput, relatedDrawings, setRelatedDrawings, () =>
                      setDrawingInput(''),
                    )
                  }
                  className="btn-ghost"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* 하단 액션 */}
            <div className="flex justify-end gap-2 mt-auto pt-2">
              <button onClick={onClose} className="btn-ghost">
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                이슈 생성
              </button>
            </div>
          </div>

          {/* 우측: 메타 정보 */}
          <div className="w-56 flex-shrink-0 border-l border-border bg-surface overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* 상태 */}
              <div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IssueStatus)}
                  className={`pill ${STATUS_CLASS[status]} cursor-pointer pr-1`}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="divider" />

              <div className="space-y-3">
                {/* 담당자 */}
                <MetaField label="담당자">
                  <input
                    type="text"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    placeholder="담당자 이름"
                    className="input text-xs py-1 px-2 w-full"
                  />
                </MetaField>

                {/* 보고자 */}
                <MetaField label="보고자">
                  <input
                    type="text"
                    value={reporter}
                    onChange={(e) => setReporter(e.target.value)}
                    placeholder="보고자 이름"
                    className="input text-xs py-1 px-2 w-full"
                  />
                </MetaField>

                {/* 그룹 */}
                <MetaField label="그룹">
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="select text-xs py-1 w-full"
                  >
                    <option value="">그룹 없음</option>
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </MetaField>

                {/* 우선순위 */}
                <MetaField label="우선순위">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IssuePriority)}
                    className="select text-xs py-1 w-full"
                  >
                    {PRIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </MetaField>

                {/* 마감일 */}
                <MetaField label="마감일">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input text-xs py-1 px-2 w-full"
                  />
                </MetaField>

                {/* 레이블 */}
                <MetaField label="레이블">
                  {labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {labels.map((l) => (
                        <span
                          key={l}
                          className="pill bg-surface-hover text-text-secondary flex items-center gap-0.5 text-[10px]"
                        >
                          {l}
                          <button
                            onClick={() => setLabels(labels.filter((x) => x !== l))}
                            className="hover:text-red-400 leading-none"
                          >
                            <X size={8} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) =>
                      handleTagKeyDown(e, labelInput, labels, setLabels, () =>
                        setLabelInput(''),
                      )
                    }
                    placeholder="Enter로 추가"
                    className="input text-xs py-1 px-2 w-full"
                  />
                </MetaField>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MetaField ────────────────────────────────────────────────

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-text-muted">{label}</span>
      {children}
    </div>
  );
}
