import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { STAFF_STATUS, TICKET_STATUS, TICKET_PRIORITY } from '../constants/initialData';
import {
  Play,
  Volume2,
  Check,
  Share2,
  UserX,
  Coffee,
  Clock,
  Layers,
  History,
  Settings,
  BarChart2,
  LogOut,
  User,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  ShieldAlert,
  X,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export function StaffView({ onNavigateHome }) {
  const {
    staff,
    activeStaffId,
    setActiveStaffId,
    tickets,
    services,
    branches,
    callNextCustomer,
    recallCustomer,
    startService,
    completeService,
    markNoShow,
    transferTicket,
    updateStaffStatus,
    operatorAlerts,
    sendOperatorAlert,
    submitStaffRequest,
  } = useQueue();

  // Talab 7: Xodim avtorizatsiyasi (Kirish va Ro'yxatdan o'tish arizasi)
  const [loggedInStaffId, setLoggedInStaffId] = useState(() => {
    try {
      const saved = localStorage.getItem('qms_staff_auth_id');
      if (saved && staff.some((s) => s.id === saved)) return saved;
      return null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regWindow, setRegWindow] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'history' | 'settings' | 'analytics'
  const [notification, setNotification] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferService, setSelectedTransferService] = useState('');
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakReason, setBreakReason] = useState('Tushlik tanaffusi');
  const [chatInput, setChatInput] = useState('');
  const [queueExpanded, setQueueExpanded] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Settings state
  const [autoCallNext, setAutoCallNext] = useState(false);
  const [soundVolume, setSoundVolume] = useState(80);
  const [enableHotkeys, setEnableHotkeys] = useState(true);

  // Sync activeStaffId with logged in staff
  useEffect(() => {
    if (loggedInStaffId && staff.some((s) => s.id === loggedInStaffId)) {
      setActiveStaffId(loggedInStaffId);
    }
  }, [loggedInStaffId, staff, setActiveStaffId]);

  const currentStaff = staff.find((s) => s.id === (loggedInStaffId || activeStaffId)) || staff[0];
  const currentBranch = branches.find((b) => b.id === currentStaff?.branchId) || branches[0];

  // Login handler
  const handleStaffLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const matched = staff.find(
      (s) =>
        (s.name.toLowerCase() === loginIdentifier.trim().toLowerCase() ||
          s.login.toLowerCase() === loginIdentifier.trim().toLowerCase()) &&
        (s.password === loginPassword.trim() || loginPassword.trim() === '123')
    );

    if (matched) {
      setLoggedInStaffId(matched.id);
      setActiveStaffId(matched.id);
      try {
        localStorage.setItem('qms_staff_auth_id', matched.id);
      } catch {}
      setAuthSuccess(`Xush kelibsiz, ${matched.name}!`);
    } else {
      setAuthError('F.I.Sh/Login yoki parol noto‘g‘ri! (Standart parol: 123)');
    }
  };

  // Register request submit handler (Talab 7: Adminga so'rov boradi)
  const handleRegisterRequest = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!regName.trim()) {
      setAuthError('Iltimos, ism va familiyangizni kiriting!');
      return;
    }
    if (!regPassword.trim()) {
      setAuthError('Iltimos, parol o‘ylab toping!');
      return;
    }

    const res = submitStaffRequest({
      name: regName.trim(),
      windowNumber: regWindow.trim() || `${staff.length + 1}`,
      phone: regPhone.trim(),
      password: regPassword.trim(),
    });

    if (res.success) {
      setAuthSuccess(
        'Arizangiz Adminga muvaffaqiyatli yuborildi! Admin arizani tasdiqlagach, parolingiz orqali tizimga kira olasiz.'
      );
      setRegName('');
      setRegWindow('');
      setRegPhone('');
      setRegPassword('');
      setTimeout(() => setAuthMode('login'), 3500);
    } else {
      setAuthError(res.error || 'Xatolik yuz berdi');
    }
  };

  // Staff logout
  const handleStaffLogout = () => {
    setLoggedInStaffId(null);
    try {
      localStorage.removeItem('qms_staff_auth_id');
    } catch {}
    setAuthSuccess('Tizimdan chiqildi.');
  };

  // Active ticket assigned to this staff
  const activeTicket = tickets.find(
    (t) =>
      t.id === currentStaff?.currentTicketId ||
      (t.staffId === currentStaff?.id && (t.status === TICKET_STATUS.CALLED || t.status === TICKET_STATUS.IN_SERVICE))
  );

  const activeTicketService = services.find((s) => s.id === activeTicket?.serviceId);

  // Live timer for IN_SERVICE
  useEffect(() => {
    let interval = null;
    if (activeTicket && activeTicket.status === TICKET_STATUS.IN_SERVICE && activeTicket.startedAt) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeTicket.startedAt) / 1000);
        setTimerSeconds(elapsed);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeTicket]);

  // Keyboard Shortcuts (F2: Keyingi mijoz, F3: Qayta chaqirish, F4: Xizmat, F7: Yo'naltirish, F8: Kelmadi, F9: Tanaffus)
  useEffect(() => {
    if (!enableHotkeys) return;

    const handleKeyDown = (e) => {
      // Don't trigger hotkeys if typing inside an input, textarea or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      const key = e.key;

      // Space: Tezkor mijoz chaqirish (F2 butun ilova bo‘ylab global boshqariladi)
      if (key === ' ' && !activeTicket && currentStaff.status === STAFF_STATUS.AVAILABLE) {
        e.preventDefault();
        handleNextCustomer(true);
      }
      // F3 / r / R: Qayta chaqirish
      else if (key === 'F3' || key === 'r' || key === 'R') {
        if (activeTicket) {
          e.preventDefault();
          recallCustomer(activeTicket.id);
          setNotification({
            type: 'info',
            text: `[F3] ${activeTicket.ticketNumber} navbati qayta chaqirildi`,
          });
          setTimeout(() => setNotification(null), 3000);
        }
      }
      // F4 / Enter: Xizmatni boshlash yoki yakunlash
      else if (key === 'F4' || key === 'Enter') {
        if (activeTicket) {
          e.preventDefault();
          if (activeTicket.status === TICKET_STATUS.CALLED) {
            startService(activeTicket.id);
            setNotification({
              type: 'info',
              text: `[F4] ${activeTicket.ticketNumber} bilan xizmat boshlandi`,
            });
          } else {
            completeService(activeTicket.id);
            setNotification({
              type: 'success',
              text: `[F4] ${activeTicket.ticketNumber} xizmati muvaffaqiyatli yakunlandi!`,
            });
          }
          setTimeout(() => setNotification(null), 3000);
        }
      }
      // F7 / t / T: Yuborish / Yo'naltirish
      else if (key === 'F7' || key === 't' || key === 'T') {
        if (activeTicket) {
          e.preventDefault();
          setShowTransferModal(true);
        }
      }
      // F8: Kelmadi (No-Show)
      else if (key === 'F8') {
        if (activeTicket) {
          e.preventDefault();
          handleMarkNoShow();
        }
      }
      // F9 / b / B: Tanaffus
      else if (key === 'F9' || key === 'b' || key === 'B') {
        e.preventDefault();
        handleToggleBreak();
      }
      // Escape: Modallarni yopish
      else if (key === 'Escape') {
        setShowBreakModal(false);
        setShowTransferModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableHotkeys, currentStaff, activeTicket]);

  // FIFO Waiting list for staff's skills
  const staffWaitingQueue = tickets
    .filter(
      (t) =>
        t.status === TICKET_STATUS.WAITING &&
        t.branchId === currentStaff?.branchId &&
        currentStaff?.authorizedServiceIds.includes(t.serviceId)
    )
    .sort((a, b) => {
      if (a.priority === TICKET_PRIORITY.VIP && b.priority !== TICKET_PRIORITY.VIP) return -1;
      if (b.priority === TICKET_PRIORITY.VIP && a.priority !== TICKET_PRIORITY.VIP) return 1;
      return a.createdAt - b.createdAt;
    });

  // Today's history for this operator
  const operatorHistory = tickets.filter(
    (t) =>
      t.staffId === currentStaff.id &&
      (t.status === TICKET_STATUS.COMPLETED || t.status === TICKET_STATUS.NO_SHOW)
  );

  const handleNextCustomer = (force = false) => {
    setNotification(null);
    const result = callNextCustomer(currentStaff.id, force);
    if (!result.success) {
      setNotification({
        type: 'warning',
        text: result.error || result.message || 'Mijoz chaqirish imkonsiz',
      });
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({
        type: 'success',
        text: result.ticket
          ? `Mijoz ${result.ticket.ticketNumber} navbati qabul qilindi va ekranga chaqirildi!`
          : result.message,
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleMarkNoShow = () => {
    if (!activeTicket) return;
    const res = markNoShow(activeTicket.id);
    if (res?.isUnderSupervision) {
      setNotification({
        type: 'danger',
        text: 'DIQQAT: Siz 3 tadan ko‘p mijozni "Kelmadi" deb belgiladingiz. Tizim sizni nazoratga oldi!',
      });
    } else {
      setNotification({
        type: 'info',
        text: `Mijoz ${activeTicket.ticketNumber} kelmadi deb qayd etildi.`,
      });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const handleToggleBreak = () => {
    if (currentStaff.status === STAFF_STATUS.PAUSED) {
      updateStaffStatus(currentStaff.id, STAFF_STATUS.AVAILABLE);
    } else {
      setShowBreakModal(true);
    }
  };

  const confirmBreak = () => {
    updateStaffStatus(currentStaff.id, STAFF_STATUS.PAUSED, breakReason);
    setShowBreakModal(false);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendOperatorAlert(chatInput.trim());
    setChatInput('');
  };

  // Agar xodim tizimga kirmagan bo'lsa, Kirish va Ro'yxatdan o'tish arizasi oynasini ko'rsatish (Talab 7)
  if (!loggedInStaffId) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-emerald-800 p-6 sm:p-8 relative">
          
          {/* Logo Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-900 to-emerald-700 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-900/30">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-emerald-950 tracking-tight">
              Xodimlar (Operator) Portali
            </h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Faqat bank xodimlari va operatorlar uchun yopiq tizim
            </p>
          </div>

          {/* Toggle Login / Register */}
          <div className="flex bg-emerald-50 p-1 rounded-2xl border border-emerald-200 mb-5">
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-emerald-900 hover:text-emerald-950'
              }`}
            >
              1. Tizimga Kirish
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-emerald-900 hover:text-emerald-950'
              }`}
            >
              2. Yangi Ro‘yxatdan O‘tish
            </button>
          </div>

          {/* Alerts */}
          {authError && (
            <div className="p-3 mb-4 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-bold">
              {authError}
            </div>
          )}
          {authSuccess && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Xodim Ismi yoki Logini:
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Masalan: Sanjarbek Aliyev yoki OP-101"
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-xs font-semibold bg-emerald-50/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Parol:
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Standart parol: 123"
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-xs font-semibold bg-emerald-50/40"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Sinov uchun standart parol: <strong>123</strong>
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Hisobga Kirish
              </button>
            </form>
          ) : (
            /* REGISTER REQUEST FORM (Talab 7: Adminga yuboriladi) */
            <form onSubmit={handleRegisterRequest} className="space-y-3.5">
              <p className="text-[11px] text-slate-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                ⚠️ Yangi xodim bo‘lib ro‘yxatdan o‘tsangiz, so‘rovingiz Adminga yuboriladi. Admin qabul qilgach, tizimga kira olasiz.
              </p>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  F.I.Sh (To‘liq ismingiz):
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Masalan: Dilshod Rahimov"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 text-xs font-semibold bg-emerald-50/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Oyna Raqami:
                  </label>
                  <input
                    type="text"
                    value={regWindow}
                    onChange={(e) => setRegWindow(e.target.value)}
                    placeholder="Masalan: 6"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 text-xs font-semibold bg-emerald-50/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Telefon:
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+998 90..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 text-xs font-semibold bg-emerald-50/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Parol O‘ylab Toping:
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Kelgusida kirish uchun parol"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 text-xs font-semibold bg-emerald-50/40"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Adminga Ariza Yuborish
              </button>
            </form>
          )}

          {/* Quick Staff Demo Pick */}
          <div className="mt-5 pt-3 border-t border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 font-semibold">
              Tezkor mavjud xodimlar:
            </span>
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {staff.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setLoginIdentifier(s.name);
                    setLoginPassword(s.password || '123');
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 cursor-pointer"
                >
                  {s.name} ({s.windowNumber}-oyna)
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 text-slate-900 flex font-sans">
      
      {/* Left Icon Rail - To'q Yashil */}
      <aside className="w-16 bg-emerald-950 border-r border-emerald-800 flex flex-col items-center justify-between py-5 flex-shrink-0 z-20 shadow-xl">
        <div className="space-y-6 flex flex-col items-center">
          {/* Brand/Logo Top Icon */}
          <button
            onClick={() => setActiveTab('workspace')}
            title="Bosh sahifa / Ish stoli"
            className="w-10 h-10 rounded-xl bg-white text-emerald-950 flex items-center justify-center font-black shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            <Layers className="w-5 h-5 text-emerald-900" />
          </button>

          <div className="space-y-4">
            {/* Workspace Button */}
            <button
              onClick={() => setActiveTab('workspace')}
              title="Ish stoli (Workspace)"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-400'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900'
              }`}
            >
              <Layers className="w-5 h-5" />
            </button>

            {/* History Button (Clock) */}
            <button
              onClick={() => setActiveTab('history')}
              title="Qabul tarixi (History)"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-400'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900'
              }`}
            >
              <History className="w-5 h-5" />
            </button>

            {/* Settings Button (Gear) */}
            <button
              onClick={() => setActiveTab('settings')}
              title="Sozlamalar (Settings)"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-400'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Analytics Button (BarChart) */}
            <button
              onClick={() => setActiveTab('analytics')}
              title="Shaxsiy Analitika (Analytics)"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-400'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900'
              }`}
            >
              <BarChart2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Mini Profile Avatar at bottom */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => {
              const newSt = currentStaff.status === STAFF_STATUS.OFFLINE ? STAFF_STATUS.AVAILABLE : STAFF_STATUS.OFFLINE;
              updateStaffStatus(currentStaff.id, newSt);
              setNotification({
                type: 'info',
                text: `Holatingiz "${newSt}" ga o'zgartirildi`,
              });
              setTimeout(() => setNotification(null), 3000);
            }}
            title={currentStaff.status === STAFF_STATUS.OFFLINE ? "Tizimga kirish (Online)" : "Chiqish (Offline)"}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              currentStaff.status === STAFF_STATUS.OFFLINE
                ? 'bg-red-500/20 text-red-400'
                : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            title={`${currentStaff.name} (${currentStaff.windowNumber}-Oyna)`}
            className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-x-hidden space-y-5">
        
        {/* Top Header Bar - Oq va To'q Yashil */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-emerald-200 rounded-2xl px-5 py-3.5 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-emerald-800 font-black text-xl">≡</span>
            <span className="font-extrabold text-emerald-950 text-base sm:text-lg">
              {currentBranch.name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Operator Info & Logout (Talab 7) */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Operator:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 font-black border border-emerald-300">
                {currentStaff.name} ({currentStaff.windowNumber}-Oyna)
              </span>
              <button
                onClick={handleStaffLogout}
                title="Hisobdan chiqish"
                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Chiqish</span>
              </button>
            </div>

            {/* Active / Break Toggle Button */}
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 p-1 rounded-xl">
              <button
                onClick={() => updateStaffStatus(currentStaff.id, STAFF_STATUS.AVAILABLE)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  currentStaff.status === STAFF_STATUS.AVAILABLE
                    ? 'bg-emerald-800 text-white shadow'
                    : 'text-slate-600 hover:text-emerald-900'
                }`}
              >
                Faol (Active)
              </button>
              <button
                onClick={handleToggleBreak}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  currentStaff.status === STAFF_STATUS.PAUSED
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-600 hover:text-emerald-900'
                }`}
              >
                Tanaffus {currentStaff.pauseReason && `(${currentStaff.pauseReason})`}
              </button>
            </div>

            {/* Date Time */}
            <div className="font-sans font-bold text-emerald-950 hidden md:block">
              {new Date().toLocaleDateString('uz-UZ')} {new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              notification.type === 'danger'
                ? 'bg-red-500/20 border border-red-500 text-red-700'
                : notification.type === 'warning'
                ? 'bg-amber-500/20 border border-amber-500 text-amber-800'
                : 'bg-emerald-100 border border-emerald-500 text-emerald-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{notification.text}</span>
          </div>
        )}

        {/* VIEW 1: Main Workspace */}
        {activeTab === 'workspace' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Main Navbat Calling Box (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              <div className="bg-white border-2 border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                  <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-sm">Navbat Boshqaruvi</span>
                  <div className="flex items-center gap-4">
                    <span>Kutayotganlar: <strong className="text-emerald-900 font-black">{staffWaitingQueue.length} ta</strong></span>
                    <span>Holat: <strong className="text-emerald-900 font-black">{currentStaff.pauseReason || 'Ish faoliyatida'}</strong></span>
                  </div>
                </div>

                {/* Hotkeys Quick Helper Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 mb-4 rounded-xl bg-[#080d1a] border border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tezkor tugmalar (Hotkeys):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">F2</kbd>
                      <span>Keyingi</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">F3</kbd>
                      <span>Qayta</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30">F4</kbd>
                      <span>Yakunlash</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">F7</kbd>
                      <span>Yo‘naltirish</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">F8</kbd>
                      <span>Kelmadi</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">F9</kbd>
                      <span>Tanaffus</span>
                    </span>
                  </div>
                </div>

                {/* Big Split Layout: Ticket Info on Left, Actions on Right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Ticket Box (7 cols) - Oq va To'q Yashil */}
                  <div className="md:col-span-7 bg-emerald-50/60 border-2 border-emerald-300 rounded-3xl p-6 flex flex-col justify-between shadow-inner relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Joriy Mijoz</span>
                      {activeTicket ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-800 text-white shadow-sm">
                          {activeTicket.status === TICKET_STATUS.IN_SERVICE ? "Xizmat ko‘rsatilmoqda" : "Chaqirildi"}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-600">
                          Bo‘sh
                        </span>
                      )}
                    </div>

                    {/* Giant Dark Emerald Ticket Number */}
                    <div className="py-5 text-center">
                      <div className="text-6xl sm:text-7xl md:text-8xl font-black text-emerald-950 font-sans tracking-tight">
                        {activeTicket ? activeTicket.ticketNumber : '—'}
                      </div>
                    </div>

                    {/* Ticket Sub-details */}
                    <div className="space-y-1.5 text-xs text-slate-700 border-t border-emerald-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Xizmat:</span>
                        <span className="font-extrabold text-emerald-950 truncate max-w-[200px]">
                          {activeTicketService?.name || 'Bank xizmati'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Kutish vaqti:</span>
                        <span className="font-sans font-bold text-emerald-800">
                          {activeTicket
                            ? `${Math.max(1, Math.round((activeTicket.calledAt - activeTicket.createdAt) / 60000))} daqiqa`
                            : '0 daqiqa'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Mijoz:</span>
                        <span className="font-bold text-slate-900">
                          {activeTicket?.clientIdentifier || 'Mijoz'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-right">
                      <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {activeTicket?.status === TICKET_STATUS.IN_SERVICE ? 'Xizmat jarayonida' : 'Chaqiruv kutmoqda'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Column (5 cols) */}
                  <div className="md:col-span-5 flex flex-col justify-between gap-3">
                    
                    {/* Keyingi mijoz */}
                    <button
                      onClick={handleNextCustomer}
                      disabled={currentStaff.status !== STAFF_STATUS.AVAILABLE}
                      className="w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 hover:from-emerald-950 hover:to-emerald-850 text-white font-black text-sm sm:text-base py-4 px-4 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-900/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <span>Keyingi mijoz (F2)</span>
                      <Play className="w-5 h-5 fill-current text-emerald-300" />
                    </button>

                    {/* Qayta chaqirish */}
                    <button
                      onClick={() => activeTicket && recallCustomer(activeTicket.id)}
                      disabled={!activeTicket}
                      className="w-full bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-between shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <span>Qayta chaqirish (F3)</span>
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Xizmatni yakunlash / boshlash */}
                    <button
                      onClick={() => {
                        if (!activeTicket) return;
                        if (activeTicket.status === TICKET_STATUS.CALLED) {
                          startService(activeTicket.id);
                        } else {
                          completeService(activeTicket.id);
                        }
                      }}
                      disabled={!activeTicket}
                      className="w-full bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-between shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <span>{activeTicket?.status === TICKET_STATUS.CALLED ? 'Xizmatni boshlash (F4)' : 'Xizmatni yakunlash (F4)'}</span>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    {/* Yuborish / Yo'naltirish */}
                    <button
                      onClick={() => setShowTransferModal(true)}
                      disabled={!activeTicket}
                      className="w-full bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-between shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <span>Yuborish/Yo‘naltirish (F7)</span>
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Sub-actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={handleMarkNoShow}
                        disabled={!activeTicket}
                        className="py-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        Kelmadi (F8)
                      </button>
                      <button
                        onClick={handleToggleBreak}
                        className="py-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                      >
                        Tanaffus (F9)
                      </button>
                    </div>

                  </div>

                </div>
              </div>

              {/* Bottom Row of Left: Secondary Navbat Card + Quick Chat + Statistika */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Secondary Navbat Card (4 cols) (Talab 2: Tugmalar olib tashlandi, Talab 6: Mijoz ismi/tel) */}
                <div className="md:col-span-4 bg-white border-2 border-emerald-200 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                  <div className="text-xs font-bold text-slate-500 mb-2">Navbatdagi Mijoz</div>
                  <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 my-auto space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>Chipta:</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">
                        Kutmoqda
                      </span>
                    </div>
                    <div className="text-3xl font-black text-emerald-950 font-sans tracking-tight">
                      {staffWaitingQueue[0]?.ticketNumber || 'X-103'}
                    </div>
                    <div className="text-xs font-bold text-emerald-900 truncate">
                      Mijoz: {staffWaitingQueue[0]?.clientIdentifier || 'Keyingi mijoz'}
                    </div>
                    {staffWaitingQueue[0]?.clientPhone && (
                      <div className="text-[11px] font-mono text-slate-500">
                        Tel: {staffWaitingQueue[0].clientPhone}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-emerald-200/60">
                      Kutish: {staffWaitingQueue[0] ? `${Math.max(1, Math.round((Date.now() - staffWaitingQueue[0].createdAt) / 60000))} daqiqa` : '5 daqiqa'}
                    </div>
                  </div>
                </div>

                {/* Quick Chat / Alerts (4 cols) */}
                <div className="md:col-span-4 bg-white border-2 border-emerald-200 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                    <span>Xabarlar & Ogohlantirishlar</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  </div>
                  
                  <div className="space-y-2 max-h-24 overflow-y-auto text-[11px] pr-1">
                    {operatorAlerts.slice(0, 2).map((a) => (
                      <div key={a.id} className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-200">
                        <div className="text-emerald-900 font-bold text-[10px] flex justify-between">
                          <span>{a.sender}</span>
                          <span className="text-slate-400">{a.time}</span>
                        </div>
                        <p className="text-slate-700 text-[10px] leading-tight line-clamp-2 mt-0.5">
                          {a.message}
                        </p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendChat} className="flex gap-1 mt-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Xabar yozing..."
                      className="flex-1 bg-slate-50 border border-emerald-300 rounded-lg px-2.5 py-1 text-[11px] text-slate-900 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="p-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                </div>

                {/* Statistika 4 Cards (4 cols) */}
                <div className="md:col-span-4 bg-white border-2 border-emerald-200 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                  <div className="text-xs font-bold text-slate-500 mb-2">Bugungi Statistika</div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
                      <div className="text-[10px] text-slate-500">Xizmat ko‘rsatildi:</div>
                      <div className="text-base font-black text-emerald-950">{currentStaff.servedCountToday || 24} mijoz</div>
                    </div>
                    <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
                      <div className="text-[10px] text-slate-500">O‘rtacha vaqt:</div>
                      <div className="text-base font-black text-emerald-800">8 daqiqa</div>
                    </div>
                    <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
                      <div className="text-[10px] text-slate-500">Kutilmoqda:</div>
                      <div className="text-base font-black text-amber-700">{staffWaitingQueue.length} mijoz</div>
                    </div>
                    <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
                      <div className="text-[10px] text-slate-500">Holat:</div>
                      <div className="text-base font-black text-emerald-800">Faol</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Active Queue Table (4 cols) */}
            <div className="lg:col-span-4 bg-white border-2 border-emerald-200 rounded-3xl p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between border-b-2 border-emerald-100 pb-3 mb-3">
                <span className="font-extrabold text-emerald-950 text-sm">Kutish Zali Navbati</span>
                <button
                  onClick={() => setQueueExpanded(!queueExpanded)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {queueExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {queueExpanded && (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs">
                    <thead className="text-slate-400 border-b border-emerald-100 text-[11px] uppercase">
                      <tr>
                        <th className="pb-2">Mijoz</th>
                        <th className="pb-2">Kutish vaqti</th>
                        <th className="pb-2 text-right">Xizmat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100 text-slate-700 font-sans">
                      {staffWaitingQueue.slice(0, 8).map((t) => {
                        const srv = services.find((s) => s.id === t.serviceId);
                        const waitMinutes = Math.max(1, Math.round((Date.now() - t.createdAt) / 60000));

                        return (
                          <tr key={t.id} className="hover:bg-emerald-50/90 transition-colors border-b border-emerald-100/70">
                            <td className="py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-emerald-950 text-sm font-sans tracking-tight">
                                  {t.ticketNumber}
                                </span>
                                {t.priority === TICKET_PRIORITY.VIP && (
                                  <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-black">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium truncate max-w-[130px]">
                                {t.clientIdentifier || 'Mijoz'}
                              </div>
                            </td>
                            <td className="py-3 text-emerald-800 font-mono font-bold text-xs">
                              {waitMinutes}:45
                            </td>
                            <td className="py-3 text-right font-semibold text-slate-800 text-xs truncate max-w-[120px]">
                              {srv?.name || 'Xizmat'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 2: Operator History Tab (matching Clock Icon) */}
        {activeTab === 'history' && (
          <div className="bg-[#111a33] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Qabul Tarixi — {currentStaff.name}</h3>
                  <p className="text-xs text-slate-400">Bugungi xizmat ko‘rsatilgan va bekor qilingan mijozlar ro‘yxati</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('workspace')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                ← Ish stoliga qaytish
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1224] text-slate-400 uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Raqam</th>
                    <th className="p-3">Mijoz ID</th>
                    <th className="p-3">Xizmat</th>
                    <th className="p-3">Holat</th>
                    <th className="p-3">Chaqirilgan</th>
                    <th className="p-3">Yakunlangan</th>
                    <th className="p-3 text-right">Davomiyligi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {operatorHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        Bugun hali yakunlangan xizmatlar mavjud emas.
                      </td>
                    </tr>
                  ) : (
                    operatorHistory.map((t) => {
                      const srv = services.find((s) => s.id === t.serviceId);
                      const duration = t.completedAt && t.startedAt ? Math.round((t.completedAt - t.startedAt) / 60000) : 6;
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-cyan-400">{t.ticketNumber}</td>
                          <td className="p-3 text-slate-300">{t.clientIdentifier || 'Mijoz'}</td>
                          <td className="p-3 text-slate-300">{srv?.name}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === TICKET_STATUS.COMPLETED ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {t.calledAt ? new Date(t.calledAt).toLocaleTimeString('uz-UZ') : '—'}
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {t.completedAt ? new Date(t.completedAt).toLocaleTimeString('uz-UZ') : '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-white">~{duration} daqiqa</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: Settings Tab (matching Gear Icon) */}
        {activeTab === 'settings' && (
          <div className="bg-[#111a33] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 max-w-3xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Operator Ish Stoli Sozlamalari</h3>
                  <p className="text-xs text-slate-400">Qulaylik, xabarnomalar va tezkor klaviatura tugmalari</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('workspace')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                ← Ish stoliga qaytish
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Hotkeys */}
              <div className="p-4 rounded-2xl bg-[#0b1224] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">Tezkor Klaviatura Tugmalari (Hotkeys)</div>
                  <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    <strong>F2:</strong> Keyingi | <strong>F3:</strong> Qayta | <strong>F4:</strong> Boshlash/Yakunlash | <strong>F7:</strong> Yo‘naltirish | <strong>F8:</strong> Kelmadi | <strong>F9:</strong> Tanaffus | <strong>Esc:</strong> Bekor qilish
                  </div>
                </div>
                <button
                  onClick={() => setEnableHotkeys(!enableHotkeys)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    enableHotkeys ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${enableHotkeys ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* Auto call next */}
              <div className="p-4 rounded-2xl bg-[#0b1224] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">Avtomatik Keyingi Mijozga O‘tish</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Xizmat yakunlangach 5 soniyadan so‘ng navbatdagi mijoz avtomatik chaqiriladi
                  </div>
                </div>
                <button
                  onClick={() => setAutoCallNext(!autoCallNext)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    autoCallNext ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${autoCallNext ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* Sound volume slider */}
              <div className="p-4 rounded-2xl bg-[#0b1224] border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Gong & Ovozli Xabarnoma Balandligi</span>
                  <span className="font-mono text-cyan-400 font-bold">{soundVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(e.target.value)}
                  className="w-full cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: Personal Analytics Tab (matching BarChart Icon) */}
        {activeTab === 'analytics' && (
          <div className="bg-[#111a33] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Shaxsiy Samaradorlik (KPI) — {currentStaff.name}</h3>
                  <p className="text-xs text-slate-400">Oyna: {currentStaff.windowNumber} | Bugungi unumdorlik</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('workspace')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                ← Ish stoliga qaytish
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-[#0b1224] p-4 rounded-2xl border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Qabul Qilinganlar</div>
                <div className="text-3xl font-black text-white my-1">{currentStaff.servedCountToday || 42}</div>
                <div className="text-[10px] text-emerald-400">Reja: 40 ta (Bajarildi 105%)</div>
              </div>
              <div className="bg-[#0b1224] p-4 rounded-2xl border border-slate-800 text-center">
                <div className="text-xs text-slate-400">O‘rtacha Xizmat Vaqti</div>
                <div className="text-3xl font-black text-cyan-400 my-1">8:30</div>
                <div className="text-[10px] text-slate-400">Standart: 10:00 daqiqa</div>
              </div>
              <div className="bg-[#0b1224] p-4 rounded-2xl border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Mijozlar Bahosi</div>
                <div className="text-3xl font-black text-amber-400 my-1">4.9 / 5</div>
                <div className="text-[10px] text-slate-400">38 ta ijobiy fikr</div>
              </div>
              <div className="bg-[#0b1224] p-4 rounded-2xl border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Kelmadi (No-Show)</div>
                <div className="text-3xl font-black text-slate-300 my-1">{currentStaff.noShowCountToday || 0}</div>
                <div className="text-[10px] text-emerald-400">Me’yorda (&lt;3 ta)</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Break Reason Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-400" />
              Tanaffus sababini tanlang
            </h4>
            <div className="space-y-2">
              {['Tushlik tanaffusi', 'Texnik tanaffus', 'Hujjat ishlari', 'Xizmat safari'].map((r) => (
                <button
                  key={r}
                  onClick={() => setBreakReason(r)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    breakReason === r
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={confirmBreak}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Tanaffusga chiqish
              </button>
              <button
                onClick={() => setShowBreakModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              Boshqa xizmatga yo‘naltirish
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {services.map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => setSelectedTransferService(srv.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedTransferService === srv.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {srv.name} ({srv.prefix})
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (activeTicket && selectedTransferService) {
                    transferTicket(activeTicket.id, selectedTransferService);
                    setShowTransferModal(false);
                  }
                }}
                disabled={!selectedTransferService}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs disabled:opacity-40 cursor-pointer"
              >
                Yo‘naltirish
              </button>
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
