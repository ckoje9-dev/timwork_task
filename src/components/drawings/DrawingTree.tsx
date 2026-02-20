import { useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, FileText, Bookmark } from 'lucide-react';
import { useDrawingStore } from '@/store/drawing.store';

interface Props {
  searchKeyword: string;
  filterDiscipline: string;
}

export default function DrawingTree({ searchKeyword, filterDiscipline }: Props) {
  const {
    tree, treeLoading, selection,
    expandedDisciplines, toggleDiscipline, selectDrawing,
    bookmarkedDrawings, toggleBookmark,
  } = useDrawingStore();

  const listRef = useRef<HTMLDivElement>(null);

  // 선택된 도면이 바뀌면 해당 항목으로 스크롤
  useEffect(() => {
    if (!selection || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>('[data-selected="true"]');
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selection?.drawingId, selection?.discipline]);

  if (treeLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="spinner" />
      </div>
    );
  }

  const kw = searchKeyword.trim().toLowerCase();
  const isSearching = kw.length > 0;

  // 공종 필터 → 키워드 필터 순으로 적용
  const filteredEntries = Object.entries(tree)
    .filter(([discipline]) => filterDiscipline === '전체' || discipline === filterDiscipline)
    .map(([discipline, nodes]) => {
      const filteredNodes = isSearching
        ? nodes.filter(
            (n) =>
              n.drawingId.toLowerCase().includes(kw) ||
              n.drawingName.toLowerCase().includes(kw),
          )
        : nodes;
      // 도면 ID 기준 오름차순 정렬
      const sortedNodes = [...filteredNodes].sort((a, b) =>
        a.drawingId.localeCompare(b.drawingId, undefined, { numeric: true }),
      );
      return [discipline, sortedNodes] as const;
    })
    .filter(([, nodes]) => nodes.length > 0);

  if (filteredEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-text-muted">
        검색 결과가 없습니다
      </div>
    );
  }

  return (
    <div ref={listRef} className="py-2 overflow-y-auto h-full">
      {filteredEntries.map(([discipline, nodes]) => {
        // 키워드 검색 중에는 전부 펼침
        const isExpanded = isSearching || expandedDisciplines.has(discipline);

        return (
          <div key={discipline}>
            {/* 공종 헤더 (아코디언) */}
            <button
              onClick={() => toggleDiscipline(discipline)}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                         text-text-secondary uppercase tracking-wide hover:bg-surface-hover
                         transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={13} className="flex-shrink-0" />
              ) : (
                <ChevronRight size={13} className="flex-shrink-0" />
              )}
              <span>{discipline}</span>
              <span className="ml-auto text-text-muted font-normal normal-case tracking-normal">
                {nodes.length}
              </span>
            </button>

            {/* 도면 목록 */}
            {isExpanded && (
              <ul>
                {nodes.map((node) => {
                  const isSelected =
                    selection?.drawingId === node.drawingId &&
                    selection?.discipline === node.discipline;

                  const bookmarkKey = `${node.drawingId}-${node.discipline}`;
                  const isBookmarked = bookmarkedDrawings.has(bookmarkKey);

                  return (
                    <li key={bookmarkKey} data-selected={isSelected ? 'true' : undefined}>
                      {/* 버튼 분리: 선택 영역 + 우측 북마크/배지 */}
                      <div
                        className={[
                          'group flex items-center transition-colors text-sm',
                          isSelected
                            ? 'bg-brand-light text-brand font-medium'
                            : 'text-text-secondary hover:bg-surface-hover',
                        ].join(' ')}
                      >
                        {/* 선택 버튼 (flex-1) */}
                        <button
                          onClick={() => {
                            const latestVersion = node.latestRevision?.version ?? '';
                            selectDrawing(node.drawingId, node.discipline, latestVersion);
                          }}
                          className="flex-1 flex items-center gap-2 pl-6 py-2 text-left min-w-0"
                        >
                          <FileText
                            size={14}
                            className={`flex-shrink-0 ${isSelected ? 'text-brand' : 'text-text-muted'}`}
                          />
                          <span className="flex-1 min-w-0 truncate leading-tight">
                            {node.drawingId !== '00'
                              ? `${node.drawingId}_${node.drawingName}`
                              : node.drawingName}
                          </span>
                        </button>

                        {/* 우측: 북마크 */}
                        <div className="pr-2 flex-shrink-0">
                          <button
                            onClick={() => toggleBookmark(node.drawingId, node.discipline)}
                            title={isBookmarked ? '북마크 해제' : '북마크'}
                            className={[
                              'p-1 rounded transition-all',
                              isBookmarked
                                ? 'text-brand opacity-100'
                                : 'text-text-muted opacity-0 group-hover:opacity-100 hover:text-brand',
                            ].join(' ')}
                          >
                            <Bookmark
                              size={12}
                              className={isBookmarked ? 'fill-brand' : ''}
                            />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
