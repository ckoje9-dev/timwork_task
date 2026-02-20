import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * 앱 전체 레이아웃
 *
 * ┌──────────────────────────────────────────────┐
 * │  Sidebar (240px)  │  Header (64px)           │
 * │                   ├──────────────────────────┤
 * │                   │  Main Content (Outlet)   │
 * │                   │  bg-surface overflow-auto│
 * └───────────────────┴──────────────────────────┘
 */
export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* 고정 사이드바 */}
      <Sidebar />

      {/* 우측 영역: 헤더 + 콘텐츠 */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
