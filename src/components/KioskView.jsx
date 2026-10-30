import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { ThermalTicketModal } from './ThermalTicketModal';
import {
  Wallet,
  FileText,
  PiggyBank,
  CreditCard,
  Briefcase,
  Info,
  QrCode,
  Sparkles,
  Camera,
  CheckCircle2,
  X,
  Layers,
  Calculator,
} from 'lucide-react';

const ICON_MAP = {
  Wallet,
  FileText,
  PiggyBank,
  CreditCard,
  Briefcase,
  Info,
  Layers,
  Calculator,
};

export function KioskView() {
  const { services, branches, activeBranchId, createTicket } = useQueue();
  const [ticketData, setTicketData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltyCode, setLoyaltyCode] = useState('');
  const [loyaltySuccess, setLoyaltySuccess] = useState(false);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectService = (serviceId) => {
    const result = createTicket(serviceId);
    if (result.success) {
      setTicketData(result);
    }
  };

  const handleApplyLoyalty = (e) => {
    e.preventDefault();
    if (!loyaltyCode) return;
    setLoyaltySuccess(true);
    setTimeout(() => {
      // Pick first active service as VIP
      const srv = services.find((s) => s.id === 'srv-credit') || services[0];
      const result = createTicket(srv.id, true, `Sodiq Mijoz (${loyaltyCode})`);
      setShowLoyaltyModal(false);
      setLoyaltySuccess(false);
      setLoyaltyCode('');
      if (result.success) {
        setTicketData(result);
      }
    }, 1200);
  };

  const formattedTime = currentTime.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const generalServices = services.filter(
    (s) => s.category !== 'accounting' && s.id !== 'srv-corp' && s.id !== 'srv-accounting'
  );
  const accountingServices = services.filter(
    (s) => s.category === 'accounting' || s.id === 'srv-corp' || s.id === 'srv-accounting'
  );

  const renderServiceCard = (service) => {
    const IconComponent = ICON_MAP[service.icon] || Info;

    return (
      <button
        key={service.id}
        onClick={() => handleSelectService(service.id)}
        disabled={!service.active}
        className={`group flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
          service.bgClass || 'bg-slate-50 border-slate-100'
        }`}
      >
        {/* Icon box */}
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
            service.iconBg || 'bg-blue-100 text-blue-600'
          }`}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Service Name */}
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
            {service.name}
          </div>
          {service.id === 'srv-corp' && (
            <div className="text-[11px] text-slate-500 font-normal">uchun</div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-3 sm:p-6 bg-slate-950">
      
      {/* Tablet Device Frame (matching 1-rasm) */}
      <div className="w-full max-w-2xl bg-white text-slate-900 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border-[10px] border-slate-850 p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[780px]">
        
        {/* Tablet Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          {/* Company Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black">
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black tracking-tight uppercase text-slate-900">
                Company
              </div>
              <div className="text-[10px] font-semibold text-slate-400 tracking-wider">
                Logo
              </div>
            </div>
          </div>

          {/* Time & Branch */}
          <div className="text-right">
            <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">
              {formattedTime}
            </div>
            <div className="text-[11px] font-medium text-slate-400">
              {activeBranch?.name}
            </div>
          </div>
        </div>

        {/* Welcome Headline */}
        <div className="mb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Tashrifingiz uchun rahmat!
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
            Iltimos, kerakli xizmatni tanlang
          </p>
        </div>

        {/* 2-Section Grouped Layout */}
        <div className="my-auto space-y-4">
          
          {/* Section 1: Barcha xizmatlar (Jismoniy shaxslar) */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20"></span>
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-800">
                  Barcha xizmatlar (Jismoniy shaxslar)
                </h2>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {generalServices.length} ta xizmat
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {generalServices.map(renderServiceCard)}
            </div>
          </div>

          {/* Section 2: Buxgalteriya va Yuridik shaxslar */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20"></span>
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-800">
                  Buxgalteriya va Yuridik shaxslar
                </h2>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {accountingServices.length} ta xizmat
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {accountingServices.map(renderServiceCard)}
            </div>
          </div>

        </div>

        {/* Bottom Banner: Loyallik va Bonuslar (matching 1-rasm) */}
        <div className="mt-6">
          <button
            onClick={() => setShowLoyaltyModal(true)}
            className="w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-[0.99] text-left"
          >
            {/* QR icon */}
            <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0 backdrop-blur-xs">
              <QrCode className="w-7 h-7 text-white" />
            </div>

            {/* Banner Text */}
            <div className="flex-1 min-w-0">
              <div className="text-base sm:text-lg font-black tracking-tight">
                Loyallik va Bonuslar
              </div>
              <div className="text-xs text-white/90 font-medium">
                Loyallik QR-kodini skanerlash
              </div>
              <div className="text-[11px] text-white/80">
                Bonuslarni to‘plang va ishlating
              </div>
            </div>
          </button>
        </div>

      </div>

      {/* Loyalty / QR Scanner Modal */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white relative">
            <button
              onClick={() => setShowLoyaltyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/30">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold">Loyallik QR-kodini skanerlang</h3>
              <p className="text-xs text-slate-400">
                Kameraga QR-kodni ko‘rsating yoki karta/telefon raqamingizni kiriting
              </p>
            </div>

            {loyaltySuccess ? (
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                <div className="font-bold text-emerald-300">VIP Mijoz Tasdiqlandi!</div>
                <div className="text-xs text-slate-300">
                  Ustuvor navbat cheki chiqarilmoqda...
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplyLoyalty} className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center bg-slate-950/60">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <span className="text-xs text-slate-400">
                    Kamera faol: QR-kod avtomatik taniladi
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Yoki Sodiqlik kartasi / Telefon raqami:
                  </label>
                  <input
                    type="text"
                    value={loyaltyCode}
                    onChange={(e) => setLoyaltyCode(e.target.value)}
                    placeholder="Masalan: +998 90 123-45-67 yoki VIP-884"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer hover:opacity-95"
                  >
                    Tasdiqlash & Ustuvor Navbat Olish
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLoyaltyModal(false)}
                    className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs sm:text-sm hover:bg-slate-700 cursor-pointer"
                  >
                    Yopish
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Xprinter Thermal Receipt Modal */}
      {ticketData && (
        <ThermalTicketModal ticketData={ticketData} onClose={() => setTicketData(null)} />
      )}

    </div>
  );
}
