import React, { useState, useEffect } from 'react';
import { QueueProvider, useQueue } from './context/QueueContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { KioskView } from './components/KioskView';
import { StaffView } from './components/StaffView';
import { ManagerDashboard } from './components/ManagerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { DisplayView } from './components/DisplayView';
import { Bell, CheckCircle2, AlertCircle, Info } from 'lucide-react';

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
  const [globalToast, setGlobalToast] = useState(null);
  const { callNextCustomer, activeStaffId, staff } = useQueue();

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

  // Global F2 Hotkey: Qaysi sahifada bo'lishidan qat'i nazar keyingi mijozni chaqiradi
  useEffect(() => {
    let toastTimer = null;

    const handleGlobalKeyDown = (e) => {
      // Input yoki textarea ichida yozayotgan bo'lsa xalaqit bermaslik
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.target?.isContentEditable) return;

      if (e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();

        const currentStaffId = activeStaffId || staff?.[0]?.id || 'staff-1';
        const operator = staff?.find((s) => s.id === currentStaffId) || staff?.[0];

        // autoAdvance=true: agar oldingi mijoz bo'lsa yakunlaydi, pauzada bo'lsa faollashtiradi va keyingisini chaqiradi
        const res = callNextCustomer(currentStaffId, true);

        if (toastTimer) clearTimeout(toastTimer);

        if (res?.success && res?.ticket) {
          setGlobalToast({
            type: 'success',
            title: 'F2 — Keyingi mijoz chaqirildi',
            ticketNumber: res.ticket.ticketNumber,
            windowNumber: res.ticket.windowNumber || operator?.windowNumber || '1',
            staffName: operator?.name || 'Operator',
            serviceName: res.ticket.serviceName,
            previousCompleted: res.previousCompleted,
          });
        } else if (res?.empty) {
          setGlobalToast({
            type: 'info',
            title: 'F2 — Navbatlar yo‘q',
            message: res.message || 'Kutayotgan mijozlar mavjud emas.',
            previousCompleted: res.previousCompleted,
          });
        } else if (res?.error) {
          setGlobalToast({
            type: 'warning',
            title: 'F2 — Xabarnoma',
            message: res.error,
          });
        }

        toastTimer = setTimeout(() => {
          setGlobalToast(null);
        }, 4500);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, [activeStaffId, staff, callNextCustomer]);

  const isCustomerPage = currentView === 'kiosk';
  const isDisplayPage = currentView === 'display';

  return (
    <div className="min-h-screen bg-[#0b1329] text-slate-100 flex flex-col font-sans relative">
      {/* Global F2 HUD Notification Popup */}
      {globalToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 max-w-md w-[92vw] sm:w-full">
          <div
            className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3.5 ${
              globalToast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/60 shadow-emerald-500/20 text-white'
                : globalToast.type === 'info'
                ? 'bg-slate-900/95 border-blue-500/60 shadow-blue-500/20 text-white'
                : 'bg-slate-900/95 border-amber-500/60 shadow-amber-500/20 text-white'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                globalToast.type === 'success'
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                  : globalToast.type === 'info'
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white'
                  : 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white'
              }`}
            >
              <span className="font-mono font-black text-sm">F2</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-black tracking-wider uppercase text-slate-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  {globalToast.title}
                </h4>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0">
                  Global Hotkey
                </span>
              </div>

              {globalToast.ticketNumber ? (
                <div className="mt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-400 tracking-tight">
                      {globalToast.ticketNumber}
                    </span>
                    <span className="text-sm font-extrabold text-slate-200">
                      ➔ {globalToast.windowNumber}-Oyna
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate font-medium">
                    {globalToast.serviceName} • {globalToast.staffName}
                  </p>
                  {globalToast.previousCompleted && (
                    <p className="text-[11px] text-emerald-400/90 mt-1 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Avvalgi {globalToast.previousCompleted} yakunlandi
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-200 mt-1">
                  {globalToast.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
