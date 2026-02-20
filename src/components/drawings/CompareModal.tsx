import { X, Eye, EyeOff } from 'lucide-react';
import { useDrawingStore, type DisciplineGroup, type LayerItem } from '@/store/drawing.store';
import DrawingViewer from './DrawingViewer';

/**
 * 도면 비교 모달
 * - 공종 단위 카드 UI: 각 카드에 공종 헤더(eye 토글) + 리비전 목록(최신순)
 * - 리비전 행: 색상 도트 + "REV# · 날짜" 한 줄 + opacity 슬라이더
 */

// ── 리비전 행 ─────────────────────────────────────────────────
function LayerRow({
  layer,
  discipline,
  disabled,
  onOpacity,
}: {
  layer: LayerItem;
  discipline: string;
  disabled: boolean;
  onOpacity: (v: number) => void;
}) {
  const label = layer.revision.date
    ? `${layer.revision.version} · ${layer.revision.date}`
    : layer.revision.version;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 transition-opacity ${
        disabled ? 'opacity-30 pointer-events-none' : ''
      }`}
    >
      <div
        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
        style={{ backgroundColor: layer.color }}
      />
      <span className="flex-1 text-xs text-text-secondary truncate" title={label}>
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={layer.opacity}
        onChange={(e) => onOpacity(Number(e.target.value))}
        className="w-14 h-1 accent-brand flex-shrink-0"
        title={`${discipline} ${layer.revision.version} 투명도 ${Math.round(layer.opacity * 100)}%`}
      />
    </div>
  );
}

// ── 공종 카드 ─────────────────────────────────────────────────
function DisciplineCard({
  group,
  onToggle,
  onOpacity,
}: {
  group: DisciplineGroup;
  onToggle: () => void;
  onOpacity: (version: string, v: number) => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      {/* 카드 헤더: [공종] 도면명 + eye 토글 */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="flex-1 text-xs font-semibold text-text-primary truncate">
          [{group.discipline}] {group.drawingName}
        </span>
        <button
          onClick={onToggle}
          className={`btn-icon w-6 h-6 flex-shrink-0 ${
            group.visible ? 'text-brand' : 'text-text-muted'
          }`}
          title={group.visible ? '숨기기' : '보이기'}
        >
          {group.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      </div>

      {/* 리비전 목록 */}
      <div className="pb-1.5">
        {group.layers.map((layer) => (
          <LayerRow
            key={layer.revision.version}
            layer={layer}
            discipline={group.discipline}
            disabled={!group.visible}
            onOpacity={(v) => onOpacity(layer.revision.version, v)}
          />
        ))}
      </div>
    </div>
  );
}

// ── 메인 모달 ─────────────────────────────────────────────────
export default function CompareModal() {
  const {
    compareMode,
    setCompareMode,
    selection,
    disciplineGroups,
    toggleDisciplineGroup,
    setGroupLayerOpacity,
  } = useDrawingStore();

  if (!compareMode || !selection) return null;

  return (
    <div
      className="fixed top-header left-sidebar right-0 bottom-0 bg-black/40 z-50 flex items-center justify-center p-5"
      onClick={() => setCompareMode(false)}
    >
      <div
        className="bg-white rounded-xl shadow-modal w-full h-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 파란 헤더 */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm">도면 비교</h2>
            <span className="text-white/70 text-xs">
              {selection.drawingId} — {selection.discipline}
            </span>
          </div>
          <button
            onClick={() => setCompareMode(false)}
            className="btn-icon text-white/80 hover:text-white hover:bg-white/10"
            title="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 본문: 뷰어 + 레이어 패널 */}
        <div className="flex-1 relative overflow-hidden">
          <DrawingViewer />

          {/* 왼쪽 플로팅 레이어 패널 */}
          <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-dropdown border border-border w-64 max-h-[calc(100%-2rem)] flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1">
              {disciplineGroups.map((group) => (
                <DisciplineCard
                  key={group.discipline}
                  group={group}
                  onToggle={() => toggleDisciplineGroup(group.discipline)}
                  onOpacity={(version, v) =>
                    setGroupLayerOpacity(group.discipline, version, v)
                  }
                />
              ))}
            </div>

            <div className="px-3 py-2 border-t border-border bg-surface flex-shrink-0">
              <p className="text-[11px] text-text-muted leading-relaxed">
                공종 눈 아이콘으로 레이어를 켜고 끄거나 슬라이더로 투명도를 조절하세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
