import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, CheckCircle2, Clock, Users, X, Share2, QrCode } from 'lucide-react';

export function ThermalTicketModal({ ticketData, onClose, lang = 'uz' }) {
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(12);
  const [qrDataUrl, setQrDataUrl] = useState('');

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

  const { ticket, service, branch, waitingAhead, estWaitTimeMin } = ticketData || {};

  // Generate real, high-resolution scannable QR Code for anonymous loyalty
  useEffect(() => {
    const raw = ticket?.customerCode || ticket?.clientIdentifier;
    if (!raw) return;
    const code = String(raw).trim().toUpperCase();
    QRCode.toDataURL(code, {
      width: 140,
      margin: 1,
      color: {
        dark: '#022c22',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [ticket?.customerCode, ticket?.clientIdentifier]);

  if (!ticketData) return null;

  const formattedDate = new Date(ticket.createdAt).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = new Date(ticket.createdAt).toLocaleTimeString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getServiceName = () => {
    if (lang === 'uz') return service?.name || 'Xizmat';
    const nameLower = (service?.name || '').toLowerCase();
    if (nameLower.includes('buxg') || service?.prefix === 'B') return 'Бухгалтерия и юр. лица';
    if (nameLower.includes('it') || service?.prefix === 'I') return 'IT-услуги и техподдержка';
    if (nameLower.includes('kredit')) return 'Кредитование и ипотека';
    if (nameLower.includes('kassa')) return 'Касса и валютные операции';
    if (nameLower.includes('xizmat') || service?.prefix === 'X') return 'Общие банковские услуги';
    return service?.name || 'Услуга';
  };

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
              {lang === 'uz' ? (branch?.name || 'Markaziy Bosh Filial') : 'Центральный Главный Филиал'}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {lang === 'uz' ? (branch?.address || 'Amir Temur shoh ko‘chasi, 1-uy') : 'ул. Амира Темура, 1'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-bold">
              {lang === 'uz' ? 'ELEKTRON NAVBAT TIZIMI' : 'ЭЛЕКТРОННАЯ СИСТЕМА ОЧЕРЕДИ'}
            </div>
          </div>

          {/* Ticket Number */}
          <div className="text-center my-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              {lang === 'uz' ? 'Sizning navbatingiz' : 'Ваш номер очереди'}
            </div>
            <div className="text-5xl font-extrabold tracking-tight text-emerald-950 my-1 font-sans">
              {ticket.ticketNumber}
            </div>
            <div className="text-xs font-bold text-emerald-800 px-2 line-clamp-1">
              {getServiceName()}
            </div>

            {/* Section 10: Real Scannable QR Code Image */}
            {qrDataUrl && (
              <div className="mt-2.5 pt-2 border-t border-dashed border-slate-300 flex flex-col items-center">
                <div className="p-1.5 bg-white rounded-xl border border-slate-300 shadow-2xs">
                  <img
                    src={qrDataUrl}
                    alt={`QR-${ticket.customerCode}`}
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] font-black tracking-wider text-emerald-950 mt-1">
                  <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{String(ticket.customerCode || ticket.clientIdentifier || '').toUpperCase()}</span>
                </div>
                <div className="text-[9px] text-slate-500 text-center font-bold mt-0.5 leading-tight">
                  {lang === 'uz'
                    ? '📷 Keyingi tashrifda chegirma olish uchun ushbu QR-kodni kiosk kamerasiga ko‘rsating'
                    : '📷 Покажите этот QR-код камере киоска для скидки при следующем визите'}
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
            <div className="text-[10px] tracking-widest text-slate-500 font-bold mb-1">
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
