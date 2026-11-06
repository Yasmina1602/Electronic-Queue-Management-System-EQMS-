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

  // Tizimga kirgan xodim ma'lumotlari
  const currentUser = (() => {
    try {
      const u = localStorage.getItem('qms_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const operatorStaffList = staff.filter((s) => (s.role_id || s.roleId || s.role) === 'OPERATOR');
  const currentStaff =
    (currentUser?.role === 'OPERATOR' && operatorStaffList.find((s) => s.id === currentUser?.id || s.login === currentUser?.login)) ||
    operatorStaffList[0] ||
    staff[0];
  const currentBranch = branches.find((b) => b.id === (currentStaff?.branchId || currentStaff?.branch_id)) || branches[0];

  // Agar tizimga kirgan foydalanuvchi Admin yoki Superadmin bo'lsa, operator stolida mijoz qabul qilish ruxsati berilmaydi
  if (currentUser && currentUser.role !== 'OPERATOR') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-emerald-300 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-300">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-emerald-950">Operator Ish Stoli Cheklangan</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Mijozlarga faqat xizmat ko‘rsatuvchi xodimlar (operatorlar) xizmat qila oladi. Administrator va Superadmin lavozimi boshqaruv uchun mo‘ljallangan bo‘lib, mijoz chaqira olmaydi.
          </p>
          <div className="pt-2">
            <button
              onClick={() => { window.location.href = '/admin'; }}
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Admin Boshqaruv Paneliga O‘tish
            </button>
          </div>
        </div>
      </div>
    );
  }

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
  const [enableHotkeys, setEnableHotkeys] = useState(true);

  // Sync activeStaffId with current staff
  useEffect(() => {
    if (currentStaff?.id && activeStaffId !== currentStaff.id) {
      setActiveStaffId(currentStaff.id);
    }
  }, [currentStaff?.id, activeStaffId, setActiveStaffId]);

  // Staff logout
  const handleStaffLogout = () => {
    localStorage.removeItem('qms_auth_token');
    localStorage.removeItem('qms_user');
    localStorage.removeItem('qms_staff_auth_id');
    localStorage.removeItem('qms_admin_auth');
    window.location.href = '/login';
  };

  // Active ticket assigned to this staff
  const activeTicket = tickets.find(
    (t) =>
      t.id === (currentStaff?.currentTicketId || currentStaff?.current_ticket_id) ||
      ((t.staffId === currentStaff?.id || t.staff_id === currentStaff?.id) &&
        (t.status === TICKET_STATUS.CALLED || t.status === TICKET_STATUS.IN_SERVICE))
  );

  const activeTicketService = services.find((s) => s.id === (activeTicket?.serviceId || activeTicket?.service_id));

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
  const staffServices = currentStaff?.authorizedServiceIds || currentStaff?.authorized_service_ids || ['srv-general', 'srv-accounting'];
  const staffBranch = currentStaff?.branchId || currentStaff?.branch_id || 'branch-1';

  const staffWaitingQueue = tickets
    .filter(
      (t) =>
        t.status === TICKET_STATUS.WAITING &&
        (t.branchId || t.branch_id || 'branch-1') === staffBranch &&
        staffServices.includes(t.serviceId || t.service_id)
    )
    .sort((a, b) => {
      if (a.priority === TICKET_PRIORITY.VIP && b.priority !== TICKET_PRIORITY.VIP) return -1;
      if (b.priority === TICKET_PRIORITY.VIP && a.priority !== TICKET_PRIORITY.VIP) return 1;
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.created_at || 0).getTime();
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.created_at || 0).getTime();
      return timeA - timeB;
    });

  // Today's history for this operator
  const operatorHistory = tickets.filter(
    (t) =>
      (t.staffId === currentStaff.id || t.staff_id === currentStaff.id) &&
      (t.status === TICKET_STATUS.COMPLETED || t.status === TICKET_STATUS.NO_SHOW)
  );

  const handleNextCustomer = async (force = true) => {
    setNotification(null);
    if (currentStaff?.status === STAFF_STATUS.PAUSED || currentStaff?.status === STAFF_STATUS.OFFLINE) {
      await updateStaffStatus(currentStaff.id, STAFF_STATUS.AVAILABLE);
    }
    const result = await callNextCustomer(currentStaff.id, force);
    if (result?.success && result?.ticket) {
      setNotification({
        type: 'success',
        text: `Mijoz ${result.ticket.ticketNumber || result.ticket.ticket_number} navbati qabul qilindi va ekranga chaqirildi!`,
      });
      setTimeout(() => setNotification(null), 4000);
    } else if (result?.empty) {
      setNotification({
        type: 'info',
        text: result.message || 'Hozirda kutish zalida navbat kutayotgan mijozlar yo‘q.',
      });
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({
        type: 'warning',
        text: result?.error || result?.message || 'Hozirda navbat kutayotgan mijozlar mavjud emas.',
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleMarkNoShow = async () => {
    if (!activeTicket) return;
    await markNoShow(activeTicket.id);
    setNotification({
      type: 'info',
      text: `Mijoz ${activeTicket.ticketNumber || activeTicket.ticket_number} kelmadi (NO_SHOW) deb qayd etildi.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleBreak = async () => {
    if (currentStaff.status === STAFF_STATUS.PAUSED) {
      await updateStaffStatus(currentStaff.id, STAFF_STATUS.AVAILABLE);
    } else {
      setShowBreakModal(true);
    }
  };

  const confirmBreak = async () => {
    await updateStaffStatus(currentStaff.id, STAFF_STATUS.PAUSED, breakReason);
    setShowBreakModal(false);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendOperatorAlert(chatInput.trim());
    setChatInput('');
  };

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
            onClick={() => setActiveTab('settings')}
            title={`${currentStaff.windowNumber || currentStaff.window_number || '1'}-xodim: ${currentStaff.name}`}
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
            {/* Operator Info */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Xizmat:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 font-black border border-emerald-300">
                {currentStaff.windowNumber || currentStaff.window_number || '1'}-xodim: {currentStaff.name}
              </span>
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
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 mb-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tezkor tugmalar (Hotkeys):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white text-emerald-950 font-mono font-bold border border-emerald-300 shadow-xs">F2</kbd>
                      <span className="font-medium">Keyingi</span>
                    </span>
                    <span className="text-emerald-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white text-emerald-950 font-mono font-bold border border-emerald-300 shadow-xs">F3</kbd>
                      <span className="font-medium">Qayta</span>
                    </span>
                    <span className="text-emerald-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white text-emerald-950 font-mono font-bold border border-emerald-300 shadow-xs">F4</kbd>
                      <span className="font-medium">Yakunlash</span>
                    </span>
                    <span className="text-emerald-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white text-emerald-950 font-mono font-bold border border-emerald-300 shadow-xs">F7</kbd>
                      <span className="font-medium">Yo‘naltirish</span>
                    </span>
                    <span className="text-emerald-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white text-emerald-950 font-mono font-bold border border-emerald-300 shadow-xs">F8</kbd>
                      <span className="font-medium">Kelmadi</span>
                    </span>
                    <span className="text-emerald-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white text-emerald-950 font-mono font-bold border border-emerald-300 shadow-xs">F9</kbd>
                      <span className="font-medium">Tanaffus</span>
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
                        {activeTicket
                          ? (activeTicket.status === TICKET_STATUS.IN_SERVICE ? 'Xizmat jarayonida' : 'Chaqirildi')
                          : 'Operator bo‘sh'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Column (5 cols) */}
                  <div className="md:col-span-5 flex flex-col justify-between gap-3">
                    
                    {/* Keyingi mijoz */}
                    <button
                      onClick={() => handleNextCustomer(true)}
                      className="w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 hover:from-emerald-950 hover:to-emerald-850 text-white font-black text-sm sm:text-base py-4 px-4 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-900/25 transition-all cursor-pointer active:scale-95"
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
                      onClick={async () => {
                        if (!activeTicket) return;
                        if (activeTicket.status === TICKET_STATUS.CALLED) {
                          await startService(activeTicket.id);
                        } else {
                          await completeService(activeTicket.id);
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
                      className="w-full bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 text-emerald-950 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-between shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <span>Yuborish/Yo‘naltirish (F7)</span>
                      <Share2 className="w-4 h-4 text-emerald-700" />
                    </button>

                    {/* Sub-actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={handleMarkNoShow}
                        disabled={!activeTicket}
                        className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        Kelmadi (F8)
                      </button>
                      <button
                        onClick={handleToggleBreak}
                        className="py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
                      >
                        Tanaffus (F9)
                      </button>
                    </div>

                  </div>

                </div>
              </div>

              {/* Bottom Row of Left: Secondary Navbat Card + Quick Chat + Statistika */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Secondary Navbat Card (4 cols) */}
                <div className="md:col-span-4 bg-white border-2 border-emerald-200 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                  <div className="text-xs font-bold text-slate-500 mb-2">Navbatdagi Mijoz</div>
                  {staffWaitingQueue.length > 0 ? (
                    <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 my-auto space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Chipta:</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">
                          Kutmoqda
                        </span>
                      </div>
                      <div className="text-3xl font-black text-emerald-950 font-sans tracking-tight">
                        {staffWaitingQueue[0].ticketNumber || staffWaitingQueue[0].ticket_number}
                      </div>
                      <div className="text-xs font-bold text-emerald-900 truncate">
                        Mijoz: {staffWaitingQueue[0].clientIdentifier || staffWaitingQueue[0].client_name || 'Mijoz'}
                      </div>
                      {(staffWaitingQueue[0].clientPhone || staffWaitingQueue[0].client_phone) && (
                        <div className="text-[11px] font-mono text-slate-500">
                          Tel: {staffWaitingQueue[0].clientPhone || staffWaitingQueue[0].client_phone}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-emerald-200/60">
                        Kutish: {Math.max(1, Math.round((Date.now() - (typeof staffWaitingQueue[0].createdAt === 'number' ? staffWaitingQueue[0].createdAt : new Date(staffWaitingQueue[0].created_at || 0).getTime())) / 60000))} daqiqa
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 text-center my-auto py-5">
                      <div className="text-sm font-bold text-slate-400">Navbatda mijoz yo‘q</div>
                      <div className="text-[11px] text-slate-400 mt-1">Kutish zali bo‘sh</div>
                    </div>
                  )}
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
          <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-xl space-y-4 w-full animate-fade-in">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950">Qabul Tarixi — {currentStaff.name}</h3>
                  <p className="text-xs text-slate-500">Bugungi xizmat ko‘rsatilgan va bekor qilingan mijozlar ro‘yxati</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('workspace')}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
              >
                ← Ish stoliga qaytish
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-emerald-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-950 text-white uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Raqam</th>
                    <th className="p-3.5">Mijoz ID</th>
                    <th className="p-3.5">Xizmat</th>
                    <th className="p-3.5">Holat</th>
                    <th className="p-3.5">Chaqirilgan</th>
                    <th className="p-3.5">Yakunlangan</th>
                    <th className="p-3.5 text-right">Davomiyligi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100 text-slate-700 bg-white">
                  {operatorHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">
                        Bugun hali yakunlangan xizmatlar mavjud emas.
                      </td>
                    </tr>
                  ) : (
                    operatorHistory.map((t) => {
                      const srv = services.find((s) => s.id === t.serviceId);
                      const duration = t.completedAt && t.startedAt ? Math.round((t.completedAt - t.startedAt) / 60000) : 6;
                      return (
                        <tr key={t.id} className="hover:bg-emerald-50/60 transition-colors">
                          <td className="p-3.5 font-black text-emerald-950">{t.ticketNumber}</td>
                          <td className="p-3.5 text-slate-800 font-semibold">{t.clientIdentifier || 'Mijoz'}</td>
                          <td className="p-3.5 text-slate-700">{srv?.name}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              t.status === TICKET_STATUS.COMPLETED ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-700 border border-rose-300'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">
                            {t.calledAt ? new Date(t.calledAt).toLocaleTimeString('uz-UZ') : '—'}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">
                            {t.completedAt ? new Date(t.completedAt).toLocaleTimeString('uz-UZ') : '—'}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-950">~{duration} daqiqa</td>
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
          <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-xl space-y-6 w-full animate-fade-in">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950">Operator Ish Stoli Sozlamalari</h3>
                  <p className="text-xs text-slate-500">Qulaylik, xabarnomalar va tezkor klaviatura tugmalari</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('workspace')}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
              >
                ← Ish stoliga qaytish
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Hotkeys */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-emerald-950 text-sm">Tezkor Klaviatura Tugmalari (Hotkeys)</div>
                  <div className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                    <strong className="text-emerald-900">F2:</strong> Keyingi | <strong className="text-emerald-900">F3:</strong> Qayta | <strong className="text-emerald-900">F4:</strong> Boshlash/Yakunlash | <strong className="text-emerald-900">F7:</strong> Yo‘naltirish | <strong className="text-emerald-900">F8:</strong> Kelmadi | <strong className="text-emerald-900">F9:</strong> Tanaffus | <strong className="text-emerald-900">Esc:</strong> Bekor qilish
                  </div>
                </div>
                <button
                  onClick={() => setEnableHotkeys(!enableHotkeys)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    enableHotkeys ? 'bg-emerald-800' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${enableHotkeys ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* Auto call next */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-emerald-950 text-sm">Avtomatik Keyingi Mijozga O‘tish</div>
                  <div className="text-slate-600 text-[11px] mt-1">
                    Xizmat yakunlangach 5 soniyadan so‘ng navbatdagi mijoz avtomatik chaqiriladi
                  </div>
                </div>
                <button
                  onClick={() => setAutoCallNext(!autoCallNext)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    autoCallNext ? 'bg-emerald-800' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${autoCallNext ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 4: Personal Analytics Tab (matching BarChart Icon) */}
        {activeTab === 'analytics' && (
          <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-xl space-y-6 w-full animate-fade-in">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950">Shaxsiy Samaradorlik (KPI) — {currentStaff.name}</h3>
                  <p className="text-xs text-slate-500">Oyna: {currentStaff.windowNumber} | Bugungi unumdorlik</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('workspace')}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
              >
                ← Ish stoliga qaytish
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50/60 p-5 rounded-2xl border-2 border-emerald-200 text-center shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qabul Qilinganlar</div>
                <div className="text-3xl font-black text-emerald-950 my-1">{currentStaff.servedCountToday || 42}</div>
                <div className="text-[11px] font-bold text-emerald-700">Reja: 40 ta (Bajarildi 105%)</div>
              </div>
              <div className="bg-emerald-50/60 p-5 rounded-2xl border-2 border-emerald-200 text-center shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">O‘rtacha Xizmat Vaqti</div>
                <div className="text-3xl font-black text-emerald-800 my-1">8:30</div>
                <div className="text-[11px] font-medium text-slate-500">Standart: 10:00 daqiqa</div>
              </div>
              <div className="bg-emerald-50/60 p-5 rounded-2xl border-2 border-emerald-200 text-center shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mijozlar Bahosi</div>
                <div className="text-3xl font-black text-amber-600 my-1">4.9 / 5</div>
                <div className="text-[11px] font-medium text-slate-500">38 ta ijobiy fikr</div>
              </div>
              <div className="bg-emerald-50/60 p-5 rounded-2xl border-2 border-emerald-200 text-center shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelmadi (No-Show)</div>
                <div className="text-3xl font-black text-rose-600 my-1">{currentStaff.noShowCountToday || 0}</div>
                <div className="text-[11px] font-bold text-emerald-700">Me’yorda (&lt;3 ta)</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Break Reason Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-emerald-300 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-black text-emerald-950 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Coffee className="w-4 h-4" />
              </div>
              Tanaffus sababini tanlang
            </h4>
            <div className="space-y-2">
              {['Tushlik tanaffusi', 'Texnik tanaffus', 'Hujjat ishlari', 'Xizmat safari'].map((r) => (
                <button
                  key={r}
                  onClick={() => setBreakReason(r)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    breakReason === r
                      ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={confirmBreak}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                Tanaffusga chiqish
              </button>
              <button
                onClick={() => setShowBreakModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-emerald-300 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-black text-emerald-950 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              Boshqa xizmatga yo‘naltirish
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {services.map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => setSelectedTransferService(srv.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedTransferService === srv.id
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-xs'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
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
                className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs disabled:opacity-40 cursor-pointer shadow-md"
              >
                Yo‘naltirish
              </button>
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
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
