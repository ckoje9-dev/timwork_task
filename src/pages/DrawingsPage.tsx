import { useEffect, useRef, useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  UploadCloud,
  FolderDown,
  Trash2,
  Layers,
  Clock,
  FileStack,
} from 'lucide-react';
import { useDrawingStore, type LayerItem } from '@/store/drawing.store';
import type { DrawingSelection, DrawingTreeByDiscipline, DrawingTreeNode, Revision } from '@/types';
import { getImageUrl } from '@/api/drawings';
import DrawingTree from '@/components/drawings/DrawingTree';
import DrawingViewer from '@/components/drawings/DrawingViewer';
import CompareModal from '@/components/drawings/CompareModal';

export default function DrawingsPage() {
  const {
    loadTree, selection, compareMode, disciplineGroups, tree,
    setCompareMode, setRevisionVersion, expandDiscipline,
    issueVisible, setIssueVisible,
    deleteDrawing, addDrawingToTree, updateDrawingRevision,
  } = useDrawingStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('전체');
  const [uploadFiles, setUploadFiles] = useState<File[] | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const updateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (filterDiscipline !== '전체') {
      expandDiscipline(filterDiscipline);
    }
  }, [filterDiscipline, expandDiscipline]);

  const disciplines = ['전체', ...Object.keys(tree).filter((d) => d !== '전체')];

  // ── 핸들러 ──────────────────────────────────────────────────

  const handleUploadClick = () => uploadInputRef.current?.click();

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) setUploadFiles(files);
    e.target.value = '';
  };

  const handleDownload = () => {
    if (!selection) return;
    const group = disciplineGroups.find((g) => g.discipline === selection.discipline);
    const layer =
      group?.layers.find((l) => l.revision.version === selection.revisionVersion) ??
      group?.layers[0];
    if (!layer?.revision.image) return;
    const a = document.createElement('a');
    a.href = getImageUrl(layer.revision.image);
    a.download = `${selection.drawingId}_${layer.revision.version}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBulkDownload = async () => {
    setIsBulkDownloading(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const tasks: Promise<void>[] = [];
      for (const [disc, nodes] of Object.entries(tree)) {
        if (disc === '전체') continue;
        for (const node of nodes) {
          if (!node.latestRevision?.image) continue;
          const url = getImageUrl(node.latestRevision.image);
          const safeName = node.drawingName.replace(/[/\\:*?"<>|]/g, '_');
          const version = node.latestRevision.version;
          tasks.push(
            fetch(url)
              .then((r) => r.blob())
              .then((blob) => {
                // MIME 타입으로 확장자 결정 (blob URL 포함)
                const mime = blob.type || 'image/png';
                const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
                zip.file(`${disc}/${safeName}_${version}.${ext}`, blob);
              })
              .catch(() => {}),
          );
        }
      }
      await Promise.all(tasks);
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `도면_최신본_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const handleUpdateClick = () => {
    if (!selection) return;
    updateInputRef.current?.click();
  };

  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUpdateFile(file);
    e.target.value = '';
  };

  const confirmDelete = () => {
    if (selection) deleteDrawing(selection.drawingId, selection.discipline);
    setShowDeleteConfirm(false);
  };

  const selectedDrawingName =
    selection
      ? (tree[selection.discipline]?.find((n) => n.drawingId === selection.drawingId)?.drawingName ?? selection.drawingId)
      : '';

  const selectedRevisionCount =
    selection
      ? (tree[selection.discipline]?.find((n) => n.drawingId === selection.drawingId)?.revisionCount ?? 0)
      : 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── 좌측 패널: 도면 트리 ────────────────────── */}
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-white">
        {/* 아이콘 툴바 */}
        <div className="grid grid-cols-5 px-2 py-1.5 border-b border-border">
          <ToolbarButton icon={<Upload size={15} />} label="업로드" onClick={handleUploadClick} />
          <ToolbarButton icon={<Download size={15} />} label="다운로드" onClick={handleDownload} disabled={!selection} />
          <ToolbarButton
            icon={<FolderDown size={15} className={isBulkDownloading ? 'animate-pulse' : ''} />}
            label="전체다운"
            onClick={handleBulkDownload}
            disabled={isBulkDownloading}
          />
          <ToolbarButton
            icon={<UploadCloud size={15} />}
            label="업데이트"
            onClick={handleUpdateClick}
            disabled={!selection}
          />
          <ToolbarButton
            icon={<Trash2 size={15} />}
            label="삭제"
            danger
            onClick={() => setShowDeleteConfirm(true)}
            disabled={!selection}
          />
        </div>
        {/* 히든 파일 인풋: 업로드 (복수, 이미지만) */}
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUploadFileChange}
        />
        {/* 히든 파일 인풋: 업데이트 (단일, 이미지만) */}
        <input
          ref={updateInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpdateFileChange}
        />

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
            {/* 도면 비교 버튼 */}
            {selection && (
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors',
                  compareMode
                    ? 'bg-brand text-white border-brand'
                    : 'text-text-secondary border-border hover:text-text-primary hover:bg-surface-hover',
                ].join(' ')}
              >
                <Layers size={13} />
                {compareMode ? '비교 종료' : '비교'}
              </button>
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
        {!selection ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-surface/30">
            <FileStack size={56} className="text-text-muted opacity-20" />
            <div className="text-center">
              <p className="text-sm font-medium text-text-muted">도면을 선택하세요</p>
              <p className="text-xs text-text-muted/60 mt-1">
                좌측 트리에서 도면을 클릭하면 여기에 표시됩니다
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 relative min-w-0 overflow-hidden">
            <DrawingViewer />
            <CompareModal />
          </div>
        )}
      </div>

      {/* ── 업로드 모달 ──────────────────────────────── */}
      {uploadFiles && (
        <UploadModal
          files={uploadFiles}
          disciplines={disciplines.filter((d) => d !== '전체')}
          onClose={() => setUploadFiles(null)}
          onConfirm={(nodes) => {
            nodes.forEach(addDrawingToTree);
            setUploadFiles(null);
          }}
        />
      )}

      {/* ── 업데이트(새 리비전) 모달 ─────────────────── */}
      {updateFile && selection && (
        <UpdateRevisionModal
          file={updateFile}
          drawingName={selectedDrawingName}
          currentRevisionCount={selectedRevisionCount}
          onClose={() => setUpdateFile(null)}
          onConfirm={(revision) => {
            updateDrawingRevision(selection.drawingId, selection.discipline, revision);
            setUpdateFile(null);
          }}
        />
      )}

      {/* ── 삭제 확인 모달 ───────────────────────────── */}
      {showDeleteConfirm && selection && (
        <DeleteConfirmModal
          drawingName={selectedDrawingName}
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

// ── 업로드 모달 ───────────────────────────────────────────────

function UploadModal({
  files,
  disciplines,
  onClose,
  onConfirm,
}: {
  files: File[];
  disciplines: string[];
  onClose: () => void;
  onConfirm: (nodes: DrawingTreeNode[]) => void;
}) {
  const [names, setNames] = useState<string[]>(
    files.map((f) => f.name.replace(/\.[^.]+$/, '')),
  );
  const [discipline, setDiscipline] = useState(disciplines[0] ?? '');

  const handleConfirm = () => {
    if (!discipline) return;
    const today = new Date().toISOString().slice(0, 10);
    const nodes: DrawingTreeNode[] = files.map((file, i) => ({
      drawingId: `upload-${Date.now()}-${i}`,
      drawingName: (names[i] ?? file.name).trim() || file.name,
      discipline,
      latestRevision: {
        version: 'REV1',
        image: URL.createObjectURL(file),
        date: today,
        description: '신규 업로드',
        changes: [],
      },
      revisionCount: 1,
    }));
    onConfirm(nodes);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-[440px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          도면 업로드 ({files.length}개)
        </h2>

        {/* 파일별 도면명 입력 */}
        <div className="mb-4 max-h-60 overflow-y-auto space-y-2 pr-1">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 w-32 flex-shrink-0 px-2 py-1.5 bg-surface rounded border border-border">
                <Upload size={11} className="text-text-muted flex-shrink-0" />
                <span className="text-[10px] text-text-muted truncate">{file.name}</span>
              </div>
              <input
                type="text"
                value={names[i] ?? ''}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                placeholder="도면명"
                className="input flex-1 text-xs py-1.5"
                autoFocus={i === 0}
              />
            </div>
          ))}
        </div>

        {/* 공종 (공통) */}
        <div className="mb-6">
          <label className="text-xs text-text-muted block mb-1">공종 (전체 적용)</label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="select w-full text-sm"
          >
            {disciplines.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">취소</button>
          <button
            onClick={handleConfirm}
            disabled={!discipline}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            업로드
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 업데이트(새 리비전) 모달 ──────────────────────────────────

function UpdateRevisionModal({
  file,
  drawingName,
  currentRevisionCount,
  onClose,
  onConfirm,
}: {
  file: File;
  drawingName: string;
  currentRevisionCount: number;
  onClose: () => void;
  onConfirm: (revision: Revision) => void;
}) {
  const nextVersion = `REV${currentRevisionCount + 1}`;
  const [version, setVersion] = useState(nextVersion);
  const [description, setDescription] = useState('');

  const handleConfirm = () => {
    const revision: Revision = {
      version: version.trim() || nextVersion,
      image: URL.createObjectURL(file),
      date: new Date().toISOString().slice(0, 10),
      description: description.trim(),
      changes: [],
    };
    onConfirm(revision);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-96 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-text-primary mb-1">새 리비전 업데이트</h2>
        <p className="text-xs text-text-muted mb-4">{drawingName}</p>

        {/* 선택 파일 */}
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border">
          <UploadCloud size={13} className="text-text-muted flex-shrink-0" />
          <span className="text-xs text-text-secondary truncate">{file.name}</span>
        </div>

        {/* 리비전 버전명 */}
        <div className="mb-3">
          <label className="text-xs text-text-muted block mb-1">리비전 버전</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder={nextVersion}
            className="input w-full text-sm"
            autoFocus
          />
        </div>

        {/* 변경 설명 */}
        <div className="mb-6">
          <label className="text-xs text-text-muted block mb-1">변경 내용</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="변경 사항을 입력하세요"
            rows={3}
            className="input resize-none w-full text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">취소</button>
          <button onClick={handleConfirm} className="btn-primary">업데이트</button>
        </div>
      </div>
    </div>
  );
}

// ── 삭제 확인 모달 ────────────────────────────────────────────

function DeleteConfirmModal({
  drawingName,
  onConfirm,
  onClose,
}: {
  drawingName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-80 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-text-primary mb-2">도면 삭제</h2>
        <p className="text-sm text-text-secondary mb-1">
          <span className="font-medium text-text-primary">"{drawingName}"</span>을 삭제하시겠습니까?
        </p>
        <p className="text-xs text-text-muted mb-6">이 작업은 되돌릴 수 없습니다.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            삭제
          </button>
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
        'flex flex-col items-center justify-center gap-1 py-2 rounded text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
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
