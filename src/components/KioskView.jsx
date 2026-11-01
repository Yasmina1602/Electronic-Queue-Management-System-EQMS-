import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { ThermalTicketModal } from './ThermalTicketModal';
import {
  Layers,
  Calculator,
  QrCode,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Printer,
  KeyRound,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function KioskView({ onNavigateStaff }) {
  const { services, branches, activeBranchId, createTicket } = useQueue();
  const [ticketData, setTicketData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipCardInput, setVipCardInput] = useState('');

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // 2 ta asosiy xizmat: Xizmatlar va Buxgalteriya
  const xizmatlarService =
    services.find((s) => s.id === 'srv-general' || s.id === 'srv-cash' || s.id === 'srv-all') ||
    services[0] || {
      id: 'srv-general',
      name: 'Xizmatlar',
      prefix: 'X',
      description: 'Kassa, Kreditlar, Omonatlar, Kartalar va ma’lumotlar',
    };

  const buxgalteriyaService =
    services.find((s) => s.id === 'srv-accounting' || s.category === 'accounting') ||
    services[1] || {
      id: 'srv-accounting',
      name: 'Buxgalteriya',
      prefix: 'B',
      description: 'Hisob-kitoblar, Soliq, To‘lov topshiriqlari va yuridik shaxslar',
    };

  // Kartani bosganda DARHOL chek chiqarish
  const handleServiceClick = (service, isVip = false, clientName = null) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectedServiceId(service.id);

    setTimeout(() => {
      const res = createTicket(service.id, isVip, clientName);
      if (res.success) {
        setTicketData(res);
      }
      setIsProcessing(false);
      setSelectedServiceId(null);
    }, 400);
  };

  const formattedTime = currentTime.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-3 sm:p-6 bg-slate-100/90 text-slate-900 font-sans">
      
      {/* Tablet Device Frame - Oq va To'q Yashil */}
      <div className="w-full max-w-2xl bg-white text-slate-900 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(6,78,59,0.22)] border-[8px] border-emerald-950/10 p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[760px] my-auto">
        
        {/* Tablet Top Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4 mb-4">
          {/* Bank / Company Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-900 to-emerald-700 text-white flex items-center justify-center font-black shadow-md shadow-emerald-900/20">
              <Layers className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black tracking-tight text-emerald-950 uppercase">
                ELEKTRON NAVBAT
              </div>
              <div className="text-[10px] font-bold text-emerald-700 tracking-wider">
                BOSHQARUV TIZIMI
              </div>
            </div>
          </div>

          {/* Time & Branch */}
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-950 font-sans tracking-tight">
              {formattedTime}
            </div>
            <div className="text-xs font-semibold text-emerald-700/80">
              {activeBranch?.name || 'Asosiy Bosh Filial'}
            </div>
          </div>
        </div>

        {/* Hero Title Area */}
        <div className="my-auto flex flex-col justify-center space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Elektron Navbat Kioski
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight leading-tight">
              Tashrifingiz uchun rahmat!
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1.5 font-medium">
              Iltimos, kerakli xizmat bo‘limini tanlang
            </p>
          </div>

          {/* 2 Massive Premium Choice Cards - 1-karta: Xizmatlar, 2-karta: Buxgalteriya */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            
            {/* Karta 1: Xizmatlar */}
            <button
              onClick={() => handleServiceClick(xizmatlarService)}
              disabled={isProcessing}
              className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border-2 transition-all duration-300 text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] cursor-pointer ${
                selectedServiceId === xizmatlarService.id
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-emerald-200/90 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30 hover:border-emerald-700 hover:from-white hover:to-emerald-100/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-800/25 group-hover:scale-105 transition-transform">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-800 text-white shadow-xs">
                  Xizmatlar
                </span>
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-black text-emerald-950 group-hover:text-emerald-800 transition-colors">
                  Xizmatlar
                </h3>
                <p className="text-xs font-medium text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  Kassa, Kreditlar, Omonatlar, Kartalar va ma’lumotlar
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-emerald-200/70 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-emerald-700" />
                  Chek olish
                </span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Karta 2: Buxgalteriya */}
            <button
              onClick={() => handleServiceClick(buxgalteriyaService)}
              disabled={isProcessing}
              className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border-2 transition-all duration-300 text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] cursor-pointer ${
                selectedServiceId === buxgalteriyaService.id
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-emerald-200/90 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30 hover:border-emerald-700 hover:from-white hover:to-emerald-100/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-900 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-900/25 group-hover:scale-105 transition-transform">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-900 text-white shadow-xs">
                  Buxgalteriya
                </span>
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-black text-emerald-950 group-hover:text-emerald-800 transition-colors">
                  Buxgalteriya
                </h3>
                <p className="text-xs font-medium text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  Hisob-kitoblar, Soliq, To‘lov topshiriqlari va yuridik shaxslar
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-emerald-200/70 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-emerald-700" />
                  Chek olish
                </span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

          </div>

          {/* Bottom Banner: Loyallik va Bonuslar (To'q yashil) */}
          <div
            onClick={() => setShowVipModal(true)}
            className="w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white p-4 sm:p-5 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  Loyallik va Bonuslar
                </div>
                <div className="text-xs text-emerald-100 font-medium mt-0.5">
                  Loyallik QR-kodini skanerlash • Imtiyozli navbat va bonuslar
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-200" />
          </div>
        </div>

        {/* Footer info & Staff navigation */}
        <div className="pt-4 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Xavfsiz va markazlashgan navbat tizimi</span>
          </div>

          {onNavigateStaff && (
            <button
              onClick={onNavigateStaff}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 text-[11px] font-bold transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Xodimlar kirishi</span>
            </button>
          )}
        </div>

      </div>

      {/* Modal: VIP / Loyalty Registration */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-emerald-700">
            <h3 className="text-xl font-black text-emerald-950 mb-2">
              Loyallik Kartasi / VIP Navbat
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Karta raqamingiz yoki QR kodingizni kiriting. Tizim sizni imtiyozli (VIP) navbatga kiritadi.
            </p>
            <input
              type="text"
              value={vipCardInput}
              onChange={(e) => setVipCardInput(e.target.value)}
              placeholder="Masalan: VIP-7788 yoki Ismingiz"
              className="w-full px-4 py-3 rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-sm font-semibold mb-4 bg-emerald-50/50"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowVipModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 text-xs cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  setShowVipModal(false);
                  handleServiceClick(xizmatlarService, true, vipCardInput || 'VIP Mijoz');
                  setVipCardInput('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 text-xs shadow-md cursor-pointer"
              >
                VIP Navbat olish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thermal Ticket Modal */}
      {ticketData && (
        <ThermalTicketModal
          ticketData={ticketData}
          onClose={() => setTicketData(null)}
        />
      )}

    </div>
  );
}
