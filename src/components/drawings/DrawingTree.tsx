import { ChevronDown, ChevronRight, FileText, Clock } from 'lucide-react';
import { useDrawingStore } from '@/store/drawing.store';

export default function DrawingTree() {
  const { tree, treeLoading, selection, expandedDisciplines, toggleDiscipline, selectDrawing } =
    useDrawingStore();

  if (treeLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="py-2 overflow-y-auto h-full">
      {Object.entries(tree).map(([discipline, nodes]) => {
        const isExpanded = expandedDisciplines.has(discipline);

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

                  return (
                    <li key={`${node.drawingId}-${node.discipline}`}>
                      <button
                        onClick={() => {
                          const latestVersion =
                            node.latestRevision?.version ?? '';
                          selectDrawing(
                            node.drawingId,
                            node.discipline,
                            latestVersion,
                          );
                        }}
                        className={[
                          'w-full flex items-start gap-2 pl-6 pr-3 py-2 text-left',
                          'transition-colors hover:bg-surface-hover text-sm',
                          isSelected
                            ? 'bg-brand-light text-brand font-medium'
                            : 'text-text-secondary',
                        ].join(' ')}
                      >
                        <FileText
                          size={14}
                          className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-brand' : 'text-text-muted'}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate leading-tight">
                            {node.drawingId !== '00'
                              ? `${node.drawingId}_${node.drawingName}`
                              : node.drawingName}
                          </p>
                          {node.latestRevision && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock size={10} className="text-text-muted" />
                              <span className="text-xs text-text-muted">
                                {node.latestRevision.version} ·{' '}
                                {node.latestRevision.date}
                              </span>
                            </div>
                          )}
                        </div>
                        {node.revisionCount > 1 && (
                          <span className="flex-shrink-0 text-xs bg-surface rounded px-1.5 py-0.5 text-text-muted">
                            {node.revisionCount}
                          </span>
                        )}
                      </button>
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
