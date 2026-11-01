import React, { useState, useEffect } from 'react';
import { QueueProvider, useQueue } from './context/QueueContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { KioskView } from './components/KioskView';
import { StaffView } from './components/StaffView';
import { AdminDashboard } from './components/AdminDashboard';
import { DisplayView } from './components/DisplayView';
import { Bell, CheckCircle2, AlertCircle, Info } from 'lucide-react';

// 4 ta alohida Page yo'llari (Talab 1)
export const ROUTES = {
  KIOSK: '/', // 1. Mijozlar terminali (Kiosk)
  STAFF: '/staff', // 2. Xodimlar / Operator ish stoli
  DISPLAY: '/display', // 3. Monitordagi elektron navbat (Katta Tablo)
  ADMIN: '/admin', // 4. Admin va samaradorlik
};

function getViewFromLocation() {
  try {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    const params = new URLSearchParams(window.location.search);
    const viewQuery = params.get('view')?.toLowerCase();

    // Check query params
    if (viewQuery) {
      if (['staff', 'staff-portal-auth-88', 'operator'].includes(viewQuery)) return 'staff';
      if (['admin', 'admin-control-secure', 'superadmin', 'manager'].includes(viewQuery)) return 'admin';
      if (['display', 'tv', 'tablo', 'monitor'].includes(viewQuery)) return 'display';
      if (['kiosk', 'mijoz', 'client'].includes(viewQuery)) return 'kiosk';
    }

    // Check URL pathnames
    if (path.includes('staff') || path.includes('operator')) return 'staff';
    if (path.includes('display') || path.includes('tablo') || path.includes('monitor') || path.includes('tv')) return 'display';
    if (path.includes('admin') || path.includes('manager')) return 'admin';

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

        // autoAdvance=true: avtomatik teng taqsimlash qoidasi bo'yicha keyingisini chaqiradi
        const res = callNextCustomer(currentStaffId, true);

        if (toastTimer) clearTimeout(toastTimer);

        if (res?.success && res?.ticket) {
          setGlobalToast({
            type: 'success',
            title: res.turnSkipped
              ? 'F2 — Teng taqsimlash bo‘yicha chaqirildi'
              : 'F2 — Keyingi mijoz chaqirildi',
            ticketNumber: res.ticket.ticketNumber,
            windowNumber: res.ticket.windowNumber || operator?.windowNumber || '1',
            staffName: res.operator?.name || operator?.name || 'Operator',
            serviceName: res.ticket.serviceName,
            previousCompleted: res.previousCompleted,
            message: res.message,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative">
      
      {/* Global F2 HUD Notification Popup - Oq va To'q Yashil */}
      {globalToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 max-w-md w-[92vw] sm:w-full">
          <div
            className={`p-4 rounded-3xl shadow-2xl backdrop-blur-xl border-2 flex items-start gap-3.5 bg-white ${
              globalToast.type === 'success'
                ? 'border-emerald-700 shadow-emerald-950/20 text-slate-900'
                : globalToast.type === 'info'
                ? 'border-emerald-600 shadow-emerald-950/20 text-slate-900'
                : 'border-amber-600 shadow-amber-950/20 text-slate-900'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                globalToast.type === 'success'
                  ? 'bg-gradient-to-tr from-emerald-900 to-emerald-700 text-white'
                  : globalToast.type === 'info'
                  ? 'bg-gradient-to-tr from-emerald-800 to-teal-700 text-white'
                  : 'bg-gradient-to-tr from-amber-700 to-orange-600 text-white'
              }`}
            >
              <span className="font-mono font-black text-sm">F2</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-black tracking-wider uppercase text-emerald-950 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  {globalToast.title}
                </h4>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                  Global Hotkey
                </span>
              </div>

              {globalToast.ticketNumber ? (
                <div className="mt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-900 tracking-tight">
                      {globalToast.ticketNumber}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-800">
                      ➔ {globalToast.windowNumber}-Oyna
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate font-semibold">
                    {globalToast.serviceName} • {globalToast.staffName}
                  </p>
                  {globalToast.message && (
                    <p className="text-[11px] text-emerald-800 mt-1 font-bold">
                      {globalToast.message}
                    </p>
                  )}
                  {globalToast.previousCompleted && (
                    <p className="text-[11px] text-emerald-700 mt-0.5 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Avvalgi {globalToast.previousCompleted} yakunlandi
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  {globalToast.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sahifalar mustaqil: Header tiqilishi butunlay olib tashlandi (Talab 1 & 7) */}
      <main className="flex-1">
        <ErrorBoundary>
          {currentView === 'kiosk' && (
            <KioskView />
          )}
          {currentView === 'staff' && (
            <StaffView onNavigateHome={() => navigateTo('kiosk')} />
          )}
          {currentView === 'display' && <DisplayView onNavigate={navigateTo} />}
          {currentView === 'admin' && <AdminDashboard />}
        </ErrorBoundary>
      </main>

      {/* Discrete Floating Page Navigator (Header tiqilib ketmasligi uchun pastki burchakda ixcham tugma) */}
      <div className="fixed bottom-3 right-3 z-50">
        <details className="group relative">
          <summary className="list-none flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-[11px] font-bold rounded-full shadow-lg backdrop-blur-md border border-emerald-700/60 cursor-pointer transition-all">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sahifa: {currentView === 'kiosk' ? 'Mijoz Kioski' : currentView === 'staff' ? 'Xodim (Operator)' : currentView === 'display' ? 'Elektron Tablo' : 'Admin'}</span>
          </summary>
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border-2 border-emerald-800 rounded-2xl shadow-2xl p-1.5 space-y-1 text-xs">
            <button
              onClick={() => navigateTo('kiosk')}
              className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                currentView === 'kiosk' ? 'bg-emerald-800 text-white' : 'text-slate-800 hover:bg-emerald-50'
              }`}
            >
              1. Mijoz Kioski (/)
            </button>
            <button
              onClick={() => navigateTo('staff')}
              className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                currentView === 'staff' ? 'bg-emerald-800 text-white' : 'text-slate-800 hover:bg-emerald-50'
              }`}
            >
              2. Xodim Portali (/staff)
            </button>
            <button
              onClick={() => navigateTo('display')}
              className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                currentView === 'display' ? 'bg-emerald-800 text-white' : 'text-slate-800 hover:bg-emerald-50'
              }`}
            >
              3. Elektron Tablo (/display)
            </button>
            <button
              onClick={() => navigateTo('admin')}
              className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                currentView === 'admin' ? 'bg-emerald-800 text-white' : 'text-slate-800 hover:bg-emerald-50'
              }`}
            >
              4. Admin Boshqaruv (/admin)
            </button>
          </div>
        </details>
      </div>
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
