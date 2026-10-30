import React, { useState, useEffect } from 'react';
import { QueueProvider } from './context/QueueContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { KioskView } from './components/KioskView';
import { StaffView } from './components/StaffView';
import { ManagerDashboard } from './components/ManagerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { DisplayView } from './components/DisplayView';

// Dedicated URL Routes (Mijozlar sahifasi va xodimlar sahifasi alohida URLlarda)
export const ROUTES = {
  KIOSK: '/', // Mijozlar terminali (Kiosk)
  STAFF: '/staff-portal-auth-88', // Xodimlar / Operator ish stoli
  MANAGER: '/manager-analytics-77', // Menejer tahlili
  ADMIN: '/admin-control-secure', // Super Admin
  DISPLAY: '/display', // Katta Tablo (TV ekran)
};

function getViewFromLocation() {
  try {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    const params = new URLSearchParams(window.location.search);
    const viewQuery = params.get('view')?.toLowerCase();

    // Check query params
    if (viewQuery) {
      if (['staff', 'staff-portal-auth-88', 'operator'].includes(viewQuery)) return 'staff';
      if (['manager', 'manager-analytics-77'].includes(viewQuery)) return 'manager';
      if (['admin', 'admin-control-secure', 'superadmin'].includes(viewQuery)) return 'admin';
      if (['display', 'tv', 'tablo'].includes(viewQuery)) return 'display';
      if (['kiosk', 'mijoz', 'client'].includes(viewQuery)) return 'kiosk';
    }

    // Check URL pathnames
    if (path.includes('staff-portal-auth-88') || path === '/staff') return 'staff';
    if (path.includes('manager-analytics-77') || path === '/manager') return 'manager';
    if (path.includes('admin-control-secure') || path === '/admin') return 'admin';
    if (path === '/display' || path === '/tablo' || path === '/tv') return 'display';

    // Default root is customer kiosk
    return 'kiosk';
  } catch {
    return 'kiosk';
  }
}

function MainApp() {
  const [currentView, setCurrentView] = useState(getViewFromLocation);

  // Synchronize URL and history when view changes
  const navigateTo = (view) => {
    setCurrentView(view);
    try {
      let targetPath = ROUTES.KIOSK;
      if (view === 'staff') targetPath = ROUTES.STAFF;
      else if (view === 'manager') targetPath = ROUTES.MANAGER;
      else if (view === 'admin') targetPath = ROUTES.ADMIN;
      else if (view === 'display') targetPath = ROUTES.DISPLAY;

      window.history.pushState({}, '', targetPath);
    } catch {}
  };

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getViewFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isCustomerPage = currentView === 'kiosk';
  const isDisplayPage = currentView === 'display';

  return (
    <div className="min-h-screen bg-[#0b1329] text-slate-100 flex flex-col font-sans">
      {/* Navbar is strictly HIDDEN on Customer Kiosk and TV Display pages */}
      {!isCustomerPage && !isDisplayPage && (
        <Navbar currentView={currentView} setCurrentView={navigateTo} />
      )}

      <main className="flex-1">
        <ErrorBoundary>
          {currentView === 'kiosk' && (
            <KioskView onNavigateStaff={() => navigateTo('staff')} />
          )}
          {currentView === 'staff' && (
            <StaffView onNavigateHome={() => navigateTo('kiosk')} />
          )}
          {currentView === 'manager' && <ManagerDashboard />}
          {currentView === 'admin' && <SuperAdminDashboard />}
          {currentView === 'display' && <DisplayView onNavigate={navigateTo} />}
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
