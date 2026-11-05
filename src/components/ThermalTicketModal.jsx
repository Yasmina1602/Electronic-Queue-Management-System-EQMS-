import React, { useEffect, useState } from 'react';
import { Printer, CheckCircle2, Clock, Users, X, Share2 } from 'lucide-react';

export function ThermalTicketModal({ ticketData, onClose, lang = 'uz' }) {
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(10);

  useEffect(() => {
    if (!ticketData) return;
    const interval = setInterval(() => {
      setAutoCloseSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ticketData, onClose]);

  if (!ticketData) return null;

  const { ticket, service, branch, waitingAhead, estWaitTimeMin } = ticketData;
  const formattedDate = new Date(ticket.createdAt).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = new Date(ticket.createdAt).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        
        {/* Virtual Xprinter Slot graphic */}
        <div className="w-full max-w-[320px] bg-slate-900 border-2 border-slate-700 rounded-t-2xl p-3 shadow-2xl flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Xprinter XP-58 / 80mm Thermal Printer
          </div>
          {/* Paper feed mouth */}
          <div className="w-11/12 h-2 bg-slate-950 rounded-full my-1.5 border border-slate-800 shadow-inner"></div>
        </div>

        {/* Paper Receipt with Slide-Down Animation */}
        <div
          id="thermal-receipt-printable"
          className="w-full max-w-[320px] bg-white text-slate-950 p-6 rounded-b-xl shadow-2xl animate-slide-down-ticket font-mono-receipt border-t-2 border-dashed border-slate-400"
          style={{ transformOrigin: 'top center' }}
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
            <div className="font-extrabold text-sm uppercase tracking-wide text-slate-900">
              {lang === 'uz' ? (branch.name || 'Markaziy Bosh Filial') : 'Центральный Главный Филиал'}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {lang === 'uz' ? (branch.address || 'Amir Temur shoh ko‘chasi, 1-uy') : 'ул. Амира Темура, 1'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-bold">
              {lang === 'uz' ? 'ELEKTRON NAVBAT TIZIMI' : 'ЭЛЕКТРОННАЯ СИСТЕМА ОЧЕРЕДИ'}
            </div>
          </div>

          {/* Ticket Number */}
          <div className="text-center my-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              {lang === 'uz' ? 'Sizning navbatingiz' : 'Ваш номер очереди'}
            </div>
            <div className="text-5xl font-extrabold tracking-tight text-emerald-950 my-1 font-sans">
              {ticket.ticketNumber}
            </div>
            <div className="text-xs font-bold text-emerald-800 px-2 line-clamp-1">
              {lang === 'uz'
                ? service.name
                : (service.id === 'srv-accounting' ? 'Бухгалтерия и юр. лица' : 'Банковские услуги')}
            </div>
            {/* Section 10: Anonim Sodiqlik QR va Referral Kod */}
            {(ticket.customerCode || ticket.referralCode) && (
              <div className="mt-2 pt-2 border-t border-dashed border-slate-300 text-[10px] space-y-1 bg-emerald-50/60 p-2 rounded-lg">
                {ticket.customerCode && (
                  <div className="flex justify-between items-center text-emerald-950 font-bold">
                    <span>{lang === 'uz' ? 'Sodiqlik QR-kod:' : 'Код лояльности:'}</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                      {ticket.customerCode}
                    </span>
                  </div>
                )}
                {ticket.referralCode && (
                  <div className="flex justify-between items-center text-emerald-900 font-bold">
                    <span>{lang === 'uz' ? 'Do‘stga ulashish:' : 'Промокод друга:'}</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                      {ticket.referralCode}
                    </span>
                  </div>
                )}
                <div className="text-[9px] text-slate-500 text-center mt-1">
                  {lang === 'uz'
                    ? 'Keyingi tashrifda 5%-15% chegirma yoki do‘stga bonus beradi'
                    : 'Скидка 5%-15% при следующем визите или бонус другу'}
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-xs border-b border-dashed border-slate-400 pb-3 mb-3 text-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{lang === 'uz' ? 'Sana & Vaqt:' : 'Дата и время:'}</span>
              <span className="font-bold">{formattedDate} {formattedTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {lang === 'uz' ? 'Sizdan oldin:' : 'Впереди вас:'}
              </span>
              <span className="font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-900">
                {waitingAhead} {lang === 'uz' ? 'kishi' : 'чел.'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {lang === 'uz' ? 'Taxminiy kutish:' : 'Ожидание:'}
              </span>
              <span className="font-bold text-emerald-800">
                ~{estWaitTimeMin} {lang === 'uz' ? 'daqiqa' : 'мин.'}
              </span>
            </div>
          </div>

          {/* Barcode & Warning */}
          <div className="text-center">
            {/* Simulated barcode graphic */}
            <div className="flex justify-center items-center gap-[2px] h-8 my-2 px-2 overflow-hidden">
              {[4, 2, 5, 2, 6, 3, 2, 4, 3, 5, 2, 3, 6, 2, 4, 2, 5, 3, 4, 2, 6, 3, 2, 5, 4, 2, 3, 6, 3].map(
                (w, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 h-full"
                    style={{ width: `${w * 0.7}px` }}
                  ></div>
                )
              )}
            </div>
            <div className="text-[10px] tracking-widest text-slate-500 font-bold mb-2">
              *{ticket.ticketNumber}*
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">
              {lang === 'uz'
                ? 'Iltimos, navbat raqamingiz katta monitorda chaqirilishini kuting!'
                : 'Пожалуйста, ожидайте вызова вашего номера на главном табло!'}
            </p>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="w-full max-w-[320px] flex items-center justify-between gap-2 mt-4">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {lang === 'uz' ? 'Xprinter Chop etish' : 'Печать талона'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-all flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
            {lang === 'uz' ? `Yopish (${autoCloseSeconds}s)` : `Закрыть (${autoCloseSeconds}с)`}
          </button>
        </div>

      </div>
    </div>
  );
}
