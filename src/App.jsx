import React, { useState, useEffect } from 'react';
import { QueueProvider } from './context/QueueContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { KioskView } from './components/KioskView';
import { StaffView } from './components/StaffView';
import { ManagerDashboard } from './components/ManagerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { DisplayView } from './components/DisplayView';

function MainApp() {
  // Support URL query param ?view=kiosk | staff | manager | admin | display
  const [currentView, setCurrentView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      let v = params.get('view');
      if (v) {
        v = v.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (['kiosk', 'staff', 'manager', 'admin', 'display'].includes(v)) {
          return v;
        }
      }
    } catch {}
    return 'kiosk';
  });

  // Keep URL in sync with current view
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', currentView);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [currentView]);

  return (
    <div className="min-h-screen bg-[#0b1329] text-slate-100 flex flex-col font-sans">
      {/* Navbar is always available at top */}
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="flex-1 pb-10">
        <ErrorBoundary>
          {currentView === 'kiosk' && <KioskView />}
          {currentView === 'staff' && <StaffView />}
          {currentView === 'manager' && <ManagerDashboard />}
          {currentView === 'admin' && <SuperAdminDashboard />}
          {currentView === 'display' && <DisplayView onNavigate={setCurrentView} />}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueueProvider>
        <MainApp />
      </QueueProvider>
    </ErrorBoundary>
  );
}
