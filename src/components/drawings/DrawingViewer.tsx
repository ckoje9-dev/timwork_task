import { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, ScanSearch, MapPin, User } from 'lucide-react';
import { getImageUrl, getChildDrawings } from '@/api/drawings';
import { useDrawingStore, type DisciplineGroup, type IssuePin } from '@/store/drawing.store';
import type { DrawingSelection, Drawing } from '@/types';

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

  const { selection, compareMode, disciplineGroups, baseDrawingImage, tree, selectDrawing, issueVisible, issuePins, addIssuePin } = useDrawingStore();
  const [hoveredPolygonId, setHoveredPolygonId] = useState<string | null>(null);
  const [childDrawings, setChildDrawings] = useState<Drawing[]>([]);
  const [isAddingIssue, setIsAddingIssue] = useState(false);

  // 전체 배치도일 때 자식 도면 목록 로드
  useEffect(() => {
    if (selection?.drawingId !== '00') {
      setChildDrawings([]);
      return;
    }
    getChildDrawings('00').then(setChildDrawings);
  }, [selection?.drawingId]);

  // 폴리곤 클릭 → 첫 번째 공종으로 navigate
  const handlePolygonClick = useCallback(
    (drawingId: string) => {
      for (const [discipline, nodes] of Object.entries(tree)) {
        if (discipline === '전체') continue;
        const node = nodes.find((n) => n.drawingId === drawingId);
        if (node) {
          selectDrawing(drawingId, discipline, node.latestRevision?.version ?? '');
          return;
        }
      }
    },
    [tree, selectDrawing],
  );

  // 선택이 바뀌면 뷰 초기화 (이미지 로드 후 fit 적용)
  useEffect(() => {
    setImageLoaded(false);
    setImageDimensions(null);
    setTransform({ x: 0, y: 0, scale: 1 });
  }, [selection?.drawingId, selection?.discipline, selection?.revisionVersion]);

  // ESC 키로 이슈 배치 모드 취소
  useEffect(() => {
    if (!isAddingIssue) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAddingIssue(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAddingIssue]);

  // ── 드래그 중 window 레벨에서 이벤트 처리 ───────────────────
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
    if (isAddingIssue) return; // 이슈 배치 모드에서는 드래그 비활성화
    e.preventDefault();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
    setIsDragging(true);
  }, [transform.x, transform.y, isAddingIssue]);

  // ── 이슈 핀 배치 클릭 ────────────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isAddingIssue || !containerEl || !selection) return;
    const rect = containerEl.getBoundingClientRect();
    const imgX = (e.clientX - rect.left - transform.x) / transform.scale;
    const imgY = (e.clientY - rect.top - transform.y) / transform.scale;
    addIssuePin(selection.drawingId, selection.discipline, imgX, imgY);
    setIsAddingIssue(false);
  }, [isAddingIssue, containerEl, selection, transform, addIssuePin]);

  // ── 휠 줌 ──────────────────────────────────────────────────
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

  const currentImage = getCurrentImage(selection, disciplineGroups, compareMode, baseDrawingImage);

  // 비교 모드 기준 공종 레이어의 imageTransform (오버레이 정렬 기준)
  const baseTx = compareMode
    ? disciplineGroups.find((g) => g.discipline === selection?.discipline)?.layers[0]?.imageTransform
    : undefined;

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
        className={`w-full h-full select-none ${
          isAddingIssue ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onClick={handleCanvasClick}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* 변환 레이어 */}
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
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

          {/* 비교 모드: 오버레이 레이어 */}
          {compareMode && disciplineGroups.flatMap((group) => {
            if (!group.visible) return [];
            const isSelectedGroup = group.discipline === selection.discipline;
            // 선택된 공종의 첫 번째 레이어는 베이스 이미지로 사용됨
            const overlayLayers = isSelectedGroup ? group.layers.slice(1) : group.layers;
            return overlayLayers.map((layer) => {
              // imageTransform으로 기준 이미지 대비 위치·스케일 계산
              const overlayTx = layer.imageTransform;
              let cssTransform: string | undefined;
              if (baseTx && overlayTx && baseTx.scale !== 0 && overlayTx.scale !== 0) {
                const displayScale = baseTx.scale / overlayTx.scale;
                const lx = baseTx.x - overlayTx.x * displayScale;
                const ly = baseTx.y - overlayTx.y * displayScale;
                cssTransform = `translate(${lx}px, ${ly}px) scale(${displayScale})`;
              }
              return (
                <img
                  key={`${group.discipline}-${layer.revision.version}`}
                  src={getImageUrl(layer.revision.image)}
                  alt={`${group.discipline} ${layer.revision.version}`}
                  draggable={false}
                  className="absolute top-0 left-0"
                  style={{
                    transformOrigin: '0 0',
                    transform: cssTransform,
                    opacity: layer.opacity,
                    mixBlendMode: 'multiply',
                    filter: `hue-rotate(${getHueRotate(layer.color)}deg) saturate(2)`,
                    maxWidth: 'none',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              );
            });
          })}

          {/* 전체 배치도: 자식 도면 폴리곤 클릭 영역 */}
          {selection?.drawingId === '00' && imageDimensions && childDrawings.length > 0 && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: imageDimensions.w,
                height: imageDimensions.h,
              }}
              viewBox={`0 0 ${imageDimensions.w} ${imageDimensions.h}`}
            >
              {childDrawings.map((child) => {
                if (!child.position) return null;
                const pts = child.position.vertices.map(([x, y]) => `${x},${y}`).join(' ');
                const cx = child.position.vertices.reduce((s, [x]) => s + x, 0) / child.position.vertices.length;
                const cy = child.position.vertices.reduce((s, [, y]) => s + y, 0) / child.position.vertices.length;
                const isHovered = hoveredPolygonId === child.id;
                return (
                  <g
                    key={child.id}
                    style={{ cursor: 'pointer' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handlePolygonClick(child.id)}
                    onMouseEnter={() => setHoveredPolygonId(child.id)}
                    onMouseLeave={() => setHoveredPolygonId(null)}
                  >
                    <polygon
                      points={pts}
                      fill={isHovered ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.08)'}
                      stroke={isHovered ? '#2563EB' : '#3B82F6'}
                      strokeWidth={isHovered ? 5 : 3}
                      style={{ transition: 'fill 0.15s, stroke-width 0.15s' }}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={26}
                      fontWeight={600}
                      fill={isHovered ? '#1D4ED8' : '#1E40AF'}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {child.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* 이슈 핀 오버레이 */}
      {issueVisible && (
        <div className="absolute inset-0" style={{ pointerEvents: 'none', zIndex: 5 }}>
          {issuePins
            .filter(
              (p) =>
                p.drawingId === selection?.drawingId &&
                p.discipline === selection?.discipline,
            )
            .map((pin) => {
              const sx = pin.x * transform.scale + transform.x;
              const sy = pin.y * transform.scale + transform.y;
              return (
                <div
                  key={pin.id}
                  style={{ position: 'absolute', left: sx, top: sy, pointerEvents: 'auto' }}
                >
                  <IssuePinMarker pin={pin} />
                </div>
              );
            })}
        </div>
      )}

      {/* 로딩 인디케이터 */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 pointer-events-none">
          <div className="spinner" />
        </div>
      )}

      {/* ── 줌 컨트롤 (우측 하단) ─────────────────────────────── */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1" style={{ zIndex: 10 }}>
        <button
          onClick={() => setIsAddingIssue((v) => !v)}
          className={`btn-icon shadow-card border border-border ${
            isAddingIssue ? 'bg-brand text-white border-brand' : 'bg-white'
          }`}
          title={isAddingIssue ? '이슈 배치 취소 (ESC)' : '이슈 배치'}
        >
          <MapPin size={16} />
        </button>
        <div className="h-px bg-border mx-1" />
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
  disciplineGroups: DisciplineGroup[],
  compareMode: boolean,
  baseDrawingImage: string | null,
): string | null {
  if (!selection) return null;

  const selectedGroup = disciplineGroups.find((g) => g.discipline === selection.discipline);
  if (!selectedGroup || selectedGroup.layers.length === 0) return baseDrawingImage;

  if (compareMode) {
    // 비교 모드: 선택 공종의 첫 번째 레이어(최신 리비전)가 베이스
    return selectedGroup.layers[0].revision.image;
  }

  // 일반 모드: 선택된 리비전 이미지
  const selected = selectedGroup.layers.find(
    (l) => l.revision.version === selection.revisionVersion,
  );
  return selected?.revision.image ?? selectedGroup.layers[0]?.revision.image ?? baseDrawingImage;
}

// ── 이슈 핀 마커 ────────────────────────────────────────────────

function IssuePinMarker({ pin }: { pin: IssuePin }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ transform: 'translate(-50%, -100%)' }}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 아바타 원형 아이콘 */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer border-2 border-white transition-transform hover:scale-110 ${
          pin.status === 'open' ? 'bg-red-500' : 'bg-green-500'
        }`}
      >
        <User size={15} className="text-white" />
      </div>

      {/* 호버 툴팁 */}
      {hovered && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-xl px-3 py-2.5 w-52 shadow-xl"
          style={{ background: 'rgba(17,24,39,0.88)', backdropFilter: 'blur(6px)' }}
        >
          <p className="text-[11px] font-semibold text-white/50 mb-0.5">
            [Issue#{pin.issueNumber}]
          </p>
          <p className="text-xs text-white leading-snug">{pin.title}</p>
          <button className="mt-2 w-full bg-brand text-white text-xs rounded-lg px-2 py-1.5 font-medium hover:opacity-90 transition-opacity">
            이슈 보기
          </button>
        </div>
      )}
    </div>
  );
}

function getHueRotate(color: string): number {
  if (['#374151', '#6B7280', '#9CA3AF', '#D1D5DB'].includes(color)) return 0;   // 건축 grey
  if (['#B45309', '#D97706', '#FCD34D', '#FDE68A'].includes(color)) return 40;  // 구조 amber
  if (['#DC2626', '#EF4444', '#F87171', '#FCA5A5'].includes(color)) return 350; // 소방 red
  if (['#1E40AF', '#2563EB', '#60A5FA', '#93C5FD'].includes(color)) return 220; // 공조 blue
  if (['#059669', '#10B981', '#34D399', '#6EE7B7'].includes(color)) return 155; // 배관 green
  if (['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD'].includes(color)) return 270; // 설비 purple
  if (['#16A34A', '#22C55E', '#4ADE80', '#86EFAC'].includes(color)) return 120; // 조경 green2
  return 0;
}
