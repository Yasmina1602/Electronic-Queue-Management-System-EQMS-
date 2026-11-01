import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { TICKET_STATUS, STAFF_STATUS } from '../constants/initialData';
import {
  Monitor,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Users,
  Building,
  Bell,
  ArrowRight,
  Layers,
  CheckCircle,
  Play,
  X,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';
import { playChime, announceTicket } from '../utils/audio';

export function DisplayView({ onNavigate }) {
  const {
    branches,
    activeBranchId,
    tickets,
    staff,
    services,
    lastCalledTicket,
    audioEnabled,
    setAudioEnabled,
    speechEnabled,
    setSpeechEnabled,
  } = useQueue();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedWindowModal, setSelectedWindowModal] = useState(null);
  const [soundTestSuccess, setSoundTestSuccess] = useState(false);

  // Active branch
  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter tickets for this branch
  const branchTickets = tickets.filter((t) => t.branchId === activeBranchId);

  // Tickets currently in CALLED or IN_SERVICE status
  const activeServingTickets = branchTickets
    .filter((t) => t.status === TICKET_STATUS.CALLED || t.status === TICKET_STATUS.IN_SERVICE)
    .sort((a, b) => (b.calledAt || 0) - (a.calledAt || 0));

  // The latest called ticket to highlight in Spotlight
  const spotlightTicket =
    lastCalledTicket ||
    activeServingTickets.find((t) => t.status === TICKET_STATUS.CALLED) ||
    activeServingTickets[0] ||
    null;

  // Next tickets waiting in line (FIFO)
  const waitingTickets = branchTickets
    .filter((t) => t.status === TICKET_STATUS.WAITING)
    .sort((a, b) => {
      if (a.priority === 'VIP' && b.priority !== 'VIP') return -1;
      if (b.priority === 'VIP' && a.priority !== 'VIP') return 1;
      return a.createdAt - b.createdAt;
    })
    .slice(0, 8);

  // Branch staff windows
  const branchStaff = staff.filter((s) => s.branchId === activeBranchId);

  // Helper to predict which window a waiting ticket will enter based on load leveling
  const predictTargetWindow = (ticket) => {
    const eligible = branchStaff.filter(
      (s) =>
        !s.authorizedServiceIds ||
        s.authorizedServiceIds.length === 0 ||
        s.authorizedServiceIds.includes(ticket.serviceId)
    );

    if (eligible.length === 0) return { windowNumber: '1', staffName: 'Operator' };

    // Sort: AVAILABLE first, then fewest served tickets today
    const sorted = [...eligible].sort((a, b) => {
      if (a.status === STAFF_STATUS.AVAILABLE && b.status !== STAFF_STATUS.AVAILABLE) return -1;
      if (b.status === STAFF_STATUS.AVAILABLE && a.status !== STAFF_STATUS.AVAILABLE) return 1;
      return (a.servedCountToday || 0) - (b.servedCountToday || 0);
    });

    const target = sorted[0];
    return {
      windowNumber: target.windowNumber || '1',
      staffName: target.name,
      isAvailable: target.status === STAFF_STATUS.AVAILABLE,
    };
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
  };

  const handleTestChime = () => {
    playChime();
    if (spotlightTicket) {
      announceTicket(spotlightTicket.ticketNumber, spotlightTicket.windowNumber || '1');
    } else {
      announceTicket('X-101', '1');
    }
    setSoundTestSuccess(true);
    setTimeout(() => setSoundTestSuccess(false), 2500);
  };

  const formattedDate = currentTime.toLocaleDateString('uz-UZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none">
      
      {/* Top Header Bar - To'q Yashil */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-4 sm:px-8 py-3.5 shadow-xl border-b-4 border-emerald-600 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Bank Brand & Branch */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white text-emerald-950 flex items-center justify-center font-black shadow-md">
            <Layers className="w-6 h-6 text-emerald-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase text-white">
                ELEKTRON NAVBAT MONITORI
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-emerald-100 tracking-wider">
                LIVE TV
              </span>
            </div>
            <div className="text-xs text-emerald-200 font-semibold flex items-center gap-1.5 mt-0.5">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeBranch?.name || 'Bosh Filial'}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Clock & Date */}
        <div className="flex items-center gap-4 bg-emerald-900/80 border border-emerald-700/60 px-5 py-1.5 rounded-2xl shadow-inner text-center">
          <Clock className="w-5 h-5 text-emerald-300 animate-spin-slow" />
          <div className="text-left">
            <div className="text-2xl font-black font-sans tracking-tight text-white leading-none">
              {formattedTime}
            </div>
            <div className="text-[11px] font-medium text-emerald-200 capitalize mt-0.5">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Right: Audio, Test Chime & Fullscreen */}
        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('staff')}
              title="Xodimlar sahifasiga o'tish"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 text-xs font-bold transition-all cursor-pointer border border-emerald-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Operator</span>
            </button>
          )}

          {/* Test Chime */}
          <button
            onClick={handleTestChime}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              soundTestSuccess
                ? 'bg-emerald-600 border-white text-white shadow-lg'
                : 'bg-emerald-900 hover:bg-emerald-800 border-emerald-700 text-emerald-100'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
            <span className="hidden md:inline">Ovoz Sinovi</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              setSpeechEnabled(!audioEnabled);
            }}
            title={audioEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              audioEnabled
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                : 'bg-emerald-950 border-emerald-800 text-emerald-400'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title="To‘liq TV Ekran"
            className="p-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 border border-emerald-700 text-emerald-100 transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Main TV Screen Content */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
        
        {/* Top Grid: Spotlight Called Ticket (8 cols) + Waiting Queue (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT: Spotlight Hero Banner (8 cols) - OQ va TO'Q YASHIL */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white border-4 border-emerald-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            
            {/* Header Call Alert */}
            <div className="flex items-center justify-between border-b-2 border-emerald-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 animate-ping"></span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-900">
                  MARHAMAT, XIZMAT KO‘RSATISH OYNASIGA YAQINLASHING
                </span>
              </div>
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                Jonli chaqiruv
              </div>
            </div>

            {spotlightTicket ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-center my-auto">
                
                {/* Chipta Raqami (Talab 4: whitespace-nowrap, tiqilmasligi uchun moslashuvchan o'lcham) */}
                <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-3xl p-5 sm:p-7 shadow-inner min-w-0">
                  <div className="text-xs uppercase tracking-widest text-emerald-800 font-extrabold mb-1">
                    Chipta Raqami
                  </div>
                  <div className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black text-emerald-950 font-sans tracking-tight whitespace-nowrap py-3">
                    {spotlightTicket.ticketNumber}
                  </div>
                  <div className="text-sm font-bold text-emerald-800 mt-1 truncate">
                    {services.find((s) => s.id === spotlightTicket.serviceId)?.name || 'Xizmat turi'}
                  </div>
                  {spotlightTicket.clientIdentifier && (
                    <div className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
                      {spotlightTicket.clientIdentifier}
                    </div>
                  )}
                </div>

                {/* Qabul Oynasi */}
                <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 border-2 border-emerald-700 text-white rounded-3xl p-5 sm:p-7 shadow-xl min-w-0">
                  <div className="text-xs uppercase tracking-widest text-emerald-200 font-extrabold mb-1">
                    Qabul Oynasi
                  </div>
                  <div className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black text-amber-300 font-sans tracking-tight flex items-center justify-center gap-2.5 whitespace-nowrap py-3">
                    <span>{spotlightTicket.windowNumber || '1'}</span>
                    <span className="text-2xl sm:text-3xl text-emerald-100 font-extrabold uppercase">
                      Oyna
                    </span>
                  </div>
                  <div className="text-sm font-bold text-emerald-200 mt-2 flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>
                      {spotlightTicket.status === TICKET_STATUS.CALLED ? 'Hozir chaqirilmoqda' : 'Xizmat ko‘rsatilmoqda'}
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-16 h-16 mx-auto mb-3 opacity-30 text-emerald-800" />
                <h3 className="text-2xl font-black text-emerald-950 mb-1">Hozircha chaqiruvlar yo‘q</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Navbatdagi mijozlar qabul qilinishi kutilmoqda.
                </p>
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-emerald-900">
                Qabul xodimi: {branchStaff.find((s) => s.windowNumber === spotlightTicket?.windowNumber)?.name || 'Operator'}
              </span>
              <span className="font-bold text-emerald-700">Elektron Chipta Tizimi</span>
            </div>

          </div>

          {/* RIGHT: Next Waiting in Line Queue (Talab 5: Qaysi mijoz qaysiga kirishi kerakligi) (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white border-2 border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between border-b-2 border-emerald-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-800" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-emerald-950">
                    KEYINGI NAVBATDAGILAR
                  </h3>
                </div>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  {waitingTickets.length} kutilmoqda
                </span>
              </div>

              {waitingTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-600 opacity-30" />
                  <p className="text-sm font-bold text-slate-600">Navbatda kutuvchilar yo‘q</p>
                  <p className="text-xs text-slate-400 mt-1">Barcha mijozlarga xizmat ko‘rsatildi.</p>
                </div>
              ) : (
                <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                  {waitingTickets.map((t, idx) => {
                    const prediction = predictTargetWindow(t);
                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          idx === 0
                            ? 'bg-emerald-50 border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                            : 'bg-white border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                              idx === 0
                                ? 'bg-emerald-800 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-emerald-950 font-sans tracking-tight">
                                {t.ticketNumber}
                              </span>
                              {t.priority === 'VIP' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500">
                              {services.find((s) => s.id === t.serviceId)?.name || 'Xizmat'}
                            </div>
                          </div>
                        </div>

                        {/* QAYSIGA KIRISHI KERAKLIGI (Requirement 5) */}
                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-300 flex items-center gap-1">
                            <span>➔ {prediction.windowNumber}-Oynaga</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium truncate max-w-[110px]">
                            {prediction.staffName}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-emerald-900">Avtomatik teng taqsimlash</span>
              <span className="text-emerald-700 font-bold">Zal monitoringi</span>
            </div>

          </div>

        </div>

        {/* BOTTOM: All Operating Windows (Talab 5: Qaysi mijoz qaysi operatorda ekanligi) */}
        <div className="bg-white border-2 border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-xl">
          
          <div className="flex items-center justify-between border-b-2 border-emerald-100 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-950">
                BARCHA XIZMAT KO‘RSATISH OYNALARI VA OPERATORLAR
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-800">
              Jami faol: {branchStaff.length} ta oyna
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {branchStaff.map((staffMember) => {
              // Current serving ticket
              const currentTicket = branchTickets.find(
                (t) =>
                  (t.id === staffMember.currentTicketId || t.staffId === staffMember.id) &&
                  (t.status === TICKET_STATUS.CALLED || t.status === TICKET_STATUS.IN_SERVICE)
              );

              const isBusy = !!currentTicket;
              const isPaused = staffMember.status === STAFF_STATUS.PAUSED;

              return (
                <div
                  key={staffMember.id}
                  onClick={() => setSelectedWindowModal(staffMember)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                    isBusy
                      ? 'bg-emerald-50/80 border-emerald-600 shadow-sm'
                      : isPaused
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-white border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  {/* Window number & status badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-900 text-white">
                      {staffMember.windowNumber}-OYNA
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isBusy
                          ? 'bg-emerald-600 animate-pulse'
                          : isPaused
                          ? 'bg-amber-500'
                          : 'bg-emerald-400'
                      }`}
                    ></span>
                  </div>

                  {/* Operator Name */}
                  <div className="text-xs font-bold text-emerald-950 truncate">
                    {staffMember.name}
                  </div>

                  {/* Current Client / Ticket */}
                  <div className="mt-3 pt-2.5 border-t border-emerald-100">
                    {isBusy ? (
                      <div>
                        <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                          Mijoz Qabulda:
                        </div>
                        <div className="text-2xl font-black text-emerald-950 font-sans tracking-tight">
                          {currentTicket.ticketNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {services.find((s) => s.id === currentTicket.serviceId)?.name || 'Xizmat'}
                        </div>
                      </div>
                    ) : (
                      <div className="py-1">
                        <div className="text-xs font-bold text-slate-400">
                          {isPaused ? 'Tanaffusda' : 'Bo‘sh (Kutmoqda)'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Bugun: {staffMember.servedCountToday || 0} mijoz
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Ticker / Running News Marquee at bottom */}
      <div className="bg-emerald-950 text-white py-2.5 px-4 text-xs font-bold border-t-2 border-emerald-800 overflow-hidden flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-300 shrink-0 mr-4 font-black">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>E'LON:</span>
        </div>
        <div className="truncate flex-1 text-emerald-100 font-medium">
          Hurmatli mijozlar! O‘z navbatingiz chaqirilganda iltimos ko‘rsatilgan qabul oynasiga yaqinlashing. Tizim avtomatik teng yuklama va adolatli xizmat ko‘rsatish asosida ishlamoqda.
        </div>
        <div className="shrink-0 ml-4 text-[10px] text-emerald-300">
          QMS v2.4 • Oq & To‘q Yashil Dizayn
        </div>
      </div>

      {/* Modal: Window Details when clicked */}
      {selectedWindowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-emerald-700">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h4 className="text-sm font-black text-emerald-950">
                {selectedWindowModal.windowNumber}-Oyna Tafsilotlari
              </h4>
              <button
                onClick={() => setSelectedWindowModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-800">
              Xodim: {selectedWindowModal.name}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Bugun qabul qilingan mijozlar: {selectedWindowModal.servedCountToday || 0} ta
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Holati: {selectedWindowModal.status}
            </p>
            <button
              onClick={() => setSelectedWindowModal(null)}
              className="mt-4 w-full py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
