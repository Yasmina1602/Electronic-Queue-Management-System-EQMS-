import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  CameraOff,
} from 'lucide-react';

export function KioskView() {
  const { services, branches, activeBranchId, createTicket, tickets, loyaltyTiers = [] } = useQueue();
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

  // Barcha faol bo'limlar: Kioskda ketma-ketlik (display_order) bo'yicha tartiblangan!
  const activeServices = services
    .filter((s) => s.active !== false)
    .sort((a, b) => {
      const orderA = Number(a.display_order ?? a.displayOrder ?? 999);
      const orderB = Number(b.display_order ?? b.displayOrder ?? 999);
      if (orderA !== orderB) return orderA - orderB;
      return (Number(b.priority_weight) || 1) - (Number(a.priority_weight) || 1);
    });

  // Rus va O'zbek tillari uchun xizmat nomi va tavsifi tarjimasi
  const getLocalizedServiceName = (service) => {
    if (lang === 'uz') return service.name;
    if (service.name_ru) return service.name_ru;
    const nameLower = (service.name || '').toLowerCase();
    if (nameLower.includes('buxg') || service.prefix === 'B') return 'Бухгалтерия и юр. лица';
    if (nameLower.includes('it') || nameLower.includes('dastur') || service.prefix === 'I') return 'IT-услуги и техподдержка';
    if (nameLower.includes('kredit')) return 'Кредитование и ипотека';
    if (nameLower.includes('kassa')) return 'Касса и валютные операции';
    if (nameLower.includes('xizmat') || service.prefix === 'X') return 'Общие банковские услуги';
    return service.name;
  };

  const getLocalizedServiceDescription = (service) => {
    if (lang === 'uz') return service.description || 'Navbat olish uchun bosing';
    if (service.description_ru) return service.description_ru;
    const nameLower = (service.name || '').toLowerCase();
    if (nameLower.includes('buxg') || service.prefix === 'B') return 'Бухгалтерские услуги, сверка счетов и отчетность';
    if (nameLower.includes('it') || service.prefix === 'I') return 'IT, программное обеспечение, компьютеры и настройка';
    if (nameLower.includes('kredit')) return 'Потребительские кредиты, ипотека и консультации';
    if (nameLower.includes('kassa')) return 'Платежи, обмен валюты и кассовые операции';
    if (nameLower.includes('xizmat') || service.prefix === 'X') return 'Касса, кредиты, вклады, банковские карты';
    return 'Нажмите для получения талона электронной очереди';
  };

  const activeTiersList = loyaltyTiers.filter((t) => t.active !== false);
  const minDiscount = activeTiersList.length > 0 ? Math.min(...activeTiersList.map((t) => Number(t.discount_percent) || 5)) : 5;
  const maxDiscount = activeTiersList.length > 0 ? Math.max(...activeTiersList.map((t) => Number(t.discount_percent) || 15)) : 15;

  const getServiceIcon = (srv) => {
    const nameLower = (srv.name || '').toLowerCase();
    const idLower = (srv.id || '').toLowerCase();
    const iconClass = "w-6 h-6 sm:w-7 sm:h-7 text-white";
    if (nameLower.includes('buxg') || idLower.includes('acc') || srv.prefix === 'B') {
      return <Calculator className={iconClass} />;
    }
    if (nameLower.includes('kassa') || nameLower.includes('valyuta')) {
      return <Briefcase className={iconClass} />;
    }
    if (nameLower.includes('kredit') || nameLower.includes('ipoteka') || nameLower.includes('bank')) {
      return <Building2 className={iconClass} />;
    }
    return <Layers className={iconClass} />;
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

  const [scanningCamera, setScanningCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setScanningCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const scan = async () => {
          if (!streamRef.current) return;
          try {
            if (videoRef.current && videoRef.current.readyState === 4) {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const val = (barcodes[0].rawValue || barcodes[0].displayValue || '').trim();
                if (val) {
                  stopCamera();
                  setLoyaltyCodeInput(val);
                  verifyLoyaltyCode(val);
                  return;
                }
              }
            }
          } catch (e) {
            // davom etadi
          }
          requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      stopCamera();
      setLoyaltyMessage(
        lang === 'uz'
          ? 'ℹ Kameraga ulanib bo‘lmadi. Kodni quyida kiritishingiz mumkin.'
          : 'ℹ Камера недоступна. Введите код вручную.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanningCamera(false);
  };

  // Verify anonymous loyalty code or friend referral code
  const verifyLoyaltyCode = async (rawCode) => {
    const inputVal = (rawCode || loyaltyCodeInput).trim().toUpperCase();
    if (!inputVal) return;

    const fullCode = !inputVal.startsWith('CUST-') && !inputVal.startsWith('REF-')
      ? `CUST-${inputVal}`
      : inputVal;

    try {
      const res = await api.lookupCustomer(inputVal);
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
        // Oyna avtomatik o'chmaydi — foydalanuvchi "Davom etish" yoki "Yopish" tugmasini bosguncha turaveradi
      } else {
        throw new Error(res?.error || 'Mijoz topilmadi');
      }
    } catch (err) {
      // Local fallback in case backend is offline
      let storedVisits = Number(localStorage.getItem(`loyalty_visits_${fullCode}`)) || 1;
      storedVisits += 1;
      localStorage.setItem(`loyalty_visits_${fullCode}`, storedVisits);

      const disc = storedVisits >= 10 ? 15 : storedVisits >= 5 ? 10 : storedVisits >= 3 ? 5 : 0;
      const fallbackCustomer = {
        customer_code: fullCode,
        visits_count: storedVisits,
        discount_percent: disc,
        bonus_balance: 0,
      };
      setAppliedLoyalty(fallbackCustomer);
      setLoyaltyMessage(
        lang === 'uz'
          ? `✓ Kod tasdiqlandi! Sizning tashrifingiz: ${storedVisits}-marta. Chegirma: ${disc}%.`
          : `✓ Код подтвержден! Ваш визит: ${storedVisits}-й. Скидка: ${disc}%.`
      );
    }
  };

  const handleVerifyLoyalty = (e) => {
    e.preventDefault();
    verifyLoyaltyCode(loyaltyCodeInput);
  };

  const handleOpenLoyaltyModal = () => {
    setLoyaltyCodeInput(''); // Oldingi kiritilgan kodni har safar ochganda tozalaydi!
    setLoyaltyMessage('');
    setShowLoyaltyModal(true);
  };

  const handleCloseLoyaltyModal = () => {
    stopCamera();
    setShowLoyaltyModal(false);
    setLoyaltyCodeInput('');
    setLoyaltyMessage('');
  };

  const latestCustomerCode = tickets.find((t) => t.customerCode)?.customerCode || null;

  const formattedTime = currentTime.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-3 sm:p-6 bg-slate-100/90 text-slate-900 font-sans">
      
      {/* Tablet Device Frame - Oq va To'q Yashil */}
      <div className="w-full max-w-2xl bg-white text-slate-900 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(6,78,59,0.22)] border-[8px] border-emerald-950/10 p-5 sm:p-7 flex flex-col justify-between relative min-h-[720px] my-auto">
        
        {/* Tablet Top Header (Brend, Til o'zgartirgich, Soat) */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-900 to-emerald-700 text-white flex items-center justify-center font-black shadow-md shadow-emerald-900/20 shrink-0">
              <Layers className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black tracking-tight text-emerald-950 uppercase leading-none">
                ELEKTRON NAVBAT
              </div>
              <div className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                {lang === 'uz' ? 'Mijozlar Kioski' : 'Клиентский Киоск'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              <div className="text-xl font-black text-emerald-950 font-sans tracking-tight leading-none">
                {formattedTime}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700/80 mt-0.5">
                {lang === 'uz' ? (activeBranch?.name || 'Markaziy Bosh Filial') : 'Центральный Главный Филиал'}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Title Area - Section 2 talabi: Mijoz faqat xizmatni tanlaydi */}
        <div className="flex-1 flex flex-col justify-between py-2 space-y-3.5">
          
          {/* Active Loyalty Tag indicator if customer scanned code */}
          {appliedLoyalty && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-2.5 flex items-center justify-between text-xs animate-fade-in shrink-0">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-700" />
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

          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              {lang === 'uz' ? 'Kerakli Xizmatni Tanlang' : 'Выберите нужную услугу'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight leading-tight">
              {lang === 'uz' ? 'Qaysi xizmat turidan foydalanasiz?' : 'Какую услугу вы хотите получить?'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
              {lang === 'uz'
                ? 'Tugmani bosing — navbat chekingiz avtomatik tarzda chop etiladi'
                : 'Нажмите кнопку — талон очереди будет напечатан автоматически'}
            </p>
          </div>

          {/* Faol Bo'limlar Kartalari: 2 ustun x n satr, 1:1 kvadrat format */}
          <div className="overflow-y-auto max-h-[480px] sm:max-h-[520px] pr-1 -mr-1 overscroll-contain kiosk-scrollbar">
            <div className={`grid gap-3 sm:gap-3.5 ${
              activeServices.length <= 1
                ? 'grid-cols-1 max-w-xs mx-auto w-full'
                : 'grid-cols-2 max-w-xl mx-auto w-full'
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
                    className={`group relative flex flex-col justify-between aspect-square p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 text-left shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-emerald-200/90 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30 hover:border-emerald-700 hover:from-white hover:to-emerald-100/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-800/20 group-hover:scale-105 transition-transform shrink-0">
                        {getServiceIcon(service)}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-800 text-white shadow-xs">
                          {service.prefix || 'X'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                          {waitingCount} {lang === 'uz' ? 'kutmoqda' : 'в очереди'}
                        </div>
                      </div>
                    </div>

                    <div className="my-auto py-1">
                      <h3 className="text-base sm:text-lg font-black text-emerald-950 group-hover:text-emerald-800 transition-colors line-clamp-1 leading-snug">
                        {getLocalizedServiceName(service)}
                      </h3>
                      <p className="text-[11px] sm:text-xs font-medium text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {getLocalizedServiceDescription(service)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/70 flex items-center justify-between text-[11px] sm:text-xs font-bold text-emerald-800 group-hover:text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                        {lang === 'uz' ? 'Chek chiqarish' : 'Получить талон'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Banner: Section 10 - Sodiqlik & Referral QR kodi */}
          <div
            onClick={handleOpenLoyaltyModal}
            className="w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white p-3 sm:p-3.5 rounded-2xl flex items-center justify-between shadow-md cursor-pointer hover:shadow-lg transition-all shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  {lang === 'uz' ? 'Sodiqlik QR-kod yoki Do‘st kodi bormi?' : 'Есть карта лояльности или промокод?'}
                </div>
                <div className="text-[11px] text-emerald-100 font-medium">
                  {lang === 'uz'
                    ? `Chegirma (${minDiscount}% - ${maxDiscount}%) yoki referral bonusi olish uchun bosing`
                    : `Скидка (${minDiscount}% - ${maxDiscount}%) или бонус при каждом визите`}
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-200 shrink-0" />
          </div>
        </div>

        {/* Footer: Xavfsizlik kafolati (Shaxsiy ma'lumot saqlanmaydi) */}
        <div className="pt-3 border-t border-emerald-100 flex items-center justify-center text-xs text-slate-500">
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
                onClick={handleCloseLoyaltyModal}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              {lang === 'uz'
                ? 'Avvalgi tashrifingizdagi QR-kod raqamini yoki do‘stingiz yuborgan referral kodni kiriting:'
                : 'Введите код с предыдущего чека или реферальный промокод друга:'}
            </p>

            {/* Kamera orqali tezkor skanerlash tugmasi */}
            <button
              type="button"
              onClick={scanningCamera ? stopCamera : startCamera}
              className={`w-full mb-3 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                scanningCamera
                  ? 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100'
                  : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
              }`}
            >
              {scanningCamera ? (
                <>
                  <CameraOff className="w-4 h-4 text-rose-600" />
                  <span>{lang === 'uz' ? 'Kamerani to‘xtatish' : 'Выключить камеру'}</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'uz' ? '📷 Kamera orqali tezkor skanerlash (QR)' : '📷 Быстро сканировать камерой'}</span>
                </>
              )}
            </button>

            {/* Kamera video oynasi */}
            {scanningCamera && (
              <div className="relative mb-3 rounded-2xl overflow-hidden border-2 border-emerald-600 bg-black aspect-video flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-dashed border-emerald-400 m-5 rounded-xl pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-3 py-1 rounded-full font-bold">
                  {lang === 'uz' ? 'Chekdagi QR-kodni ramkaga tuting' : 'Наведите QR-код на рамку'}
                </div>
              </div>
            )}

            {/* So'nggi chek kodi bo'lsa, tezkor 1-bosishda kiritish (Vaqt tejash uchun) */}
            {latestCustomerCode && !scanningCamera && (
              <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-medium">
                  {lang === 'uz' ? 'Tezkor kiritish:' : 'Быстрый ввод:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLoyaltyCodeInput(latestCustomerCode);
                    setLoyaltyMessage('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>{latestCustomerCode}</span>
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyLoyalty}>
              <div className="relative mb-1.5">
                <input
                  type="text"
                  autoFocus
                  value={loyaltyCodeInput}
                  onChange={(e) => setLoyaltyCodeInput(e.target.value)}
                  placeholder={lang === 'uz' ? 'Masalan: 17512C1B yoki 7B2A' : 'Например: 17512C1B или 7B2A'}
                  className="w-full px-4 py-3 rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-base font-black uppercase tracking-wider bg-emerald-50/50 pr-10 text-emerald-950 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal placeholder:text-xs"
                />
                {loyaltyCodeInput && (
                  <button
                    type="button"
                    onClick={() => setLoyaltyCodeInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500 mb-3 font-medium">
                {lang === 'uz'
                  ? '💡 "CUST-" yozish shart emas — faqat kod raqamini kiritsangiz kifoya (kamroq vaqt oladi).'
                  : '💡 Префикс "CUST-" не обязателен — достаточно ввести сам номер кода.'}
              </p>

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
                  onClick={handleCloseLoyaltyModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 text-xs cursor-pointer"
                >
                  {lang === 'uz' ? 'Yopish' : 'Закрыть'}
                </button>
                {appliedLoyalty ? (
                  <button
                    type="button"
                    onClick={handleCloseLoyaltyModal}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>{lang === 'uz' ? 'Davom etish (Xizmat tanlash)' : 'Продолжить'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 text-xs shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {lang === 'uz' ? 'Tasdiqlash' : 'Применить'}
                  </button>
                )}
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
