import React, { useState, useEffect } from 'react';
import { QueueProvider, useQueue } from './context/QueueContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { KioskView } from './components/KioskView';
import { StaffView } from './components/StaffView';
import { ManagerDashboard } from './components/ManagerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { DisplayView } from './components/DisplayView';
import { LoginPage } from './components/LoginPage';
import { Bell, CheckCircle2, AlertCircle, Info, Wifi, WifiOff } from 'lucide-react';

// 5 ta alohida Web interfeysi (Section 1) + Login
export const ROUTES = {
  LOGIN: '/login', // 1-chi kirish sahifasi (Boshlang'ich)
  KIOSK: '/kiosk', // Planshet (Mijozlar terminali)
  STAFF: '/staff', // Xodimlar / Operator ish stoli
  MANAGER: '/manager', // Menejer boshqaruv paneli
  ADMIN: '/admin', // Admin va Superadmin sozlamalari
  DISPLAY: '/display', // Televizor (Monitordagi elektron navbat)
};

function getViewFromLocation() {
  try {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    const hash = window.location.hash.toLowerCase().replace(/^[#/]+/, '');
    const params = new URLSearchParams(window.location.search);
    const viewQuery = params.get('view')?.toLowerCase();

    // 1. Televizor Tablo Monitori (/display) — televizorga ulash uchun mustaqil
    if (viewQuery && ['display', 'tv', 'tablo', 'monitor'].includes(viewQuery)) return 'display';
    if (hash && (hash.includes('display') || hash.includes('tablo') || hash.includes('monitor') || hash.includes('tv'))) return 'display';
    if (path.includes('display') || path.includes('tablo') || path.includes('tv')) return 'display';

    // 2. Planshet Kioski (/kiosk) — mijozlar terminali uchun mustaqil
    if (viewQuery && ['kiosk', 'mijoz', 'terminal', 'planshet'].includes(viewQuery)) return 'kiosk';
    if (hash && (hash.includes('kiosk') || hash.includes('mijoz') || hash.includes('planshet'))) return 'kiosk';
    if (path.includes('kiosk') || path.includes('planshet')) return 'kiosk';

    // 3. Tizimga kirgan foydalanuvchining roli bo'yicha ruxsatlarni tekshirish
    const userStr = localStorage.getItem('qms_user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (user) {
      // OPERATOR faqat operator sahifasini ko'ra oladi
      if (user.role === 'OPERATOR') {
        return 'staff';
      }
      // SUPERADMIN va MANAGER (Filial Menejeri / Admin) faqat admin va menejerni ko'ra oladi (Operator stoli ko'rinmaydi)
      if (user.role === 'SUPERADMIN' || user.role === 'MANAGER' || user.role === 'ADMIN') {
        if (path.includes('manager') || viewQuery === 'manager' || hash.includes('manager')) return 'manager';
        return 'admin';
      }
    }

    // Tizimga kirmagan bo'lsa, 1-chi bo'lib LOGIN sahifasiga yo'naltirish
    return 'login';
  } catch {
    return 'login';
  }
}

function MainApp() {
  const [currentView, setCurrentView] = useState(getViewFromLocation);
  const [globalToast, setGlobalToast] = useState(null);
  const { callNextCustomer, activeStaffId, staff, isBackendConnected } = useQueue();

  // Synchronize URL and history when view changes
  const navigateTo = (view) => {
    try {
      const userStr = localStorage.getItem('qms_user');
      const user = userStr ? JSON.parse(userStr) : null;

      // OPERATOR faqat staff ni ko'radi
      if (user?.role === 'OPERATOR' && view !== 'login' && view !== 'staff') {
        view = 'staff';
      }
      // SUPERADMIN va MANAGER faqat operator stoliga kira olmaydi (admin, manager, kiosk, display ga o'ta oladi)
      else if (
        (user?.role === 'SUPERADMIN' || user?.role === 'MANAGER' || user?.role === 'ADMIN') &&
        view === 'staff'
      ) {
        view = 'admin';
      }
    } catch {}

    setCurrentView(view);
    try {
      let targetPath = ROUTES.LOGIN;
      if (view === 'staff') targetPath = ROUTES.STAFF;
      else if (view === 'manager') targetPath = ROUTES.MANAGER;
      else if (view === 'admin') targetPath = ROUTES.ADMIN;
      else if (view === 'display') targetPath = ROUTES.DISPLAY;
      else if (view === 'kiosk') targetPath = ROUTES.KIOSK;
      else if (view === 'login') targetPath = ROUTES.LOGIN;

      window.history.pushState({}, '', targetPath);
    } catch {}
  };

  // Listen to browser Back/Forward navigation and Hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentView(getViewFromLocation());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Global F2 Hotkey: Qaysi sahifada bo'lishidan qat'i nazar keyingi mijozni chaqiradi
  useEffect(() => {
    let toastTimer = null;

    const handleGlobalKeyDown = async (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.target?.isContentEditable) return;

      if (e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();

        const userStr = localStorage.getItem('qms_user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user && user.role !== 'OPERATOR') {
          if (toastTimer) clearTimeout(toastTimer);
          setGlobalToast({
            type: 'warning',
            title: 'F2 — Ruxsat cheklangan',
            message: 'Mijozlarga faqat xizmat ko‘rsatuvchi operator xodim xizmat qila oladi. Admin va Superadmin mijoz chaqira olmaydi.',
          });
          toastTimer = setTimeout(() => setGlobalToast(null), 4000);
          return;
        }

        const operatorStaff = staff?.filter((s) => (s.role_id || s.roleId || s.role) === 'OPERATOR') || [];
        const currentStaffId =
          (user?.role === 'OPERATOR' && user?.id) ||
          (activeStaffId && operatorStaff.some((s) => s.id === activeStaffId) ? activeStaffId : null) ||
          operatorStaff[0]?.id ||
          'staff-1';

        const operator = operatorStaff.find((s) => s.id === currentStaffId) || operatorStaff[0];

        const res = await callNextCustomer(currentStaffId, true);

        if (toastTimer) clearTimeout(toastTimer);

        if (res?.success && res?.ticket) {
          setGlobalToast({
            type: 'success',
            title: res.turnSkipped
              ? 'F2 — Teng taqsimlash bo‘yicha chaqirildi'
              : 'F2 — Keyingi mijoz chaqirildi',
            ticketNumber: res.ticket.ticketNumber || res.ticket.ticket_number,
            windowNumber: res.ticket.windowNumber || res.ticket.window_number || operator?.windowNumber || '1',
            staffName: res.operator?.name || operator?.name || 'Operator',
            serviceName: res.ticket.serviceName || res.ticket.service_name || 'Xizmat',
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative">
      
      {/* Top Navigation Bar with View Switcher */}
      <Navbar currentView={currentView} setCurrentView={navigateTo} />

      {/* Backend PostgreSQL Connection Badge */}
      <div className="fixed bottom-3 right-3 z-50 pointer-events-none">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md border ${
            isBackendConnected
              ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
              : 'bg-amber-950 text-amber-200 border-amber-700'
          }`}
        >
          {isBackendConnected ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>PostgreSQL & Socket.IO: Faol</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>Lokal Rejim</span>
            </>
          )}
        </div>
      </div>

      {/* Global F2 HUD Notification Popup */}
      {globalToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 max-w-md w-[92vw] sm:w-full">
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

      {/* 5 ta interfeys + Login render qilinishi */}
      <main className="flex-1">
        <ErrorBoundary>
          {currentView === 'login' && <LoginPage onNavigate={navigateTo} />}
          {currentView === 'kiosk' && <KioskView />}
          {currentView === 'staff' && <StaffView />}
          {currentView === 'manager' && <ManagerDashboard />}
          {currentView === 'display' && <DisplayView />}
          {currentView === 'admin' && <AdminDashboard />}
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
