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
  Smartphone,
  Briefcase,
  TrendingUp,
  Shield,
  ArrowLeft,
  X,
  CheckCircle,
  Play,
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
    recallCustomer,
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

  // The latest called ticket to highlight
  const spotlightTicket =
    lastCalledTicket ||
    activeServingTickets.find((t) => t.status === TICKET_STATUS.CALLED) ||
    activeServingTickets[0] ||
    null;

  // Next tickets waiting in line (FIFO)
  const waitingTickets = branchTickets
    .filter((t) => t.status === TICKET_STATUS.WAITING)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 8);

  // Branch staff windows
  const branchStaff = staff.filter((s) => s.branchId === activeBranchId);

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
      announceTicket('A-101', '1');
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      
      {/* Top Header Bar with Prominent Navigation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md shadow-2xl">
        
        {/* Brand & Branch */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white flex-shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
                {activeBranch?.name}
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                MARKAZIY TABLO
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[240px] sm:max-w-none">
              {activeBranch?.address}
            </p>
          </div>
        </div>

        {/* ALL INTERACTIVE NAVIGATION BUTTONS */}
        {onNavigate && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => onNavigate('kiosk')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>1. Kiosk</span>
            </button>

            <button
              onClick={() => onNavigate('staff')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Operator</span>
            </button>

            <button
              onClick={() => onNavigate('manager')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. Menejer Tahlil</span>
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>4. Super Admin</span>
            </button>
          </div>
        )}

        {/* Live Date, Clock & Action Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-medium text-slate-400 capitalize">{formattedDate}</div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-blue-400">
              {formattedTime}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound test button */}
            <button
              onClick={handleTestChime}
              title="Gong & Ovozni sinash"
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                soundTestSuccess
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
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
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 hover:bg-blue-600/30'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="To‘liq TV Ekran"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>

      {/* Main Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1">
        
        {/* Left Column: Spotlight Called Ticket & Windows Grid (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Spotlight Hero: Currently / Last Called Ticket */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-blue-500/50 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-red-400">
                  MARHAMAT, XIZMAT KO‘RSATISH OYNASIGA YAQINLASHING
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
                Jonli chaqiruv
              </div>
            </div>

            {spotlightTicket ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-center">
                
                {/* Ticket Number */}
                <div className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-6 shadow-inner">
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                    Navbat Raqami
                  </div>
                  <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-200 to-white font-sans tracking-tight">
                    {spotlightTicket.ticketNumber}
                  </div>
                  <div className="text-sm font-bold text-slate-300 mt-2 truncate">
                    {services.find((s) => s.id === spotlightTicket.serviceId)?.name || 'Xizmat turi'}
                  </div>
                </div>

                {/* Window Direction */}
                <div className="bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-slate-950 border border-blue-500/40 rounded-2xl p-6 shadow-inner">
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                    Qabul Oynasi
                  </div>
                  <div className="text-6xl md:text-8xl font-black text-amber-400 font-sans tracking-tight flex items-center justify-center gap-2">
                    <span>{spotlightTicket.windowNumber || '1'}</span>
                    <span className="text-2xl md:text-3xl text-amber-300 font-bold uppercase">
                      Oyna
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-emerald-400 mt-2">
                    {spotlightTicket.status === TICKET_STATUS.CALLED ? 'Hozir chaqirilmoqda' : 'Xizmat ko‘rsatilmoqda'}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                <h3 className="text-xl font-bold text-slate-400 mb-1">Hozircha chaqiruvlar yo‘q</h3>
                <p className="text-sm text-slate-600">
                  Bo‘sh xodimlar navbatdagi mijozlarni qabul qilishi kutilmoqda.
                </p>
              </div>
            )}
          </div>

          {/* Windows Status Grid (INTERACTIVE: clickable cards show details!) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1">
            <div className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-between">
              <span>Barcha Xizmat Oynalari</span>
              <span className="text-blue-400 font-normal lowercase">(oynani bosib tafsilotlarni ko‘ring)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {branchStaff.map((staffMember) => {
                const currentServing = tickets.find(
                  (t) =>
                    (t.id === staffMember.currentTicketId || t.staffId === staffMember.id) &&
                    (t.status === TICKET_STATUS.CALLED || t.status === TICKET_STATUS.IN_SERVICE)
                );

                const isCalled = currentServing?.status === TICKET_STATUS.CALLED;

                return (
                  <button
                    key={staffMember.id}
                    onClick={() => setSelectedWindowModal({ staff: staffMember, ticket: currentServing })}
                    className={`rounded-xl p-3 border text-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      isCalled
                        ? 'bg-amber-500/15 border-amber-500/80 shadow-lg shadow-amber-500/20'
                        : currentServing
                        ? 'bg-blue-600/10 border-blue-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                      {staffMember.windowNumber}-Oyna
                    </div>
                    
                    <div className="text-2xl font-black my-1">
                      {currentServing ? (
                        <span className={isCalled ? 'text-amber-400 font-sans' : 'text-blue-300 font-sans'}>
                          {currentServing.ticketNumber}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-sm font-semibold">
                          {staffMember.status === STAFF_STATUS.PAUSED
                            ? 'Tanaffus'
                            : staffMember.status === STAFF_STATUS.OFFLINE
                            ? 'Oflayn'
                            : 'Bo‘sh'}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 truncate font-medium">
                      {staffMember.name.split(' ')[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Waiting List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-white text-base">Navbatdagi Mijozlar</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                {waitingTickets.length} kishi
              </span>
            </div>

            {waitingTickets.length === 0 ? (
              <div className="my-auto text-center py-12 text-slate-500 text-xs">
                Kutish ro‘yxatida hech kim yo‘q. Yangi mijozlar kelishi bilan bu yerda ko‘rinadi.
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {waitingTickets.map((t, idx) => {
                  const srv = services.find((s) => s.id === t.serviceId);
                  const waitMinutes = Math.max(1, Math.round((currentTime - t.createdAt) / 60000));

                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-extrabold text-lg text-white font-sans">
                            {t.ticketNumber}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                            {srv?.name}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-300">
                          {waitMinutes} daq
                        </div>
                        <div className="text-[10px] text-slate-500">kutmoqda</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Running Marquee Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-4 overflow-hidden shadow-lg">
        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider flex-shrink-0">
          E’LON
        </span>
        <div className="overflow-hidden w-full relative">
          <div className="animate-marquee text-xs font-medium text-slate-300">
            📢 Hurmatli mijozlar! Ekranda navbat raqamingiz va qabul oynasi e’lon qilinganda, ko‘rsatilgan xizmat oynasiga yaqinlashingizni so‘raymiz. Xizmat sifatini oshirish maqsadida suhbatlar audio yozuvga olinadi. • Kiosk terminalidan navbat olish mutlaqo bepul va avtomatlashtirilgan.
          </div>
        </div>
      </div>

      {/* Window Details Interactive Modal */}
      {selectedWindowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-cyan-400">
                {selectedWindowModal.staff.windowNumber}-Xizmat Oynasi
              </h3>
              <button onClick={() => setSelectedWindowModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Operator:</span>
                <span className="font-bold text-white">{selectedWindowModal.staff.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Holati:</span>
                <span className="font-bold text-emerald-400">{selectedWindowModal.staff.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Joriy Mijoz:</span>
                <span className="font-bold text-cyan-300 font-sans text-sm">
                  {selectedWindowModal.ticket ? selectedWindowModal.ticket.ticketNumber : 'Xizmat yo‘q (Bo‘sh)'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Bugun xizmat ko‘rsatdi:</span>
                <span className="font-bold text-white">{selectedWindowModal.staff.servedCountToday || 0} kishi</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {selectedWindowModal.ticket && (
                <button
                  onClick={() => {
                    recallCustomer(selectedWindowModal.ticket.id);
                    setSelectedWindowModal(null);
                  }}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Qayta chaqirish 🔊
                </button>
              )}
              <button
                onClick={() => setSelectedWindowModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
