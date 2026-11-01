import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { TICKET_STATUS, STAFF_STATUS } from '../constants/initialData';
import {
  Users,
  CheckCircle2,
  Clock,
  Layers,
  UserPlus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Award,
  Coffee,
  X,
  Plus,
  Building,
  Check,
  Percent,
} from 'lucide-react';

export function AdminDashboard() {
  const {
    branches,
    activeBranchId,
    services,
    staff,
    tickets,
    addStaff,
    createTicket,
    resetToDemo,
    clearQueue,
  } = useQueue();

  const [notification, setNotification] = useState(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [filterService, setFilterService] = useState('ALL');

  // Form state for adding staff
  const [newName, setNewName] = useState('');
  const [newWindow, setNewWindow] = useState('');
  const [newServiceType, setNewServiceType] = useState('ALL');

  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const branchTickets = tickets.filter((t) => t.branchId === activeBranchId);
  const branchStaff = staff.filter((s) => s.branchId === activeBranchId);

  // Overall analytics
  const totalCompleted = branchTickets.filter((t) => t.status === TICKET_STATUS.COMPLETED).length;
  const totalWaiting = branchTickets.filter((t) => t.status === TICKET_STATUS.WAITING).length;
  const totalInService = branchTickets.filter(
    (t) => t.status === TICKET_STATUS.IN_SERVICE || t.status === TICKET_STATUS.CALLED
  ).length;

  // Average wait time
  let totalWaitMs = 0;
  let waitCount = 0;
  branchTickets.forEach((t) => {
    if (t.calledAt && t.createdAt) {
      totalWaitMs += t.calledAt - t.createdAt;
      waitCount++;
    }
  });
  const avgWaitMin = waitCount > 0 ? Math.round(totalWaitMs / waitCount / 60000) : 5;

  // Add staff handler
  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let authServices = ['srv-general', 'srv-accounting'];
    if (newServiceType === 'srv-general') authServices = ['srv-general'];
    if (newServiceType === 'srv-accounting') authServices = ['srv-accounting'];

    const res = addStaff({
      name: newName.trim(),
      windowNumber: newWindow.trim() || `${branchStaff.length + 1}`,
      branchId: activeBranchId,
      authorizedServiceIds: authServices,
    });

    if (res.success) {
      setNotification(`Yangi xodim ${newName} (${res.staff.windowNumber}-oyna) muvaffaqiyatli qo‘shildi!`);
      setTimeout(() => setNotification(null), 3500);
      setNewName('');
      setNewWindow('');
      setNewServiceType('ALL');
      setShowAddStaffModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header & Actions - OQ va TO'Q YASHIL */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-2 border-emerald-200 p-6 rounded-3xl shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                Admin & Boshqaruv
              </span>
              <span className="text-xs font-bold text-slate-500">
                {currentBranch?.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1 tracking-tight">
              Xodimlar Samaradorligi va Tizim Boshqaruvi
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Barcha operatorlar qabul qilgan mijozlar soni, o‘rtacha xizmat vaqti va yangi xodim qo‘shish
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Yangi xodim qo'shish tugmasi (Talab 2) */}
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md shadow-emerald-800/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yangi Xodim Qo‘shish</span>
            </button>

            {/* Navbatlarni tozalash */}
            <button
              onClick={() => {
                clearQueue();
                setNotification('Barcha navbatlar tozalandi!');
                setTimeout(() => setNotification(null), 3000);
              }}
              title="Navbatlarni tozalash"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Demo tiklash */}
            <button
              onClick={() => {
                resetToDemo();
                setNotification('Namunaviy ma‘lumotlar qayta tiklandi!');
                setTimeout(() => setNotification(null), 3000);
              }}
              title="Qayta tiklash"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div className="p-4 rounded-2xl bg-emerald-800 text-white font-bold text-xs shadow-lg animate-fade-in flex items-center gap-2 border border-emerald-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{notification}</span>
          </div>
        )}

        {/* 4 Summary Stat KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border-2 border-emerald-200 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-extrabold uppercase text-emerald-900">Faol Xodimlar</span>
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="text-3xl font-black text-emerald-950">{branchStaff.length} nafar</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1">
              Barcha xizmat oynalari biriktirilgan
            </div>
          </div>

          <div className="bg-white border-2 border-emerald-200 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-extrabold uppercase text-emerald-900">Xizmat Ko‘rsatildi</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="text-3xl font-black text-emerald-950">{totalCompleted} ta</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1">
              Bugungi muvaffaqiyatli yakunlangan
            </div>
          </div>

          <div className="bg-white border-2 border-emerald-200 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-extrabold uppercase text-emerald-900">Zalda Kutilmoqda</span>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-emerald-950">{totalWaiting} ta</div>
            <div className="text-[11px] font-semibold text-amber-700 mt-1">
              O‘rtacha kutish: ~{avgWaitMin} daqiqa
            </div>
          </div>

          <div className="bg-white border-2 border-emerald-200 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-extrabold uppercase text-emerald-900">Jarayonda (Qabulda)</span>
              <TrendingUp className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="text-3xl font-black text-emerald-950">{totalInService} ta</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1">
              Hozir oyna oldidagi mijozlar
            </div>
          </div>

        </div>

        {/* MAIN TABLE: Barcha xodimlar samaradorligi (Talab 2) */}
        <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-emerald-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-emerald-950 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-800" />
                Xodimlar Samaradorligi va Qabul Hisoboti
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Har bir xodimning bugun qabul qilgan mijozlar soni, xizmat ko‘rsatish vaqti va yuklama holati
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Filtr:</span>
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold bg-emerald-50 text-emerald-950 focus:outline-hidden"
              >
                <option value="ALL">Barcha xizmatlar</option>
                <option value="srv-general">Xizmatlar</option>
                <option value="srv-accounting">Buxgalteriya</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-950 text-white uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-2xl">Oyna</th>
                  <th className="p-3.5">Xodim F.I.Sh</th>
                  <th className="p-3.5">Holati</th>
                  <th className="p-3.5 text-center">Qabul Qilgan Mijozlar</th>
                  <th className="p-3.5 text-center">O‘rtacha Vaqt</th>
                  <th className="p-3.5">Biriktirilgan Bo‘lim</th>
                  <th className="p-3.5 text-right rounded-r-2xl">Samaradorlik (KPI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 text-slate-700">
                {branchStaff
                  .filter((s) => {
                    if (filterService === 'ALL') return true;
                    return s.authorizedServiceIds?.includes(filterService);
                  })
                  .map((s, idx) => {
                    const served = s.servedCountToday || 0;
                    const totalMin = s.totalServiceMinutes || 0;
                    const avgMin = served > 0 ? Math.round(totalMin / served) : 8;
                    const kpiScore = Math.min(100, Math.round((served / 30) * 100));

                    const isBusy = s.status === STAFF_STATUS.BUSY;
                    const isPaused = s.status === STAFF_STATUS.PAUSED;

                    return (
                      <tr key={s.id} className="hover:bg-emerald-50/60 transition-colors">
                        
                        {/* Oyna */}
                        <td className="p-3.5 font-black text-emerald-950 text-sm">
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300">
                            {s.windowNumber}-Oyna
                          </span>
                        </td>

                        {/* Xodim */}
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900 text-sm">{s.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{s.login || `OP-${s.windowNumber}`}</div>
                        </td>

                        {/* Holati */}
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${
                              isBusy
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : isPaused
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isBusy ? 'bg-emerald-600 animate-pulse' : isPaused ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            ></span>
                            {isBusy ? 'Band (Mijoz bilan)' : isPaused ? 'Tanaffusda' : 'Bo‘sh (Qabulga tayyor)'}
                          </span>
                        </td>

                        {/* Qabul qilgan mijozlar soni (Talab 2) */}
                        <td className="p-3.5 text-center">
                          <div className="text-lg font-black text-emerald-950 font-sans">
                            {served} ta mijoz
                          </div>
                          <div className="text-[10px] text-slate-400">bugungi qabul</div>
                        </td>

                        {/* O'rtacha xizmat vaqti */}
                        <td className="p-3.5 text-center">
                          <div className="font-extrabold text-slate-900 font-sans text-sm">
                            ~{avgMin} daqiqa
                          </div>
                          <div className="text-[10px] text-slate-400">1 mijoz uchun</div>
                        </td>

                        {/* Biriktirilgan xizmatlar */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {s.authorizedServiceIds?.map((srvId) => {
                              const srv = services.find((sv) => sv.id === srvId);
                              return (
                                <span
                                  key={srvId}
                                  className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] font-bold border border-emerald-200"
                                >
                                  {srv?.name || srvId}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Samaradorlik KPI */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-black text-emerald-950 font-sans text-sm">
                              {kpiScore}%
                            </span>
                            <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-700 h-2 rounded-full transition-all"
                                style={{ width: `${kpiScore}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            {kpiScore >= 80 ? 'Yuqori samaradorlik' : 'Muntazam'}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal: Yangi Xodim Qo'shish (Talab 2) */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-emerald-800">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-800" />
                <h3 className="text-lg font-black text-emerald-950">
                  Yangi Xodim Qo‘shish
                </h3>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  Xodim F.I.Sh:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Masalan: Rustam Ergashev"
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-xs font-semibold bg-emerald-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  Oyna Raqami:
                </label>
                <input
                  type="text"
                  value={newWindow}
                  onChange={(e) => setNewWindow(e.target.value)}
                  placeholder={`Masalan: ${branchStaff.length + 1}`}
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-xs font-semibold bg-emerald-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  Biriktiriladigan Xizmatlar:
                </label>
                <select
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-xs font-semibold bg-emerald-50/40"
                >
                  <option value="ALL">Barcha xizmatlar (Xizmatlar + Buxgalteriya)</option>
                  <option value="srv-general">Faqat Xizmatlar</option>
                  <option value="srv-accounting">Faqat Buxgalteriya</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-black text-xs hover:bg-emerald-900 shadow-md cursor-pointer"
                >
                  Saqlash va Qo‘shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
