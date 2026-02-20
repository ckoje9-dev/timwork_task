import { X, Eye, EyeOff } from 'lucide-react';
import { useDrawingStore } from '@/store/drawing.store';
import DrawingViewer from './DrawingViewer';

/**
 * 도면 비교 모달
 * - 이슈 상세 모달과 동일한 스타일(파란 헤더, 흰 패널, 어두운 오버레이)
 * - 좌측 사이드바(240px)와 상단 헤더(64px)는 가리지 않음
 */
export default function CompareModal() {
  const {
    compareMode,
    compareLayers,
    toggleCompareLayer,
    setLayerOpacity,
    setCompareMode,
    selection,
  } = useDrawingStore();

  if (!compareMode || !selection) return null;

  return (
    /* 오버레이: 사이드바(left-sidebar) · 헤더(top-header) 이후 영역만 덮음 */
    <div
      className="fixed top-header left-sidebar right-0 bottom-0 bg-black/40 z-50 flex items-center justify-center p-5"
      onClick={() => setCompareMode(false)}
    >
      {/* ── 모달 패널 ──────────────────────────────────────────── */}
      <div
        className="bg-white rounded-xl shadow-modal w-full h-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 파란 헤더 (이슈 모달과 동일한 modal-header 스타일) */}
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

        {/* ── 본문: 도면 뷰어 + 레이어 패널 ─────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          {/* 도면 뷰어 (줌/패닝) */}
          <DrawingViewer />

          {/* 왼쪽 플로팅 레이어 패널 */}
          <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-dropdown border border-border w-56 overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-text-primary">리비전 레이어</p>
            </div>

            <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
              {compareLayers.map((layer) => (
                <div
                  key={layer.revision.version}
                  className="flex items-center gap-2 px-1.5 py-2 rounded hover:bg-surface-hover"
                >
                  {/* 색상 도트 */}
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: layer.color }}
                  />

                  {/* 버전 + 날짜 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary leading-none">
                      {layer.revision.version}
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">{layer.revision.date}</p>
                  </div>

                  {/* 투명도 슬라이더 */}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={layer.opacity}
                    onChange={(e) =>
                      setLayerOpacity(layer.revision.version, Number(e.target.value))
                    }
                    className="w-14 h-1 accent-brand flex-shrink-0"
                    disabled={!layer.visible}
                    title={`투명도 ${Math.round(layer.opacity * 100)}%`}
                  />

                  {/* 가시성 토글 */}
                  <button
                    onClick={() => toggleCompareLayer(layer.revision.version)}
                    className={`btn-icon w-6 h-6 flex-shrink-0 ${
                      layer.visible ? 'text-brand' : 'text-text-muted'
                    }`}
                    title={layer.visible ? '숨기기' : '보이기'}
                  >
                    {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                </div>
              ))}
            </div>

            <div className="px-3 py-2 border-t border-border bg-surface">
              <p className="text-[11px] text-text-muted leading-relaxed">
                레이어를 켜고 끄거나 투명도를 조절해 변경점을 비교하세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
