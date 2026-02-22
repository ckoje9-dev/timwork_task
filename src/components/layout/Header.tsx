import { ChevronDown, Bell, User } from 'lucide-react';
import { useDrawingStore } from '@/store/drawing.store';

export default function Header() {
  const projectName = useDrawingStore((s) => s.projectName);
  return (
    <header className="h-header flex-shrink-0 bg-white border-b border-border flex items-center justify-between px-5 z-10">
      {/* 프로젝트 선택 */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-brand" />
        <button className="flex items-center gap-1.5 text-text-primary font-medium hover:text-brand transition-colors">
          <span className="text-sm">{projectName || 'Demo Project'}</span>
          <ChevronDown size={15} className="text-text-muted" />
        </button>
      </div>

      {/* 우측 액션 */}
      <div className="flex items-center gap-2">
        {/* 알림 */}
        <button className="btn-icon relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-status-urgent rounded-full" />
        </button>

        {/* 사용자 */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-hover transition-colors">
          <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white">
            <User size={15} />
          </div>
          <span className="text-sm text-text-primary font-medium">양승호</span>
          <ChevronDown size={14} className="text-text-muted" />
        </button>
      </div>
    </header>
  );
}
