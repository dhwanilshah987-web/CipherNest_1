import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { VaultProvider } from './context/VaultContext';
import { Shell } from './components/layout/Shell';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { BlockExplorerPage } from './pages/BlockExplorerPage';
import { CloudObjectsPage } from './pages/CloudObjectsPage';
import { DownloadVerifyPage } from './pages/DownloadVerifyPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <VaultProvider>
          <Routes>
            <Route path="/" element={<Shell />}>
              <Route index element={<DashboardPage />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="blocks" element={<BlockExplorerPage />} />
              <Route path="objects" element={<CloudObjectsPage />} />
              <Route path="verify" element={<DownloadVerifyPage />} />
              <Route path="activity" element={<ActivityLogPage />} />
              <Route path="docs" element={<DocumentationPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </VaultProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
