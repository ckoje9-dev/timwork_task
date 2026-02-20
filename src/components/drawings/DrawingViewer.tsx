import { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Hand, ScanSearch } from 'lucide-react';
import { getImageUrl } from '@/api/drawings';
import { useDrawingStore, type CompareLayer } from '@/store/drawing.store';
import type { DrawingSelection } from '@/types';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const ZOOM_FACTOR = 1.2;

export default function DrawingViewer() {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);

  // ref로 드래그 시작 상태 관리 (재렌더링 없이 최신값 유지)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; tx: number; ty: number } | null>(null);

  const { selection, compareMode, compareLayers } = useDrawingStore();

  // 선택이 바뀌면 뷰 초기화 (이미지 로드 후 fit 적용)
  useEffect(() => {
    setImageLoaded(false);
    setImageDimensions(null);
    setTransform({ x: 0, y: 0, scale: 1 });
  }, [selection?.drawingId, selection?.discipline, selection?.revisionVersion]);

  // ── 드래그 중 window 레벨에서 이벤트 처리 ───────────────────
  // 이유: React 합성 이벤트는 컨테이너 밖으로 나가면 누락됨.
  // window에 등록하면 마우스가 컨테이너 밖으로 빠져도 추적 가능.
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setTransform((prev) => ({
        ...prev,
        x: dragStartRef.current!.tx + dx,
        y: dragStartRef.current!.ty + dy,
      }));
    };

    const onMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  // ── 마우스 다운: 드래그 시작 ─────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // 네이티브 드래그 방지 (blank 현상 원인)
    e.preventDefault();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
    setIsDragging(true);
  }, [transform.x, transform.y]);

  // ── 휠 줌 (네이티브 이벤트로 passive 문제 회피) ──────────────
  // containerEl이 마운트된 뒤에만 실행되도록 콜백 ref(useState) 사용
  useEffect(() => {
    if (!containerEl) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;

      setTransform((prev) => {
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
        const rect = containerEl.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
        return { x: newX, y: newY, scale: newScale };
      });
    };

    // passive: false → preventDefault() 허용
    containerEl.addEventListener('wheel', onWheel, { passive: false });
    return () => containerEl.removeEventListener('wheel', onWheel);
  }, [containerEl]);

  const fitToScreen = useCallback(() => {
    if (containerEl && imageDimensions) {
      setTransform(calcFitTransform(containerEl, imageDimensions.w, imageDimensions.h));
    }
  }, [containerEl, imageDimensions]);

  const zoom = useCallback((factor: number) => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor)),
    }));
  }, []);

  const currentImage = getCurrentImage(selection, compareLayers, compareMode);

  if (!selection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted gap-3">
        <ScanSearch size={48} className="opacity-30" />
        <p className="text-sm">왼쪽 목록에서 도면을 선택하세요</p>
      </div>
    );
  }

  return (
    <div
      ref={setContainerEl}
      className="relative w-full h-full bg-gray-100 overflow-hidden"
    >
      {/* 줌/패닝 영역 */}
      <div
        className={`w-full h-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        // 네이티브 HTML 드래그 차단 → 이게 없으면 클릭 드래그 시 페이지 blank 현상 발생
        onDragStart={(e) => e.preventDefault()}
      >
        {/* 변환 레이어 */}
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            // 드래그 중에는 transition 끄기 (지연 느낌 방지)
            transition: isDragging ? 'none' : 'transform 0.05s ease-out',
            willChange: 'transform',
          }}
          className="relative"
        >
          {/* 기본 도면 이미지 */}
          {currentImage && (
            <img
              key={currentImage}
              src={getImageUrl(currentImage)}
              alt="도면"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                const natW = img.naturalWidth;
                const natH = img.naturalHeight;
                setImageDimensions({ w: natW, h: natH });
                setImageLoaded(true);
                if (containerEl) {
                  setTransform(calcFitTransform(containerEl, natW, natH));
                }
              }}
              className="block max-w-none"
              style={{ maxWidth: 'none', userSelect: 'none', pointerEvents: 'none' }}
            />
          )}

          {/* 비교 모드: 리비전 레이어 오버레이 */}
          {compareMode && compareLayers.length > 1 && (
            <div className="absolute inset-0">
              {compareLayers.slice(1).map((layer) => {
                if (!layer.visible) return null;
                return (
                  <img
                    key={layer.revision.version}
                    src={getImageUrl(layer.revision.image)}
                    alt={layer.revision.version}
                    draggable={false}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                      opacity: layer.opacity,
                      mixBlendMode: 'multiply',
                      filter: `hue-rotate(${getHueRotate(layer.color)}deg) saturate(2)`,
                      maxWidth: 'none',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 로딩 인디케이터 */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 pointer-events-none">
          <div className="spinner" />
        </div>
      )}

      {/* ── 줌 컨트롤 (우측 하단) ─────────────────────────────── */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => zoom(ZOOM_FACTOR)}
          className="btn-icon bg-white shadow-card border border-border"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => zoom(1 / ZOOM_FACTOR)}
          className="btn-icon bg-white shadow-card border border-border"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={fitToScreen}
          className="btn-icon bg-white shadow-card border border-border"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* ── 하단 툴바 ──────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-800/90 rounded-full px-4 py-2 shadow-lg">
        <button
          className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          title="패닝"
        >
          <Hand size={16} />
        </button>
        <div className="w-px h-4 bg-white/20 mx-1" />
        <span className="text-white/60 text-xs">{Math.round(transform.scale * 100)}%</span>
      </div>
    </div>
  );
}

// ── 헬퍼 ────────────────────────────────────────────────────────

/** 컨테이너 안에 이미지가 꽉 차도록 scale·위치를 계산 */
function calcFitTransform(container: HTMLDivElement, natW: number, natH: number): Transform {
  const PAD = 24;
  const cW = container.clientWidth;
  const cH = container.clientHeight;
  const scale = Math.min((cW - PAD * 2) / natW, (cH - PAD * 2) / natH);
  const x = (cW - natW * scale) / 2;
  const y = (cH - natH * scale) / 2;
  return { x, y, scale };
}

function getCurrentImage(
  selection: DrawingSelection | null,
  compareLayers: CompareLayer[],
  compareMode: boolean,
): string | null {
  if (!selection) return null;

  if (compareMode && compareLayers.length > 0) {
    const baseLayer = compareLayers.find((l: CompareLayer) => l.visible);
    return baseLayer?.revision.image ?? null;
  }

  if (compareLayers.length > 0) {
    const selected = compareLayers.find(
      (l: CompareLayer) => l.revision.version === selection.revisionVersion,
    );
    if (selected) return selected.revision.image;
    return compareLayers[compareLayers.length - 1]?.revision.image ?? null;
  }

  return null;
}

function getHueRotate(color: string): number {
  const map: Record<string, number> = {
    '#374151': 0,
    '#2563EB': 220,
    '#F59E0B': 40,
    '#10B981': 155,
  };
  return map[color] ?? 0;
}
