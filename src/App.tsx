import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import DrawingsPage from '@/pages/DrawingsPage';
import IssuesPage from '@/pages/IssuesPage';
import PlaceholderPage from '@/pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="drawings" element={<DrawingsPage />} />
          <Route path="issues" element={<IssuesPage />} />
          <Route path="photos" element={<PlaceholderPage title="사진대지" />} />
          <Route path="members" element={<PlaceholderPage title="멤버" />} />
          <Route path="security" element={<PlaceholderPage title="보안" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
