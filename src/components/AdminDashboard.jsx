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
  ShieldCheck,
  X,
  Check,
  LogOut,
  UserCheck,
  Phone,
  Inbox,
  AlertCircle,
  Lock,
} from 'lucide-react';

export function AdminDashboard() {
  const {
    branches,
    activeBranchId,
    services,
    staff,
    tickets,
    staffRequests,
    approveStaffRequest,
    rejectStaffRequest,
    deleteStaff,
    addStaff,
    resetToDemo,
    clearQueue,
  } = useQueue();

  // Admin Login State (Talab 7)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('qms_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  const [notification, setNotification] = useState(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [filterService, setFilterService] = useState('ALL');

  // Form state for manually adding staff
  const [newName, setNewName] = useState('');
  const [newWindow, setNewWindow] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newServiceType, setNewServiceType] = useState('ALL');

  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const branchTickets = tickets.filter((t) => t.branchId === activeBranchId);
  const branchStaff = staff.filter((s) => s.branchId === activeBranchId);

  // Kutilayotgan arizalar (Talab 7)
  const pendingRequests = staffRequests.filter((r) => r.status === 'PENDING');

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

  // Admin login handler
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPasswordInput.trim() === 'admin' || adminPasswordInput.trim() === 'admin123' || adminPasswordInput.trim() === '123') {
      setIsAdminLoggedIn(true);
      setAdminLoginError('');
      try {
        localStorage.setItem('qms_admin_auth', 'true');
      } catch {}
    } else {
      setAdminLoginError('Noto‘g‘ri parol! (Standart parol: admin123 yoki admin)');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('qms_admin_auth');
    } catch {}
  };

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
      phone: newPhone.trim(),
      password: newPassword.trim() || '123',
      branchId: activeBranchId,
      authorizedServiceIds: authServices,
    });

    if (res.success) {
      setNotification(`Yangi xodim ${newName} (${res.staff.windowNumber}-oyna) muvaffaqiyatli qo‘shildi!`);
      setTimeout(() => setNotification(null), 3500);
      setNewName('');
      setNewWindow('');
      setNewPhone('');
      setNewPassword('');
      setNewServiceType('ALL');
      setShowAddStaffModal(false);
    }
  };

  // Approve request handler
  const handleApprove = (reqId) => {
    const res = approveStaffRequest(reqId);
    if (res.success) {
      setNotification(`Xodim arizasi qabul qilindi va tizimga qo‘shildi: ${res.staff.name}`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Reject request handler
  const handleReject = (reqId) => {
    rejectStaffRequest(reqId);
    setNotification('Xodim arizasi rad etildi.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Delete staff handler
  const handleDeleteStaff = (staffId, staffName) => {
    if (window.confirm(`${staffName} xodimini haqiqatan ham tizimdan o‘chirmoqchimisiz?`)) {
      deleteStaff(staffId);
      setNotification(`${staffName} xodimi tizimdan o‘chirildi!`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Agar admin kirmagan bo'lsa, Admin Kirish oynasi (Talab 7)
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-emerald-800 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-950/20">
              <Lock className="w-7 h-7 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-black text-emerald-950 tracking-tight">
              Admin & Boshqaruv Portali
            </h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Tizim boshqaruvi va xodimlar arizalarini ko‘rish uchun parolni kiriting
            </p>
          </div>

          {adminLoginError && (
            <div className="p-3 mb-4 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-bold">
              {adminLoginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                Admin Paroli:
              </label>
              <input
                type="password"
                required
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Standart parol: admin123"
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 focus:outline-hidden focus:border-emerald-700 text-xs font-semibold bg-emerald-50/40"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Sinov uchun standart parol: <strong>admin123</strong> yoki <strong>admin</strong>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Boshqaruv Paneliga Kirish
            </button>
          </form>
        </div>
      </div>
    );
  }

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
              Xodimlar arizalarini qabul qilish, samaradorlik tahlili va yangi xodim qo‘shish/o‘chirish
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Yangi xodim qo'shish */}
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
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

            {/* Admin Chiqish */}
            <button
              onClick={handleAdminLogout}
              title="Admin tizimidan chiqish"
              className="px-3 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Chiqish</span>
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

        {/* YANGI XODIMLAR ARIZALARI BO'LIMI (Talab 7: Xodim ro'yxatdan o'tgach Adminga keladi) */}
        {pendingRequests.length > 0 && (
          <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-black text-amber-950">
                  Yangi Xodimlardan Kelgan Arizalar ({pendingRequests.length} ta)
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Admin tasdig‘i kutilmoqda
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Quyidagi xodimlar tizimga kirish uchun ro‘yxatdan o‘tish arizasi yuborgan. Siz qabul qilsangiz, ular ishchilar ro‘yxatiga qo‘shiladi va paroli bilan kira oladi.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-emerald-950">
                        {req.windowNumber}-Oyna
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(req.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-900">{req.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Login: {req.login}
                    </div>
                    {req.phone && (
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{req.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleReject(req.id)}
                      className="flex-1 py-1.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                    >
                      Rad etish
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black shadow transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Qabul qilish</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

        {/* MAIN TABLE: Barcha xodimlar samaradorligi va O'CHIRISH (Talab 2 & 7) */}
        <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-emerald-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-emerald-950 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-800" />
                Xodimlar Samaradorligi va Qabul Hisoboti
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Har bir xodimning bugun qabul qilgan mijozlar soni, xizmat ko‘rsatish vaqti va xodimni o‘chirish
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
                  <th className="p-3.5 text-center">Samaradorlik (KPI)</th>
                  <th className="p-3.5 text-right rounded-r-2xl">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 text-slate-700">
                {branchStaff
                  .filter((s) => {
                    if (filterService === 'ALL') return true;
                    return s.authorizedServiceIds?.includes(filterService);
                  })
                  .map((s) => {
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
                          <div className="text-[11px] font-mono text-slate-400">
                            {s.login || `OP-${s.windowNumber}`} {s.phone && `• ${s.phone}`}
                          </div>
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
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-black text-emerald-950 font-sans text-sm">
                              {kpiScore}%
                            </span>
                            <div className="w-14 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-700 h-2 rounded-full transition-all"
                                style={{ width: `${kpiScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Amallar: Xodimni o'chirish (Talab 7) */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteStaff(s.id, s.name)}
                            title="Xodimni tizimdan o‘chirish"
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 border border-red-200 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal: Yangi Xodim Qo'shish */}
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

            <form onSubmit={handleAddStaffSubmit} className="space-y-3.5">
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Oyna Raqami:
                  </label>
                  <input
                    type="text"
                    value={newWindow}
                    onChange={(e) => setNewWindow(e.target.value)}
                    placeholder={`Masalan: ${branchStaff.length + 1}`}
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-xs font-semibold bg-emerald-50/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Telefon:
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+998 90..."
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-xs font-semibold bg-emerald-50/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  Parol:
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Standart: 123"
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-xs font-semibold bg-emerald-50/40"
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
