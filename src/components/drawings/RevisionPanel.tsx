import { useEffect, useState } from 'react';
import { CheckCircle, Circle, ChevronRight, GitBranch } from 'lucide-react';
import { useDrawingStore } from '@/store/drawing.store';
import { getDrawingById, getAllRevisions } from '@/api/drawings';
import type { Revision, DrawingDiscipline } from '@/types';

export default function RevisionPanel() {
  const { selection, selectDrawing, compareMode, setCompareMode } = useDrawingStore();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [disciplineData, setDisciplineData] = useState<DrawingDiscipline | null>(null);

  useEffect(() => {
    if (!selection) {
      setRevisions([]);
      setDisciplineData(null);
      return;
    }

    getDrawingById(selection.drawingId).then((drawing) => {
      if (!drawing?.disciplines?.[selection.discipline]) return;
      const disc = drawing.disciplines[selection.discipline];
      setDisciplineData(disc);
      const revs = getAllRevisions(disc);
      setRevisions(revs);
    });
  }, [selection?.drawingId, selection?.discipline]);

  if (!selection || revisions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        도면을 선택하면 리비전 이력이 표시됩니다
      </div>
    );
  }

  const latestVersion = revisions[revisions.length - 1]?.version;

  return (
    <div className="h-full overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-brand" />
          <span className="text-sm font-semibold text-text-primary">리비전 이력</span>
          <span className="text-xs text-text-muted">({revisions.length}개)</span>
        </div>
        {revisions.length > 1 && (
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`btn text-xs ${compareMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            비교 모드 {compareMode ? 'ON' : 'OFF'}
          </button>
        )}
      </div>

      {/* 리비전 타임라인 */}
      <div className="px-4 py-3 space-y-0">
        {revisions.map((rev, idx) => {
          const isSelected = selection.revisionVersion === rev.version;
          const isLatest = rev.version === latestVersion;

          return (
            <div key={rev.version} className="flex gap-3">
              {/* 타임라인 선 */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() =>
                    selectDrawing(
                      selection.drawingId,
                      selection.discipline,
                      rev.version,
                    )
                  }
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10
                    transition-colors ${
                      isSelected
                        ? 'bg-brand text-white'
                        : 'bg-white border-2 border-border text-text-muted hover:border-brand'
                    }`}
                >
                  {isSelected ? (
                    <CheckCircle size={14} />
                  ) : (
                    <Circle size={10} />
                  )}
                </button>
                {idx < revisions.length - 1 && (
                  <div className="w-0.5 h-full bg-border my-1" />
                )}
              </div>

              {/* 리비전 정보 */}
              <div className={`flex-1 pb-4 ${idx === revisions.length - 1 ? 'pb-2' : ''}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <button
                    onClick={() =>
                      selectDrawing(
                        selection.drawingId,
                        selection.discipline,
                        rev.version,
                      )
                    }
                    className={`text-sm font-medium hover:text-brand transition-colors
                      ${isSelected ? 'text-brand' : 'text-text-primary'}`}
                  >
                    {rev.version}
                  </button>
                  {isLatest && (
                    <span className="pill bg-brand-muted text-brand text-xs">최신</span>
                  )}
                </div>

                <p className="text-xs text-text-muted mb-1">{rev.date}</p>
                <p className="text-xs text-text-secondary mb-1.5">{rev.description}</p>

                {/* 변경 사항 */}
                {rev.changes.length > 0 && (
                  <ul className="space-y-0.5">
                    {rev.changes.map((change, ci) => (
                      <li key={ci} className="flex items-start gap-1.5 text-xs text-text-secondary">
                        <ChevronRight size={10} className="mt-0.5 text-text-muted flex-shrink-0" />
                        {change}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* regions 있을 때 영역 표시 */}
      {disciplineData?.regions && (
        <div className="px-4 pb-3">
          <div className="divider" />
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            구역 분할
          </p>
          <div className="flex gap-2">
            {Object.keys(disciplineData.regions).map((regionKey) => (
              <span
                key={regionKey}
                className="pill bg-surface text-text-secondary border border-border"
              >
                구역 {regionKey}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
