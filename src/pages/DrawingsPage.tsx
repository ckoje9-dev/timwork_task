import { useEffect, useState } from 'react';
import {
  Search,
  ChevronRight,
  Upload,
  Download,
  RefreshCw,
  Trash2,
  Layers,
} from 'lucide-react';
import { useDrawingStore } from '@/store/drawing.store';
import type { DrawingSelection } from '@/types';
import DrawingTree from '@/components/drawings/DrawingTree';
import DrawingViewer from '@/components/drawings/DrawingViewer';
import CompareModal from '@/components/drawings/CompareModal';

export default function DrawingsPage() {
  const { loadTree, selection, compareMode, tree, setCompareMode } = useDrawingStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('전체');
  const [issueVisible, setIssueVisible] = useState(false);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

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
          <DrawingTree />
        </div>
      </aside>

      {/* ── 우측 메인 영역 ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 상단 컨텍스트 바 */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border flex-shrink-0">
          {/* 브레드크럼 */}
          <Breadcrumb selection={selection} />

          {/* 우측 액션 */}
          <div className="flex items-center gap-2">
            {compareMode && (
              <span className="pill bg-brand text-white">비교 모드</span>
            )}
            {/* 이슈 토글 버튼 */}
            <button
              onClick={() => setIssueVisible((v) => !v)}
              className={`btn text-xs ${issueVisible ? 'btn-primary' : 'btn-secondary'}`}
            >
              이슈
            </button>
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

function Breadcrumb({ selection }: { selection: DrawingSelection | null }) {
  if (!selection) {
    return (
      <div className="flex items-center gap-1 text-sm text-text-muted">
        <span>도면을 선택해 주세요</span>
      </div>
    );
  }

  const parts = [
    { label: '전체 도면' },
    { label: selection.drawingId },
    { label: selection.discipline, highlight: true },
    selection.revisionVersion ? { label: selection.revisionVersion } : null,
  ].filter(Boolean) as { label: string; highlight?: boolean }[];

  return (
    <nav className="flex items-center gap-1 text-sm">
      {parts.map((part, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight size={13} className="text-text-muted" />}
          <span className={part.highlight ? 'text-brand font-semibold' : 'text-text-secondary'}>
            {part.label}
          </span>
        </span>
      ))}
    </nav>
  );
}
