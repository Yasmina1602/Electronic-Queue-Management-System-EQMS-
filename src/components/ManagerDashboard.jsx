import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { TICKET_STATUS, STAFF_STATUS } from '../constants/initialData';
import {
  Clock,
  CheckCircle2,
  Users,
  Calendar,
  Star,
  ChevronDown,
  Info,
  TrendingUp,
  Sparkles,
  BarChart2,
  PieChart,
  X,
  Check,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  FileDown,
} from 'lucide-react';

export function ManagerDashboard() {
  const { branches, services, staff, tickets, activeBranchId, setActiveBranchId } = useQueue();
  const [selectedBranch, setSelectedBranch] = useState(activeBranchId);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('28.08.2024');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const currentBranch = branches.find((b) => b.id === selectedBranch) || branches[0];

  // Dynamic filtering based on branch and department (Xizmatlar / Buxgalteriya)
  const branchTickets = tickets.filter((t) => {
    if (t.branchId !== selectedBranch) return false;
    if (selectedDepartment !== 'ALL' && t.serviceId !== selectedDepartment) return false;
    return true;
  });

  // MBBT analitika ma'lumotlarini yuklab olish funksiyalari (Excel, CSV, PDF)
  const handleDownloadExcel = () => {
    window.open(`http://localhost:5000/api/reports/export/excel?branchId=${selectedBranch}`, '_blank');
    setShowExportMenu(false);
  };

  const handleDownloadCsv = () => {
    // Agar chiptalar mavjud bo'lsa, joriy filtrlangan ro'yxatni eksport qiladi
    if (!branchTickets || branchTickets.length === 0) {
      window.open(`http://localhost:5000/api/reports/export/csv?branchId=${selectedBranch}`, '_blank');
      setShowExportMenu(false);
      return;
    }

    const headers = [
      'Chipta_Raqami',
      'Xizmat_Turi',
      'Holati',
      'Operator_Xodim',
      'Oyna',
      'Kutish_Vaqti_Daqiqa',
      'Xizmat_Vaqti_Daqiqa',
      'Olingan_Vaqt',
      'Chaqirilgan_Vaqt',
      'Yakunlangan_Vaqt',
    ];

    const rows = branchTickets.map((t) => {
      const srv = services.find((s) => s.id === t.serviceId)?.name || 'Xizmatlar';
      const op = staff.find((s) => s.id === t.staffId);
      const opName = op ? op.name : 'Kutish zalida';
      const windowNum = t.windowNumber || op?.windowNumber || '-';
      const waitMin = t.calledAt && t.createdAt ? Math.round((t.calledAt - t.createdAt) / 60000) : 0;
      const servMin = t.completedAt && t.startedAt ? Math.round((t.completedAt - t.startedAt) / 60000) : 0;
      const createdStr = t.createdAt ? new Date(t.createdAt).toLocaleTimeString('uz-UZ') : '-';
      const calledStr = t.calledAt ? new Date(t.calledAt).toLocaleTimeString('uz-UZ') : '-';
      const completedStr = t.completedAt ? new Date(t.completedAt).toLocaleTimeString('uz-UZ') : '-';

      return [
        `"${t.ticketNumber}"`,
        `"${srv}"`,
        `"${t.status}"`,
        `"${opName}"`,
        `"${windowNum}"`,
        waitMin,
        servMin,
        `"${createdStr}"`,
        `"${calledStr}"`,
        `"${completedStr}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MBBT_navbatlar_analitikasi_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleDownloadPdf = () => {
    window.open(`http://localhost:5000/api/reports/export/pdf?branchId=${selectedBranch}`, '_blank');
    setShowExportMenu(false);
  };

  const waitingTickets = branchTickets.filter((t) => t.status === TICKET_STATUS.WAITING);
  const activeServingTickets = branchTickets.filter(
    (t) => t.status === TICKET_STATUS.CALLED || t.status === TICKET_STATUS.IN_SERVICE
  );
  const completedTickets = branchTickets.filter((t) => t.status === TICKET_STATUS.COMPLETED);

  // Real KPI calculations directly based on actual PostgreSQL database state
  const totalDisplayCount = branchTickets.length;
  const activeDisplayCount = waitingTickets.length + activeServingTickets.length;
  const completedDisplayCount = completedTickets.length;

  // Operatorlar bandligi (Talab: xodimlar bandlik tahlili)
  const operatorStaff = staff.filter(
    (s) => (s.role_id || s.roleId || s.role) === 'OPERATOR'
  );
  const totalOperators = operatorStaff.length || 1;
  const busyStaffCount = operatorStaff.filter((s) => s.status === STAFF_STATUS.BUSY).length;
  const pausedStaffCount = operatorStaff.filter((s) => s.status === STAFF_STATUS.PAUSED).length;
  const availableStaffCount = operatorStaff.filter(
    (s) =>
      s.status === STAFF_STATUS.AVAILABLE ||
      (!s.status && s.status !== STAFF_STATUS.BUSY && s.status !== STAFF_STATUS.PAUSED)
  ).length;

  const busyPercent = Math.round((busyStaffCount / totalOperators) * 100);
  const pausedPercent = Math.round((pausedStaffCount / totalOperators) * 100);
  const availablePercent = Math.max(0, 100 - busyPercent - pausedPercent);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b1329] text-slate-100 p-4 sm:p-6 space-y-6 font-sans">
      
      {/* Top Header & Interactive Filters (matching Image 2 & 3-rasm) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Navbatlar Tizimi Tahlili
            </h1>
            <p className="text-xs text-slate-400">Menejer boshqaruv va statistik tahlil paneli</p>
          </div>
        </div>

        {/* Filter Dropdowns (Filiallar, Bo'limlar, Xizmatlar, Sana, Search) */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs relative">
          
          {/* Filial (Yagona Markaziy Filial) */}
          <div className="flex items-center gap-1.5 bg-[#121c38] border border-slate-700/80 rounded-xl px-3 py-2">
            <span className="text-slate-400">Filial:</span>
            <span className="text-slate-200 font-bold">Markaziy Bosh Filial</span>
          </div>

          {/* Bo'limlar Dropdown (Faqat Barcha bo'limlar, Xizmatlar va Buxgalteriya) */}
          <div className="flex items-center gap-1.5 bg-[#121c38] border border-slate-700/80 rounded-xl px-3 py-2 hover:border-slate-500 transition-colors">
            <span className="text-slate-400">Bo‘limlar:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Barcha bo‘limlar</option>
              <option value="srv-general" className="bg-slate-900">Xizmatlar</option>
              <option value="srv-accounting" className="bg-slate-900">Buxgalteriya</option>
            </select>
          </div>

          {/* Date Picker Button & Popover */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 bg-[#121c38] hover:bg-[#1a284e] border border-slate-700/80 hover:border-cyan-500 rounded-xl px-3 py-2 text-slate-200 font-mono transition-all cursor-pointer shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{selectedDate}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Date Picker Popover */}
            {showDatePicker && (
              <div className="absolute top-full mt-2 right-0 z-50 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl w-64 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-white border-b border-slate-800 pb-2">
                  <span>Sanani tanlang</span>
                  <button onClick={() => setShowDatePicker(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  {['28.08.2024', 'Bugun (29.10.2026)', 'Kecha (28.10.2026)', 'Oxirgi 7 kun', 'Oxirgi 30 kun'].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDate(d);
                        setShowDatePicker(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                        selectedDate === d
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{d}</span>
                      {selectedDate === d && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analitika Ma'lumotlarini Yuklab Olish (Talab: MBBT jadvalida analitika ma'lumotlari saqlanadi, uni yuklab olib ko'rish yoki boshqa dasturga kiritib tahlil qilish) */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black px-3.5 py-2 rounded-xl transition-all shadow-md hover:shadow-cyan-900/40 cursor-pointer text-xs active:scale-95 border border-teal-500/30"
              title="MBBT analitika ma'lumotlarini yuklab olish"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yuklab olish</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {/* Export Menu Popover */}
            {showExportMenu && (
              <div className="absolute top-full mt-2 right-0 z-50 bg-[#0d162d] border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl w-80 space-y-2.5 animate-fade-in backdrop-blur-md">
                <div className="flex justify-between items-center text-xs font-black text-white border-b border-slate-800 pb-2 px-1">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Download className="w-3.5 h-3.5" />
                    MBBT Analitikasini Yuklab Olish
                  </span>
                  <button
                    onClick={() => setShowExportMenu(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 px-1 leading-relaxed">
                  PostgreSQL MBBT bazasida saqlangan barcha navbatlar va kutish vaqtlari analitikasini yuklab oling:
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleDownloadExcel}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/90 hover:bg-emerald-950 hover:border-emerald-500/50 border border-slate-700 text-slate-200 hover:text-emerald-300 transition-all cursor-pointer text-left group shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-xs text-white group-hover:text-emerald-300">
                        Excel (.xlsx) Hisoboti
                      </div>
                      <div className="text-[10px] text-slate-400">
                        To‘liq jadvallar, operatorlar va vaqt formulalari
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadCsv}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/90 hover:bg-cyan-950 hover:border-cyan-500/50 border border-slate-700 text-slate-200 hover:text-cyan-300 transition-all cursor-pointer text-left group shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 group-hover:scale-105 transition-transform">
                      <FileDown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-xs text-white group-hover:text-cyan-300">
                        CSV (.csv) Ma'lumotlar
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Power BI, Tableau, Excel uchun xom baza (UTF-8)
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/90 hover:bg-rose-950 hover:border-rose-500/50 border border-slate-700 text-slate-200 hover:text-rose-300 transition-all cursor-pointer text-left group shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30 group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-xs text-white group-hover:text-rose-300">
                        PDF (.pdf) Hisoboti
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Chop etish va taqdimotlar uchun rasmiy hisobot
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Top 4 KPI Cards (matching 3-rasm) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Jami Mijozlar (2.698 ta, +30%) */}
        <div className="bg-[#111a33] border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Jami Mijozlar</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-cyan-400 text-[10px] font-bold">
              New Metrics
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalDisplayCount.toLocaleString()} ta</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              ↑ +30%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 mt-3">
            <div>
              <span className="font-bold text-white">266</span>
              <span className="text-[10px] text-slate-500 block">Total Mijozlar</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-cyan-400">12:45 min</span>
              <span className="text-[10px] text-slate-500 block">Avg wait time</span>
            </div>
          </div>
        </div>

        {/* Card 2: O'rtacha Kutish Vaqti (12:45 min) */}
        <div className="bg-[#111a33] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="text-xs text-slate-400">O‘rtacha Kutish Vaqti</div>
          <div className="flex items-center gap-3 my-2">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-3xl font-black text-white">12:45 min</span>
          </div>
          <div className="text-[11px] text-slate-400">Kutish vaqti me’yori: &lt;15 min</div>
        </div>

        {/* Card 3: Faol Navbatlar (48 ta) */}
        <div className="bg-[#111a33] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="text-xs text-slate-400">Faol Navbatlar</div>
          <div className="flex items-center gap-3 my-2">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-3xl font-black text-white">{activeDisplayCount} ta</span>
          </div>
          <div className="text-[11px] text-slate-400">Current active: {waitingTickets.length} kutmoqda</div>
        </div>

        {/* Card 4: Xizmat Ko'rsatilganlar (324 ta, Gain 80%) */}
        <div className="bg-[#111a33] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Xizmat Ko‘rsatilganlar</span>
            <span className="text-emerald-400 font-bold text-[10px]">Gain 80%</span>
          </div>
          <div className="flex items-center gap-3 my-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-3xl font-black text-white">{completedDisplayCount} ta</span>
          </div>
          <div className="text-[11px] text-slate-400">Completion rate: 98.4% muvaffaqiyatli</div>
        </div>

      </div>

      {/* Middle Row: Dual Line Chart + Bar Chart + Donut + Star Ratings (matching 3-rasm) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Kutish Vaqti Dinamikasi: Dual Line Chart (6 cols) */}
        <div className="lg:col-span-6 bg-[#111a33] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-extrabold text-white text-sm">Kutish Vaqti Dinamikasi</h3>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span> O‘rtacha kutish vaqti
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Maximum kutish vaqti
                </span>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              Kutish Bahosi ▾
            </span>
          </div>

          {/* SVG Wave Chart with Glowing Gradient & Max Peak Marker */}
          <div className="relative w-full h-48 my-3">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="amberGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>

              <line x1="0" y1="30" x2="500" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#1e293b" strokeDasharray="3 3" />

              <path
                d="M 0 150 Q 70 80, 130 110 T 260 70 T 380 90 T 500 110 L 500 170 L 0 170 Z"
                fill="url(#cyanArea)"
              />
              <path
                d="M 0 150 Q 70 80, 130 110 T 260 70 T 380 90 T 500 110"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
              />

              <path
                d="M 0 140 Q 60 70, 120 120 T 220 50 T 360 40 T 500 100"
                fill="none"
                stroke="url(#amberGlow)"
                strokeWidth="3"
              />

              <circle cx="220" cy="50" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
              <rect x="195" y="15" width="60" height="20" rx="6" fill="#000000" stroke="#f59e0b" strokeWidth="1" />
              <text x="202" y="29" fill="#f59e0b" fontSize="9" fontWeight="bold">
                Max 12:45
              </text>
            </svg>

            <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
              <span>02:00</span>
              <span>04:00</span>
              <span>06:00</span>
              <span>08:00</span>
              <span>10:00</span>
              <span>13:00</span>
              <span>15:00</span>
              <span>18:00</span>
              <span>20:00</span>
            </div>
          </div>
        </div>

        {/* Xizmatlar Bo'yicha Yuklama: Bar Chart (3 cols) */}
        <div className="lg:col-span-3 bg-[#111a33] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-extrabold text-white text-sm">Xizmatlar Bo‘yicha Yuklama</h3>
              <p className="text-[10px] text-slate-400">Peak demand areas</p>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Xizmat stat ▾
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-1.5 pt-6 pb-2 px-1">
            {services.map((srv, idx) => {
              const count = tickets.filter((t) => t.serviceId === srv.id).length;
              const heightPercent = Math.min(100, Math.max(25, count * 20 + 20));

              return (
                <div key={srv.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-cyan-600 to-teal-400 hover:brightness-125 transition-all cursor-pointer"
                    style={{ height: `${heightPercent}%` }}
                    title={`${srv.name}: ${count} ta navbat`}
                  ></div>
                  <span className="text-[8px] text-slate-400 truncate max-w-[32px]">{srv.prefix}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Xodimlar Bandligi: Donut Chart (3 cols) */}
        <div className="lg:col-span-3 bg-[#111a33] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-white text-sm">Xodimlar Bandligi</h3>
              <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded font-bold">
                {operatorStaff.length} operator
              </span>
            </div>
            
            <div className="relative w-28 h-28 mx-auto my-2 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  className="text-slate-800"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400"
                  strokeDasharray={`${Math.max(5, busyPercent)}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500"
                  strokeDasharray={`${Math.max(5, pausedPercent)}, 100`}
                  strokeDashoffset={`-${busyPercent}`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-base font-black text-white">{busyPercent}%</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">bandlik</div>
              </div>
            </div>
          </div>

          {/* Real Xodimlar holati statistikasi */}
          <div className="border-t border-slate-800/80 pt-2 space-y-1.5 text-[10px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Xizmatda (Band):</span>
              </span>
              <span className="font-bold text-white font-mono">{busyStaffCount} nafar ({busyPercent}%)</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Qabulga tayyor (Bo‘sh):</span>
              </span>
              <span className="font-bold text-white font-mono">{availableStaffCount} nafar ({availablePercent}%)</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Tanaffusda:</span>
              </span>
              <span className="font-bold text-white font-mono">{pausedStaffCount} nafar ({pausedPercent}%)</span>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Row: Navbatlar Holati Table (Full width - Mijozlar bahosi olib tashlandi) */}
      <div className="bg-[#111a33] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-white text-sm">Navbatlar Holati</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Jonli Monitoring
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Filtrlangan: <strong className="text-white">{branchTickets.length}</strong> ta navbat
          </span>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 text-[11px] border-b border-slate-800/80 sticky top-0 bg-[#111a33]">
              <tr>
                <th className="pb-2.5">Raqam</th>
                <th className="pb-2.5">Xizmat turi</th>
                <th className="pb-2.5">Holati</th>
                <th className="pb-2.5">Chipta vaqti</th>
                <th className="pb-2.5 text-right">Xodim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300 font-sans">
              {branchTickets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 font-medium">
                    Qidiruv bo‘yicha navbatlar topilmadi.
                  </td>
                </tr>
              ) : (
                branchTickets.slice(0, 15).map((t, idx) => {
                  const assignedStaff = staff.find((s) => s.id === (t.staffId || t.staff_id));
                  const srv = services.find((s) => s.id === t.serviceId);

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.status === TICKET_STATUS.CALLED
                              ? 'bg-cyan-400 animate-ping'
                              : t.status === TICKET_STATUS.IN_SERVICE
                              ? 'bg-emerald-400'
                              : t.status === TICKET_STATUS.COMPLETED
                              ? 'bg-slate-500'
                              : 'bg-amber-400'
                          }`}
                        ></span>
                        <span className="font-black text-white text-sm">{t.ticketNumber}</span>
                      </td>
                      <td className="py-2.5 text-slate-300">
                        {srv?.name || t.serviceName || 'Xizmat'}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === TICKET_STATUS.CALLED
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : t.status === TICKET_STATUS.IN_SERVICE
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : t.status === TICKET_STATUS.COMPLETED
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {t.status === TICKET_STATUS.CALLED
                            ? 'Chaqirildi'
                            : t.status === TICKET_STATUS.IN_SERVICE
                            ? 'Xizmatda'
                            : t.status === TICKET_STATUS.COMPLETED
                            ? 'Yakunlangan'
                            : 'Kutilmoqda'}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-400">
                        {new Date(t.createdAt).toLocaleTimeString('uz-UZ')}
                      </td>
                      <td className="py-2.5 text-right font-sans">
                        {assignedStaff ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold text-[11px]">
                            {assignedStaff.windowNumber || assignedStaff.window_number || '1'}-xodim
                            {assignedStaff.phone ? ` (tel: ${assignedStaff.phone})` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-medium">
                            {t.status === TICKET_STATUS.WAITING ? 'Kutish zalida' : 'Xodim biriktirilmagan'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
