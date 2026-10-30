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

export function StaffView() {
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
  } = useQueue();

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

  const currentStaff = staff.find((s) => s.id === activeStaffId) || staff[0];
  const currentBranch = branches.find((b) => b.id === currentStaff?.branchId) || branches[0];

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

  // Keyboard Shortcuts (F2 / Space: Keyingi mijoz, F3: Qayta chaqirish, F4: Yakunlash)
  useEffect(() => {
    if (!enableHotkeys) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'F2') {
        e.preventDefault();
        if (currentStaff.status === STAFF_STATUS.AVAILABLE) {
          handleNextCustomer();
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (activeTicket) {
          recallCustomer(activeTicket.id);
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (activeTicket) {
          if (activeTicket.status === TICKET_STATUS.CALLED) {
            startService(activeTicket.id);
          } else {
            completeService(activeTicket.id);
          }
        }
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

  const handleNextCustomer = () => {
    setNotification(null);
    const result = callNextCustomer(currentStaff.id);
    if (!result.success) {
      setNotification({
        type: 'warning',
        text: result.error || result.message || 'Mijoz chaqirish imkonsiz',
      });
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({
        type: 'success',
        text: `Mijoz ${result.ticket.ticketNumber} navbati qabul qilindi va ekranga chaqirildi!`,
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0c1427] text-slate-100 flex font-sans">
      
      {/* Left Icon Rail (INTERACTIVE - matching uploaded image 1 & 2-rasm) */}
      <aside className="w-16 bg-[#0a1020] border-r border-slate-800/80 flex flex-col items-center justify-between py-5 flex-shrink-0 z-20">
        <div className="space-y-6 flex flex-col items-center">
          {/* Brand/Logo Top Icon */}
          <button
            onClick={() => setActiveTab('workspace')}
            title="Bosh sahifa / Ish stoli"
            className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
          >
            <Layers className="w-5 h-5" />
          </button>

          <div className="space-y-4">
            {/* Workspace Button */}
            <button
              onClick={() => setActiveTab('workspace')}
              title="Ish stoli (Workspace)"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
        
        {/* Top Header Bar (matching 2-rasm) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111a33] border border-slate-800 rounded-2xl px-5 py-3.5 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 font-black text-xl">≡</span>
            <span className="font-extrabold text-white text-base sm:text-lg">
              {currentBranch.name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Operator Switcher dropdown */}
            <div className="flex items-center gap-2 text-slate-400">
              <span>Operator:</span>
              <select
                value={activeStaffId}
                onChange={(e) => setActiveStaffId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} / {s.login || 'OP-' + s.windowNumber} ({s.windowNumber}-Oyna)
                  </option>
                ))}
              </select>
            </div>

            {/* Active / Break Toggle Button */}
            <div className="flex items-center gap-2 bg-[#0c1427] border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => updateStaffStatus(currentStaff.id, STAFF_STATUS.AVAILABLE)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  currentStaff.status === STAFF_STATUS.AVAILABLE
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={handleToggleBreak}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  currentStaff.status === STAFF_STATUS.PAUSED
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Break {currentStaff.pauseReason && `(${currentStaff.pauseReason})`}
              </button>
            </div>

            {/* Date Time */}
            <div className="font-mono text-slate-300 hidden md:block">
              {new Date().toLocaleDateString('uz-UZ')} {new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              notification.type === 'danger'
                ? 'bg-red-500/20 border border-red-500 text-red-300'
                : notification.type === 'warning'
                ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                : 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
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
              
              <div className="bg-[#111a33] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                  <span className="font-bold text-white uppercase tracking-wider text-sm">Navbat</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">Kutayotganlar: <strong className="text-white">{staffWaitingQueue.length}</strong></span>
                    <span className="text-slate-400">Tanaffus: <strong className="text-white">{currentStaff.pauseReason || 'Yo‘q'}</strong></span>
                  </div>
                </div>

                {/* Big Split Layout: Ticket Info on Left, Actions on Right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Glowing Ticket Box (7 cols) */}
                  <div className="md:col-span-7 bg-[#0b1224] border border-cyan-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-[inset_0_0_30px_rgba(6,182,212,0.15)] relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-400">Mijoz</span>
                      {activeTicket ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {activeTicket.status === TICKET_STATUS.IN_SERVICE ? "Xizmat ko‘rsatilmoqda" : "Chaqirildi"}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400">
                          Bo‘sh
                        </span>
                      )}
                    </div>

                    {/* Giant Cyan Ticket Number */}
                    <div className="py-4 text-center">
                      <div className="text-6xl sm:text-7xl font-black text-cyan-400 font-sans tracking-tight drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                        {activeTicket ? activeTicket.ticketNumber : '—'}
                      </div>
                    </div>

                    {/* Ticket Sub-details */}
                    <div className="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Xizmat:</span>
                        <span className="font-bold text-white truncate max-w-[180px]">
                          {activeTicketService?.name || 'Kredit rasmiylashtirish'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kutish vaqti:</span>
                        <span className="font-mono text-cyan-300 font-semibold">
                          {activeTicket
                            ? `${Math.max(1, Math.round((activeTicket.calledAt - activeTicket.createdAt) / 60000))} daqiqa`
                            : '12:45'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Mijoz:</span>
                        <span className="font-semibold text-slate-200">
                          {activeTicket?.clientIdentifier || 'Sanhita.107209'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-right">
                      <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {activeTicket?.status === TICKET_STATUS.IN_SERVICE ? 'Xizmatda' : 'Chaqirildi'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Column (5 cols) */}
                  <div className="md:col-span-5 flex flex-col justify-between gap-2.5">
                    
                    {/* Keyingi mijoz */}
                    <button
                      onClick={handleNextCustomer}
                      disabled={currentStaff.status !== STAFF_STATUS.AVAILABLE}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-sm sm:text-base py-3.5 px-4 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <span>Keyingi mijoz (F2)</span>
                      <Play className="w-5 h-5 fill-current" />
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

                    {/* Xizmatni yakunlash */}
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
                      <span>{activeTicket?.status === TICKET_STATUS.CALLED ? 'Xizmatni boshlash' : 'Xizmatni yakunlash (F4)'}</span>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    {/* Yuborish / Yo'naltirish */}
                    <button
                      onClick={() => setShowTransferModal(true)}
                      disabled={!activeTicket}
                      className="w-full bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-between shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <span>Yuborish/Yo‘naltirish</span>
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Sub-actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={handleMarkNoShow}
                        disabled={!activeTicket}
                        className="py-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        Kelmadi
                      </button>
                      <button
                        onClick={handleToggleBreak}
                        className="py-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                      >
                        Tanaffus
                      </button>
                    </div>

                  </div>

                </div>
              </div>

              {/* Bottom Row of Left: Secondary Navbat Card + Quick Chat + Statistika */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Secondary Navbat Card (4 cols) */}
                <div className="md:col-span-4 bg-[#111a33] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                  <div className="text-xs font-bold text-slate-400 mb-2">Navbat / Kutayotganlar</div>
                  <div className="bg-[#0b1224] p-3 rounded-xl border border-slate-800 my-auto">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                      <span>Mijoz</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">Pending</span>
                    </div>
                    <div className="text-2xl font-black text-cyan-400 font-sans">
                      {staffWaitingQueue[0]?.ticketNumber || 'X-103'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-1">
                      Kutish: {staffWaitingQueue[0] ? `${Math.max(1, Math.round((Date.now() - staffWaitingQueue[0].createdAt) / 60000))} daqiqa` : '12:45'}
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => activeTicket && recallCustomer(activeTicket.id)}
                      className="flex-1 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Qayta chaqirish 🔊
                    </button>
                    <button
                      onClick={() => activeTicket && completeService(activeTicket.id)}
                      className="flex-1 py-1.5 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Yakunlash ✔
                    </button>
                  </div>
                </div>

                {/* Quick Chat / Alerts (4 cols) */}
                <div className="md:col-span-4 bg-[#111a33] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>Quick Chat</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  
                  <div className="space-y-2 max-h-24 overflow-y-auto text-[11px] pr-1">
                    {operatorAlerts.slice(0, 2).map((a) => (
                      <div key={a.id} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <div className="text-emerald-400 font-bold text-[10px] flex justify-between">
                          <span>{a.sender}</span>
                          <span className="text-slate-500">{a.time}</span>
                        </div>
                        <p className="text-slate-300 text-[10px] leading-tight line-clamp-2 mt-0.5">
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
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                </div>

                {/* Statistika 4 Cards (4 cols) */}
                <div className="md:col-span-4 bg-[#111a33] border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                  <div className="text-xs font-bold text-slate-400 mb-2">Statistika</div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-[#0b1224] p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Xizmat ko‘rsatildi:</div>
                      <div className="text-base font-black text-white">{currentStaff.servedCountToday || 42} mijoz</div>
                    </div>
                    <div className="bg-[#0b1224] p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">O‘rtacha vaqt:</div>
                      <div className="text-base font-black text-cyan-400">8:30 daqiqa</div>
                    </div>
                    <div className="bg-[#0b1224] p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Kutilmoqda:</div>
                      <div className="text-base font-black text-amber-400">{staffWaitingQueue.length} mijoz</div>
                    </div>
                    <div className="bg-[#0b1224] p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Vaqt:</div>
                      <div className="text-base font-black text-emerald-400">35 daqiqa</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Active Queue Table (4 cols) */}
            <div className="lg:col-span-4 bg-[#111a33] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <span className="font-extrabold text-white text-sm">Active Queue</span>
                <button
                  onClick={() => setQueueExpanded(!queueExpanded)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {queueExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {queueExpanded && (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs">
                    <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="pb-2">Mijoz</th>
                        <th className="pb-2">Kutish vaqti</th>
                        <th className="pb-2 text-right">Xizmat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300 font-sans">
                      {staffWaitingQueue.slice(0, 8).map((t) => {
                        const srv = services.find((s) => s.id === t.serviceId);
                        const waitMinutes = Math.max(1, Math.round((Date.now() - t.createdAt) / 60000));

                        return (
                          <tr key={t.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 font-bold text-cyan-400">
                              {t.ticketNumber}
                              {t.priority === TICKET_PRIORITY.VIP && (
                                <span className="ml-1 text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold">
                                  VIP
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-slate-400 font-mono">
                              {waitMinutes}:45
                            </td>
                            <td className="py-2.5 text-right text-slate-300 truncate max-w-[110px]">
                              {srv?.name || 'Kredit rasmiylashtirish'}
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
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    <strong>F2:</strong> Keyingi mijoz | <strong>F3:</strong> Qayta chaqirish | <strong>F4:</strong> Xizmatni boshlash / Yakunlash
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
