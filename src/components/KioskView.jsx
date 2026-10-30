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
  ArrowLeft,
  ChevronRight,
  Lock,
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

export function KioskView({ onNavigateStaff }) {
  const { services, branches, activeBranchId, createTicket } = useQueue();
  const [selectedCategory, setSelectedCategory] = useState(null); // null = Main screen (2 categories), 'general' or 'accounting'
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

  // Auto-return to main categories after 40 seconds of inactivity on sub-service screens
  useEffect(() => {
    if (!selectedCategory) return;
    const idleTimer = setTimeout(() => {
      setSelectedCategory(null);
    }, 40000);
    return () => clearTimeout(idleTimer);
  }, [selectedCategory]);

  const handleSelectService = (serviceId) => {
    const result = createTicket(serviceId);
    if (result.success) {
      setTicketData(result);
      // Reset back to main screen after printing
      setTimeout(() => setSelectedCategory(null), 3500);
    }
  };

  const handleApplyLoyalty = (e) => {
    e.preventDefault();
    if (!loyaltyCode) return;
    setLoyaltySuccess(true);
    setTimeout(() => {
      const srv = services.find((s) => s.id === 'srv-credit') || services[0];
      const result = createTicket(srv.id, true, `Sodiq Mijoz (${loyaltyCode})`);
      setShowLoyaltyModal(false);
      setLoyaltySuccess(false);
      setLoyaltyCode('');
      if (result.success) {
        setTicketData(result);
        setTimeout(() => setSelectedCategory(null), 3500);
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

  const displayedServices =
    selectedCategory === 'accounting' ? accountingServices : generalServices;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-3 sm:p-6 bg-slate-950 text-slate-100">
      
      {/* Tablet Device Frame */}
      <div className="w-full max-w-2xl bg-white text-slate-900 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border-[10px] border-slate-850 p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[760px] my-auto">
        
        {/* Tablet Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          {/* Company Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-md">
              <Layers className="w-5 h-5 text-cyan-400" />
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

        {/* STEP 1: Main Category Selection (Barcha xizmatlar vs Buxgalteriya) */}
        {selectedCategory === null && (
          <div className="my-auto flex flex-col justify-center space-y-6 animate-fade-in">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/60 mb-2">
                Elektron Navbat Kioski
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Tashrifingiz uchun rahmat!
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mt-1.5 font-medium">
                Iltimos, kerakli xizmat bo‘limini tanlang
              </p>
            </div>

            {/* 2 Massive Premium Category Choice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              
              {/* Option 1: Barcha xizmatlar (Chakana / Jismoniy shaxslar) */}
              <button
                onClick={() => setSelectedCategory('general')}
                className="group relative flex flex-col justify-between p-6 rounded-3xl border-2 border-blue-200/70 hover:border-blue-500 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-cyan-50/60 hover:from-blue-100/80 hover:to-cyan-100/80 text-left transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                    <Layers className="w-8 h-8 text-white" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-600 text-white shadow-xs">
                    {generalServices.length} xizmat
                  </span>
                </div>

                <div className="mt-8">
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                    Barcha xizmatlar
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1.5 line-clamp-2">
                    Kassa, Kreditlar, Omonatlar, Kartalar va ma’lumotlar
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-blue-200/50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                  <span>Xizmatlarni tanlash</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: Buxgalteriya (Buxgalteriya va Yuridik shaxslar) */}
              <button
                onClick={() => setSelectedCategory('accounting')}
                className="group relative flex flex-col justify-between p-6 rounded-3xl border-2 border-amber-200/70 hover:border-amber-500 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-yellow-50/60 hover:from-amber-100/80 hover:to-orange-100/80 text-left transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                    <Calculator className="w-8 h-8 text-white" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500 text-white shadow-xs">
                    {accountingServices.length} xizmat
                  </span>
                </div>

                <div className="mt-8">
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                    Buxgalteriya
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1.5 line-clamp-2">
                    Hisob-kitoblar, Soliq, To‘lov topshiriqlari va yuridik shaxslar
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-amber-200/50 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:text-amber-800">
                  <span>Xizmatlarni tanlash</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

            </div>
          </div>
        )}

        {/* STEP 2: Sub-services view for the selected category */}
        {selectedCategory !== null && (
          <div className="my-auto space-y-4 animate-fade-in">
            
            {/* Top Navigation Bar: Back Button + Category Toggle Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-extrabold border border-slate-200/80 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Bosh menyuga qaytish</span>
              </button>

              {/* Segmented Category Switcher */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedCategory('general')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === 'general'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Barcha xizmatlar ({generalServices.length})</span>
                </button>
                <button
                  onClick={() => setSelectedCategory('accounting')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === 'accounting'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Buxgalteriya ({accountingServices.length})</span>
                </button>
              </div>
            </div>

            {/* Headline for Selected Group */}
            <div className="px-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                {selectedCategory === 'accounting'
                  ? 'Buxgalteriya va Yuridik shaxslar'
                  : 'Barcha chakana xizmatlar'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Iltimos, kerakli operatsiyani bosing va navbat chekini oling
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayedServices.map((service) => {
                const IconComponent = ICON_MAP[service.icon] || Info;

                return (
                  <button
                    key={service.id}
                    onClick={() => handleSelectService(service.id)}
                    disabled={!service.active}
                    className={`group flex items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
                      service.bgClass || 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    {/* Icon box */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
                        service.iconBg || 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    {/* Service Name */}
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-base text-slate-900 leading-snug">
                        {service.name}
                      </div>
                      {service.description && (
                        <div className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                          {service.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Banner: Loyallik va Bonuslar (always present) */}
        <div className="mt-4">
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

      {/* Discrete footer for staff access */}
      <footer className="mt-3 text-center">
        <a
          href="/staff-portal-auth-88"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigateStaff) {
              onNavigateStaff();
            } else {
              window.location.href = '/staff-portal-auth-88';
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 px-3 rounded-full hover:bg-slate-900 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Xodimlar xizmati portali (/staff-portal-auth-88)</span>
        </a>
      </footer>

      {/* Thermal Ticket Modal */}
      {ticketData && (
        <ThermalTicketModal
          ticketData={ticketData}
          onClose={() => setTicketData(null)}
        />
      )}

      {/* Loyalty Modal */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowLoyaltyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold">VIP & Loyallik Dasturi</h3>
              <p className="text-xs text-slate-400">
                Mijoz ID yoki QR kod raqamingizni kiriting
              </p>
            </div>

            <form onSubmit={handleApplyLoyalty} className="space-y-3">
              <input
                type="text"
                placeholder="Masalan: VIP-7788"
                value={loyaltyCode}
                onChange={(e) => setLoyaltyCode(e.target.value)}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-cyan-400 focus:outline-none focus:border-cyan-500"
              />

              <button
                type="submit"
                disabled={!loyaltyCode || loyaltySuccess}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3 rounded-xl transition-all cursor-pointer disabled:opacity-40"
              >
                {loyaltySuccess ? 'Muvaffaqiyatli tasdiqlandi!' : 'Imtiyozli navbat olish'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
