import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import LoginPage from './pages/Login';
import WorklistPage from './pages/Worklist';
import DashboardPage from './pages/Dashboard';
import StudyDetailPage from './pages/StudyDetail';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/"                 element={<WorklistPage />} />
          <Route path="/dashboard"        element={<DashboardPage />} />
          <Route path="/study/:studyUid"  element={<StudyDetailPage />} />
          <Route path="*"                 element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
