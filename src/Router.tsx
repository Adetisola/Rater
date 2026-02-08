// Router - Main routing configuration
// "/" → Landing Page
// "/app" → Rater Web App

import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingLayout } from './layouts/LandingLayout';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/landing/LandingPage';
import App from './App';

export function Router() {
  return (
    <Routes>
      {/* Landing Page Route */}
      <Route
        path="/"
        element={
          <LandingLayout>
            <LandingPage />
          </LandingLayout>
        }
      />

      {/* App Route */}
      <Route
        path="/app"
        element={
          <AppLayout>
            <App />
          </AppLayout>
        }
      />

      {/* Catch-all redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
