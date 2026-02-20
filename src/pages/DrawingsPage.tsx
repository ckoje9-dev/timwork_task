import { useEffect, useRef, useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  RefreshCw,
  Trash2,
  Layers,
  Clock,
} from 'lucide-react';
import { useDrawingStore, type LayerItem } from '@/store/drawing.store';
import type { DrawingSelection, DrawingTreeByDiscipline } from '@/types';
import DrawingTree from '@/components/drawings/DrawingTree';
import DrawingViewer from '@/components/drawings/DrawingViewer';
import CompareModal from '@/components/drawings/CompareModal';

export default function DrawingsPage() {
  const { loadTree, selection, compareMode, disciplineGroups, tree, setCompareMode, setRevisionVersion, expandDiscipline, issueVisible, setIssueVisible } = useDrawingStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('전체');

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (filterDiscipline !== '전체') {
      expandDiscipline(filterDiscipline);
    }
  }, [filterDiscipline, expandDiscipline]);

  const disciplines = ['전체', ...Object.keys(tree).filter((d) => d !== '전체')];

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── 좌측 패널: 도면 트리 ────────────────────── */}
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-white">
        {/* 아이콘 툴바 */}
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border">
          <ToolbarButton icon={<Upload size={15} />} label="업로드" />
          <ToolbarButton icon={<Download size={15} />} label="다운로드" />
          <ToolbarButton icon={<RefreshCw size={15} />} label="업데이트" />
          <ToolbarButton icon={<Trash2 size={15} />} label="삭제" danger />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            icon={<Layers size={15} />}
            label="비교"
            onClick={() => selection && setCompareMode(true)}
            disabled={!selection}
          />
        </div>

        {/* 검색 + 공종 드롭다운 */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          {/* 공종 필터 드롭다운 */}
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            className="select text-xs w-24 flex-shrink-0"
          >
            {disciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* 키워드 검색 */}
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="키워드 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-7 text-xs w-full"
            />
          </div>
        </div>

        {/* 트리 */}
        <div className="flex-1 overflow-hidden">
          <DrawingTree searchKeyword={searchKeyword} filterDiscipline={filterDiscipline} />
        </div>
      </aside>

      {/* ── 우측 메인 영역 ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 상단 컨텍스트 바 */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border flex-shrink-0">
          {/* 브레드크럼 */}
          <Breadcrumb selection={selection} tree={tree} />

          {/* 우측: rev 정보 + 액션 버튼 */}
          <div className="flex items-center gap-3">
            {/* 선택된 도면의 rev 피커 */}
            {selection && (() => {
              const selectedGroup = disciplineGroups.find((g) => g.discipline === selection.discipline);
              if (!selectedGroup || selectedGroup.layers.length === 0) return null;
              return (
                <RevisionPicker
                  layers={selectedGroup.layers}
                  currentVersion={selection.revisionVersion}
                  onSelect={setRevisionVersion}
                />
              );
            })()}
            {compareMode && (
              <span className="pill bg-brand text-white">비교 모드</span>
            )}
            {/* 이슈 토글 스위치 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-secondary">이슈</span>
              <button
                role="switch"
                aria-checked={issueVisible}
                onClick={() => setIssueVisible(!issueVisible)}
                className={[
                  'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200',
                  issueVisible ? 'bg-brand' : 'bg-gray-200',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5',
                    issueVisible ? 'translate-x-4' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 도면 뷰어 (리비전 패널 제거 → 풀 너비) */}
        <div className="flex-1 relative min-w-0 overflow-hidden">
          <DrawingViewer />
          <CompareModal />
        </div>
      </div>
    </div>
  );
}

// ── 리비전 피커 ───────────────────────────────────────────────

function RevisionPicker({
  layers,
  currentVersion,
  onSelect,
}: {
  layers: LayerItem[];
  currentVersion: string;
  onSelect: (version: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = layers.find((l) => l.revision.version === currentVersion) ?? layers[0];
  if (!current) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary border-r border-border pr-3 transition-colors"
      >
        <Clock size={11} />
        <span>{current.revision.version}</span>
        <span>·</span>
        <span>{current.revision.date}</span>
        <ChevronDown
          size={11}
          className={`ml-0.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[220px]">
          {layers.map((layer) => {
            const isActive = layer.revision.version === currentVersion;
            return (
              <button
                key={layer.revision.version}
                onClick={() => {
                  onSelect(layer.revision.version);
                  setOpen(false);
                }}
                className={[
                  'w-full flex flex-col gap-0.5 px-3 py-2 text-left text-xs hover:bg-surface-hover transition-colors',
                  isActive ? 'text-brand' : 'text-text-secondary',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{layer.revision.version}</span>
                  <span className={isActive ? 'text-brand/70' : 'text-text-muted'}>
                    {layer.revision.date}
                  </span>
                </div>
                {layer.revision.description && (
                  <span className="text-text-muted truncate">{layer.revision.description}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 툴바 아이콘 버튼 ─────────────────────────────────────────

function ToolbarButton({
  icon,
  label,
  danger = false,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        danger
          ? 'text-status-urgent hover:bg-red-50'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
      ].join(' ')}
    >
      {icon}
      <span className="text-[10px] leading-none">{label}</span>
    </button>
  );
}

// ── 브레드크럼 ────────────────────────────────────────────────

function Breadcrumb({
  selection,
  tree,
}: {
  selection: DrawingSelection | null;
  tree: DrawingTreeByDiscipline;
}) {
  if (!selection) {
    return (
      <div className="flex items-center gap-1 text-sm text-text-muted">
        <span>도면을 선택해 주세요</span>
      </div>
    );
  }

  // tree에서 실제 도면명 조회
  const node = tree[selection.discipline]?.find((n) => n.drawingId === selection.drawingId);
  const drawingName = node?.drawingName ?? selection.drawingId;

  // 트리와 동일한 포맷: 전체 배치도(00)는 ID 없이 도면명만, 나머지는 ID_도면명
  const drawingLabel =
    selection.drawingId === '00' ? drawingName : `${selection.drawingId}_${drawingName}`;

  // {공종} > {도면명} 형식
  const parts: { label: string; highlight?: boolean }[] = [
    { label: selection.discipline },
    { label: drawingLabel, highlight: true },
  ];

  return (
    <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
      {parts.map((part, idx) => (
        <span key={idx} className="flex items-center gap-1 min-w-0">
          {idx > 0 && <ChevronRight size={13} className="flex-shrink-0 text-text-muted" />}
          <span
            className={[
              part.highlight ? 'text-brand font-semibold' : 'text-text-secondary',
              idx === parts.length - 2 ? 'truncate' : '',
            ].join(' ')}
            title={part.label}
          >
            {part.label}
          </span>
        </span>
      ))}
    </nav>
  );
}
