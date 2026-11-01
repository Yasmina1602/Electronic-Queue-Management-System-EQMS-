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
  User,
  Phone,
  UserCheck,
  RefreshCw,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function KioskView() {
  const { services, branches, activeBranchId, createTicket, registerClient, registeredClients } = useQueue();
  const [ticketData, setTicketData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Talab 6: Mijoz akkaunti ma'lumotlari
  const [clientName, setClientName] = useState(() => {
    try {
      return localStorage.getItem('qms_kiosk_client_name') || '';
    } catch {
      return '';
    }
  });
  const [clientPhone, setClientPhone] = useState(() => {
    try {
      return localStorage.getItem('qms_kiosk_client_phone') || '';
    } catch {
      return '';
    }
  });
  const [isClientRegistered, setIsClientRegistered] = useState(() => {
    try {
      return !!localStorage.getItem('qms_kiosk_client_name');
    } catch {
      return false;
    }
  });

  const [formError, setFormError] = useState('');
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

  // Mijoz ro'yxatdan o'tishi / Akkaunt ochishi (Talab 6)
  const handleClientRegister = (e) => {
    if (e) e.preventDefault();
    if (!clientName.trim()) {
      setFormError('Iltimos, ism va familiyangizni kiriting!');
      return;
    }
    if (!clientPhone.trim() || clientPhone.trim().length < 7) {
      setFormError('Iltimos, to‘g‘ri telefon raqamingizni kiriting!');
      return;
    }

    setFormError('');
    registerClient(clientName.trim(), clientPhone.trim());
    try {
      localStorage.setItem('qms_kiosk_client_name', clientName.trim());
      localStorage.setItem('qms_kiosk_client_phone', clientPhone.trim());
    } catch {}
    setIsClientRegistered(true);
  };

  // Yangi mijoz kelsa tozalash
  const handleResetClient = () => {
    setClientName('');
    setClientPhone('');
    setIsClientRegistered(false);
    try {
      localStorage.removeItem('qms_kiosk_client_name');
      localStorage.removeItem('qms_kiosk_client_phone');
    } catch {}
  };

  // Kartani bosganda chipta olish (Mijoz nomidan boradi - Talab 6)
  const handleServiceClick = (service, isVip = false) => {
    if (isProcessing) return;

    // Agar mijoz hali o'z ma'lumotlarini kiritmagan bo'lsa, avval ro'yxatdan o'tishni talab qiladi
    if (!isClientRegistered || !clientName.trim()) {
      setFormError('Iltimos, avval ismingiz va telefoningizni kiritib tasdiqlang!');
      return;
    }

    setIsProcessing(true);
    setSelectedServiceId(service.id);

    setTimeout(() => {
      const res = createTicket(service.id, isVip, clientName.trim(), clientPhone.trim());
      if (res.success) {
        setTicketData(res);
      }
      setIsProcessing(false);
      setSelectedServiceId(null);
    }, 350);
  };

  const formattedTime = currentTime.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-3 sm:p-6 bg-slate-100/90 text-slate-900 font-sans">
      
      {/* Tablet Device Frame - Oq va To'q Yashil */}
      <div className="w-full max-w-2xl bg-white text-slate-900 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(6,78,59,0.22)] border-[8px] border-emerald-950/10 p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[760px] my-auto">
        
        {/* Tablet Top Header (Faqat brend va soat, xavfsiz va toza) */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-900 to-emerald-700 text-white flex items-center justify-center font-black shadow-md shadow-emerald-900/20">
              <Layers className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black tracking-tight text-emerald-950 uppercase">
                ELEKTRON NAVBAT
              </div>
              <div className="text-[10px] font-bold text-emerald-700 tracking-wider">
                MIJOZ RO‘YXATGA YOZILISH TERMINALI
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-emerald-950 font-sans tracking-tight">
              {formattedTime}
            </div>
            <div className="text-xs font-semibold text-emerald-700/80">
              {activeBranch?.name || 'Asosiy Bosh Filial'}
            </div>
          </div>
        </div>

        {/* Hero Title & Client Account Area (Talab 6) */}
        <div className="my-auto flex flex-col justify-center space-y-5">
          
          {/* Akkaunt holati yoki Ro'yxatdan o'tish formasi */}
          {!isClientRegistered ? (
            <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <h2 className="text-base sm:text-lg font-black text-emerald-950">
                  Mijoz sifatida ro‘yxatdan o‘tish (Akkaunt ochish)
                </h2>
              </div>
              <p className="text-xs text-slate-600 mb-4 font-medium">
                Iltimos, navbat olish uchun kerakli ma‘lumotlaringizni kiriting. Navbatingiz o‘z nomingizdan qayd etiladi va xodimlar buni ko‘ra oladi.
              </p>

              <form onSubmit={handleClientRegister} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-950 mb-1">
                      F.I.Sh (Ismingiz va Familiyangiz):
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Masalan: Sardor Usmonov"
                        className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-xs font-semibold text-slate-900 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-950 mb-1">
                      Telefon Raqamingiz:
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-xs font-semibold text-slate-900 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {formError && (
                  <p className="text-xs font-bold text-red-600 animate-shake">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Ma‘lumotlarni tasdiqlash va Xizmat tanlash</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-emerald-50/80 border-2 border-emerald-400 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Mijoz akkaunti:</div>
                  <div className="text-sm font-black text-emerald-950 flex items-center gap-2">
                    <span>{clientName}</span>
                    <span className="text-xs text-emerald-700 font-bold font-mono">({clientPhone})</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleResetClient}
                title="Boshqa mijoz kiritish"
                className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 text-[11px] font-bold text-emerald-900 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                <span>O‘zgartirish</span>
              </button>
            </div>
          )}

          {/* Sarlavha */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Kerakli Xizmatni Tanlang
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight leading-tight">
              Qaysi xizmat turidan foydalanasiz?
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Tugmani bosing — chiptangiz o‘z nomingizdan chop etiladi
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

              <div className="mt-6">
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
                  Chipta olish
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

              <div className="mt-6">
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
                  Chipta olish
                </span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

          </div>

          {/* Bottom Banner: Loyallik va VIP Navbat */}
          <div
            onClick={() => setShowVipModal(true)}
            className="w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white p-3.5 sm:p-4 rounded-2xl flex items-center justify-between shadow-md cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  Loyallik va VIP Imtiyozli Navbat
                </div>
                <div className="text-[11px] text-emerald-100 font-medium">
                  VIP kartangiz yoki QR-kod orqali imtiyozli navbatga yozilish
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-200" />
          </div>
        </div>

        {/* Footer: Faqat xavfsizlik kafolati (Talab 5: Xodimlar kirishi butunlay olib tashlandi!) */}
        <div className="pt-4 border-t border-emerald-100 flex items-center justify-center text-xs text-slate-500">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Xavfsiz va markazlashgan mijozlar navbat tizimi</span>
          </div>
        </div>

      </div>

      {/* Modal: VIP / Loyalty Registration */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-emerald-700">
            <h3 className="text-xl font-black text-emerald-950 mb-2">
              VIP / Imtiyozli Navbat
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              VIP karta raqamingizni kiriting. Navbatingiz birinchi o‘rinda chaqiriladi.
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
                  const vName = vipCardInput || clientName || 'VIP Mijoz';
                  handleServiceClick(xizmatlarService, true);
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

      {/* Modal: Thermal Ticket Modal (Chekda chipta raqami va mijoz ismi chiqadi) */}
      {ticketData && (
        <ThermalTicketModal
          ticketData={ticketData}
          onClose={() => setTicketData(null)}
        />
      )}

    </div>
  );
}
