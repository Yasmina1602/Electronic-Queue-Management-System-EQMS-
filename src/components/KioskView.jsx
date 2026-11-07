import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { ThermalTicketModal } from './ThermalTicketModal';
import { api } from '../utils/api';
import {
  Layers,
  Calculator,
  Building2,
  Briefcase,
  QrCode,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Clock,
  ArrowRight,
  Globe,
  Tag,
  Gift,
  X,
} from 'lucide-react';

export function KioskView() {
  const { services, branches, activeBranchId, createTicket, tickets } = useQueue();
  const [ticketData, setTicketData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Language state (O'zbek / Rus tili - Section 3)
  const [lang, setLang] = useState('uz'); // 'uz' | 'ru'

  // Section 10: Optional Anonymous QR / Loyalty / Referral
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltyCodeInput, setLoyaltyCodeInput] = useState('');
  const [appliedLoyalty, setAppliedLoyalty] = useState(null);
  const [loyaltyMessage, setLoyaltyMessage] = useState('');

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // Barcha faol bo'limlar (Superadmin qo'shgan yangi bo'limlar ham chiqadi)
  const activeServices = services.filter((s) => s.active !== false);

  const getServiceIcon = (srv) => {
    const nameLower = (srv.name || '').toLowerCase();
    const idLower = (srv.id || '').toLowerCase();
    if (nameLower.includes('buxg') || idLower.includes('acc') || srv.prefix === 'B') {
      return <Calculator className="w-8 h-8 text-white" />;
    }
    if (nameLower.includes('kassa') || nameLower.includes('valyuta')) {
      return <Briefcase className="w-8 h-8 text-white" />;
    }
    if (nameLower.includes('kredit') || nameLower.includes('ipoteka') || nameLower.includes('bank')) {
      return <Building2 className="w-8 h-8 text-white" />;
    }
    return <Layers className="w-8 h-8 text-white" />;
  };

  // Section 2: 1-bosishda navbat yaratish (Shaxsiy ma'lumot talab qilinmaydi!)
  const handleServiceClick = async (service, isVip = false) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setSelectedServiceId(service.id);

    try {
      const anonCode = appliedLoyalty?.customer_code || null;
      const refCode = appliedLoyalty?.referral_code || null;

      const res = await createTicket(service.id, isVip, anonCode, refCode);
      if (res.success) {
        setTicketData(res);
      }
    } catch (e) {
      console.error('Kiosk createTicket error:', e);
    } finally {
      setIsProcessing(false);
      setSelectedServiceId(null);
      // Reset applied loyalty after ticket issuance
      setAppliedLoyalty(null);
      setLoyaltyMessage('');
    }
  };

  // Verify anonymous loyalty code or friend referral code
  const handleVerifyLoyalty = async (e) => {
    e.preventDefault();
    const cleanCode = loyaltyCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    try {
      const res = await api.lookupCustomer(cleanCode);
      if (res.success && res.customer) {
        setAppliedLoyalty(res.customer);
        const visits = res.customer.visits_count || 1;
        const disc = res.customer.discount_percent || 0;
        const bonus = res.customer.bonus_balance || 0;
        setLoyaltyMessage(
          lang === 'uz'
            ? `✓ Kod tasdiqlandi! Sizning tashrifingiz: ${visits}-marta. Chegirma: ${disc}%, Bonus: ${bonus} so‘m.`
            : `✓ Код подтвержден! Ваш визит: ${visits}-й. Скидка: ${disc}%, Бонус: ${bonus} сум.`
        );
        setTimeout(() => {
          setShowLoyaltyModal(false);
        }, 1400);
      } else {
        throw new Error(res?.error || 'Mijoz topilmadi');
      }
    } catch (err) {
      // Local fallback in case backend is offline
      if (cleanCode.startsWith('CUST-')) {
        const matchingTickets = tickets.filter(
          (t) => t.customerCode === cleanCode || t.clientIdentifier === cleanCode
        );
        const visits = Math.max(matchingTickets.length, 1);
        const disc = visits >= 10 ? 15 : visits >= 5 ? 10 : visits >= 3 ? 5 : 0;
        const fallbackCustomer = {
          customer_code: cleanCode,
          visits_count: visits,
          discount_percent: disc,
          bonus_balance: 0,
        };
        setAppliedLoyalty(fallbackCustomer);
        setLoyaltyMessage(
          lang === 'uz'
            ? `✓ Kod tasdiqlandi! Sizning tashrifingiz: ${visits}-marta. Chegirma: ${disc}%.`
            : `✓ Код подтвержден! Ваш визит: ${visits}-й. Скидка: ${disc}%.`
        );
        setTimeout(() => {
          setShowLoyaltyModal(false);
        }, 1400);
      } else if (cleanCode.startsWith('REF-')) {
        setAppliedLoyalty({ referral_code: cleanCode });
        setLoyaltyMessage(
          lang === 'uz'
            ? `✓ Do‘st kodi (${cleanCode}) biriktirildi!\nXizmat yakunlangach bonus hisoblanadi.`
            : `✓ Промокод друга (${cleanCode}) применен!\nБонус будет начислен после визита.`
        );
        setTimeout(() => {
          setShowLoyaltyModal(false);
        }, 1400);
      } else {
        setLoyaltyMessage(
          lang === 'uz'
            ? '✗ Noto‘g‘ri kod! Kod chekdagi "CUST-" yoki "REF-" bilan boshlanishi kerak.'
            : '✗ Неверный код! Код должен начинаться с "CUST-" или "REF-".'
        );
      }
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-3 sm:p-6 bg-slate-100/90 text-slate-900 font-sans">
      
      {/* Tablet Device Frame - Oq va To'q Yashil */}
      <div className="w-full max-w-2xl bg-white text-slate-900 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(6,78,59,0.22)] border-[8px] border-emerald-950/10 p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[760px] my-auto">
        
        {/* Tablet Top Header (Brend, Til o'zgartirgich, Soat) */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-900 to-emerald-700 text-white flex items-center justify-center font-black shadow-md shadow-emerald-900/20">
              <Layers className="w-6 h-6 text-emerald-200" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black tracking-tight text-emerald-950 uppercase">
                ELEKTRON NAVBAT
              </div>
              <div className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                {lang === 'uz' ? 'Mijozlar Kioski' : 'Клиентский Киоск'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-xl p-1 text-xs font-bold">
              <button
                onClick={() => setLang('uz')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'uz' ? 'bg-emerald-800 text-white shadow-xs' : 'text-emerald-900 hover:text-emerald-700'
                }`}
              >
                O‘zbek
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'ru' ? 'bg-emerald-800 text-white shadow-xs' : 'text-emerald-900 hover:text-emerald-700'
                }`}
              >
                Русский
              </button>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-emerald-950 font-sans tracking-tight">
                {formattedTime}
              </div>
              <div className="text-xs font-semibold text-emerald-700/80">
                {lang === 'uz' ? (activeBranch?.name || 'Markaziy Bosh Filial') : 'Центральный Главный Филиал'}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Title Area - Section 2 talabi: Mijoz faqat xizmatni tanlaydi */}
        <div className="my-auto flex flex-col justify-center space-y-6">
          
          {/* Active Loyalty Tag indicator if customer scanned code */}
          {appliedLoyalty && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-700" />
                <span className="font-bold text-emerald-950">
                  {loyaltyMessage}
                </span>
              </div>
              <button
                onClick={() => {
                  setAppliedLoyalty(null);
                  setLoyaltyMessage('');
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              {lang === 'uz' ? 'Kerakli Xizmatni Tanlang' : 'Выберите нужную услугу'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight leading-tight">
              {lang === 'uz' ? 'Qaysi xizmat turidan foydalanasiz?' : 'Какую услугу вы хотите получить?'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              {lang === 'uz'
                ? 'Tugmani bosing — navbat chekingiz avtomatik tarzda chop etiladi'
                : 'Нажмите кнопку — талон очереди будет напечатан автоматически'}
            </p>
          </div>

          {/* Faol Bo'limlar Kartalari (Superadmin qo'shgan yangi bo'limlar ham bu yerda chiqadi) */}
          <div className={`grid gap-4 sm:gap-5 ${
            activeServices.length <= 1
              ? 'grid-cols-1 max-w-lg mx-auto w-full'
              : activeServices.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {activeServices.map((service) => {
              const waitingCount = tickets.filter(
                (t) => t.branchId === activeBranchId && t.serviceId === service.id && t.status === 'WAITING'
              ).length;
              const isSelected = selectedServiceId === service.id;

              return (
                <button
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  disabled={isProcessing}
                  className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border-2 transition-all duration-300 text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-emerald-200/90 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30 hover:border-emerald-700 hover:from-white hover:to-emerald-100/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-800/25 group-hover:scale-105 transition-transform">
                      {getServiceIcon(service)}
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-800 text-white shadow-xs">
                        {service.prefix || 'X'}
                      </span>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">
                        {waitingCount} {lang === 'uz' ? 'kutmoqda' : 'в очереди'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-2xl font-black text-emerald-950 group-hover:text-emerald-800 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {service.description || (lang === 'uz' ? 'Navbat olish uchun bosing' : 'Нажмите для получения талона')}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-emerald-200/70 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-emerald-700" />
                      {lang === 'uz' ? 'Chek chiqarish' : 'Получить талон'}
                    </span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Banner: Section 10 - Sodiqlik & Referral QR kodi */}
          <div
            onClick={() => {
              setLoyaltyMessage('');
              setShowLoyaltyModal(true);
            }}
            className="w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white p-3.5 sm:p-4 rounded-2xl flex items-center justify-between shadow-md cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  {lang === 'uz' ? 'Sodiqlik QR-kod yoki Do‘st kodi bormi?' : 'Есть карта лояльности или QR код?'}
                </div>
                <div className="text-[11px] text-emerald-100 font-medium">
                  {lang === 'uz'
                    ? 'Chegirma (5% - 15%) yoki referral bonusi olish uchun bosing'
                    : 'Нажмите для применения скидки (5% - 15%) или реферального бонуса'}
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-200" />
          </div>
        </div>

        {/* Footer: Xavfsizlik kafolati (Shaxsiy ma'lumot saqlanmaydi) */}
        <div className="pt-4 border-t border-emerald-100 flex items-center justify-center text-xs text-slate-500">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>
              {lang === 'uz'
                ? 'Anonim va xavfsiz navbat tizimi • Shaxsiy ma’lumotlar talab qilinmaydi'
                : 'Анонимная электронная очередь • Личные данные не требуются'}
            </span>
          </div>
        </div>

      </div>

      {/* Modal: Section 10 Loyalty / Referral QR lookup */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-emerald-700 animate-scale-up">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-black text-emerald-950 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-700" />
                {lang === 'uz' ? 'QR-kod / Sodiqlik / Do‘st kodi' : 'Карта лояльности / Промокод'}
              </h3>
              <button
                onClick={() => {
                  setShowLoyaltyModal(false);
                  setLoyaltyMessage('');
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              {lang === 'uz'
                ? 'Avvalgi tashrifingizdagi QR-kod raqamini yoki do‘stingiz yuborgan referral kodni kiriting:'
                : 'Введите код с предыдущего чека или реферальный промокод друга:'}
            </p>

            <form onSubmit={handleVerifyLoyalty}>
              <input
                type="text"
                autoFocus
                value={loyaltyCodeInput}
                onChange={(e) => setLoyaltyCodeInput(e.target.value)}
                placeholder="Masalan: CUST-D3A6F293 yoki REF-A1B2"
                className="w-full px-4 py-3 rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-sm font-bold uppercase tracking-wider mb-3 bg-emerald-50/50"
              />

              {loyaltyMessage && (
                <div className={`text-xs font-bold mb-3 p-3 rounded-xl border whitespace-pre-line leading-relaxed ${
                  loyaltyMessage.startsWith('✓') || loyaltyMessage.startsWith('Topildi')
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {loyaltyMessage}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoyaltyModal(false);
                    setLoyaltyMessage('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 text-xs cursor-pointer"
                >
                  {lang === 'uz' ? 'Yopish' : 'Закрыть'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 text-xs shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {appliedLoyalty
                    ? (lang === 'uz' ? 'Davom etish' : 'Продолжить')
                    : (lang === 'uz' ? 'Tasdiqlash' : 'Применить')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thermal Ticket Modal */}
      {ticketData && (
        <ThermalTicketModal
          ticketData={ticketData}
          onClose={() => setTicketData(null)}
          lang={lang}
        />
      )}

    </div>
  );
}
