import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileStack,
  AlertCircle,
  Image,
  Users,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { path: '/drawings', label: '도면', icon: FileStack },
  { path: '/issues', label: '이슈', icon: AlertCircle },
  { path: '/photos', label: '사진대지', icon: Image, disabled: true },
  { path: '/members', label: '멤버', icon: Users, disabled: true },
  { path: '/security', label: '보안', icon: ShieldCheck, disabled: true },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-sidebar flex-shrink-0 h-full bg-sidebar-bg border-r border-border flex flex-col">
      {/* 로고 */}
      <div className="h-header flex items-center px-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-brand flex items-center justify-center">
            <span className="text-white text-xs font-bold">TW</span>
          </div>
          <span className="font-bold text-text-primary text-base tracking-tight">
            timwork
          </span>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ path, label, icon: Icon, disabled }) => {
            const isActive = location.pathname.startsWith(path);

            if (disabled) {
              return (
                <li key={path}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-text-muted cursor-not-allowed select-none">
                    <Icon size={18} />
                    <span>{label}</span>
                  </div>
                </li>
              );
            }

            return (
              <li key={path}>
                <NavLink
                  to={path}
                  className={() =>
                    [
                      'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors duration-150',
                      isActive
                        ? 'bg-sidebar-active text-sidebar-active-text font-medium'
                        : 'text-sidebar-text hover:bg-surface-hover',
                    ].join(' ')
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 하단 버전 표시 */}
      <div className="px-5 py-3 border-t border-border">
        <p className="text-xs text-text-muted">v0.1.0</p>
      </div>
    </aside>
  );
}
