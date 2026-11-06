import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { TICKET_STATUS, STAFF_STATUS } from '../constants/initialData';
import {
  Users,
  CheckCircle2,
  Clock,
  Layers,
  UserPlus,
  PlusCircle,
  RefreshCw,
  Trash2,
  TrendingUp,
  Award,
  ShieldCheck,
  ShieldPlus,
  X,
  Check,
  LogOut,
  UserCheck,
  Phone,
  Inbox,
  AlertCircle,
  Lock,
  Edit2,
  Building2,
  Volume2,
  VolumeX,
  Key,
  Shield,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';

export function AdminDashboard() {
  const {
    branches,
    activeBranchId,
    setActiveBranchId,
    services,
    staff,
    tickets,
    staffRequests,
    approveStaffRequest,
    rejectStaffRequest,
    deleteStaff,
    addStaff,
    updateStaff,
    createBranch,
    updateBranch,
    addService,
    updateService,
    resetToDemo,
    clearQueue,
    audioEnabled,
    setAudioEnabled,
    speechEnabled,
    setSpeechEnabled,
  } = useQueue();

  // Joriy tizimga kirgan foydalanuvchi ma'lumotlari (Talab: Superadmin va Admin)
  const currentUser = (() => {
    try {
      const u = localStorage.getItem('qms_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN' || currentUser?.role_id === 'SUPERADMIN';

  const [notification, setNotification] = useState(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [modalMode, setModalMode] = useState('STAFF'); // 'STAFF' yoki 'ADMIN'
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [filterService, setFilterService] = useState('ALL');
  const [activeTab, setActiveTab] = useState('STAFF'); // 'STAFF' | 'ADMINS' | 'SERVICES'

  // Form state for adding staff/admin
  const [newName, setNewName] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newRole, setNewRole] = useState('OPERATOR');
  const [newWindow, setNewWindow] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newServiceType, setNewServiceType] = useState('ALL');

  // Form state for editing user (Login/Parol tahrirlash)
  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLogin, setEditLogin] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('OPERATOR');
  const [editWindow, setEditWindow] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Form state for editing service/department (Talab: superadmin bo'limlarni tahrirlashi)
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServicePrefix, setEditServicePrefix] = useState('');
  const [editServiceDescription, setEditServiceDescription] = useState('');
  const [editServiceActive, setEditServiceActive] = useState(true);

  // Form state for adding new service/department (Talab: bo'limlar oynasiga "bo'lim qo'shish" tugmasini qo'sh)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrefix, setNewServicePrefix] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServiceActive, setNewServiceActive] = useState(true);

  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const branchTickets = tickets.filter((t) => (t.branchId || t.branch_id || 'branch-1') === (activeBranchId || 'branch-1'));
  const branchStaff = staff.filter((s) => (s.branchId || s.branch_id || 'branch-1') === (activeBranchId || 'branch-1'));

  // Xodimlar va Adminlarni ajratish (Talab: superadmin panelida xodimlar va adminlar alohida turishi kerak)
  const regularStaff = branchStaff.filter(
    (s) => (s.role_id || s.roleId || s.role) === 'OPERATOR'
  );
  const adminStaff = branchStaff.filter(
    (s) =>
      (s.role_id || s.roleId || s.role) === 'MANAGER' ||
      (s.role_id || s.roleId || s.role) === 'SUPERADMIN' ||
      (s.role_id || s.roleId || s.role) === 'ADMIN'
  );

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

  const handleAdminLogout = () => {
    localStorage.removeItem('qms_auth_token');
    localStorage.removeItem('qms_user');
    localStorage.removeItem('qms_admin_auth');
    localStorage.removeItem('qms_staff_auth_id');
    window.location.href = '/login';
  };

  // Open Add modal for Staff or Admin
  const handleOpenAddModal = (mode = 'STAFF') => {
    setModalMode(mode);
    setNewName('');
    setNewLogin('');
    setNewPhone('');
    setNewPassword('123');
    if (mode === 'ADMIN') {
      setNewRole('MANAGER');
      setNewWindow('MGR');
      setNewServiceType('ALL');
    } else {
      setNewRole('OPERATOR');
      setNewWindow(`${regularStaff.length + 1}`);
      setNewServiceType('ALL');
    }
    setShowAddPassword(false);
    setShowAddStaffModal(true);
  };

  // Add staff/admin handler
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let authServices = ['srv-general', 'srv-accounting'];
    if (newServiceType === 'srv-general') authServices = ['srv-general'];
    if (newServiceType === 'srv-accounting') authServices = ['srv-accounting'];

    const defaultWindow =
      newRole === 'SUPERADMIN' ? 'SUPER' : newRole === 'MANAGER' ? 'MGR' : `${regularStaff.length + 1}`;

    const res = await addStaff({
      name: newName.trim(),
      login: newLogin.trim() || `user-${Date.now().toString().slice(-4)}`,
      roleId: newRole,
      windowNumber: newWindow.trim() || defaultWindow,
      phone: newPhone.trim(),
      password: newPassword.trim() || '123',
      branchId: 'branch-1',
      authorizedServiceIds: authServices,
    });

    if (res?.success) {
      const roleTitle =
        newRole === 'SUPERADMIN' ? 'Bosh Administrator' : newRole === 'MANAGER' ? 'Filial Menejeri' : 'Xodim';
      setNotification(`Yangi ${roleTitle} ${newName} muvaffaqiyatli qo‘shildi!`);
      setTimeout(() => setNotification(null), 3500);
      setNewName('');
      setNewLogin('');
      setNewWindow('');
      setNewPhone('');
      setNewPassword('');
      setShowAddStaffModal(false);
    } else {
      setNotification(res?.error || 'Foydalanuvchi qo‘shishda xatolik yuz berdi!');
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Open Edit User Modal (Login/Parol tahrirlash)
  const openEditUserModal = (u) => {
    setEditingUserId(u.id);
    setEditName(u.name || '');
    setEditLogin(u.login || '');
    setEditPassword('');
    setEditRole(u.role_id || u.role || 'OPERATOR');
    setEditWindow(u.windowNumber || u.window_number || '1');
    setEditPhone(u.phone || '');
    setShowEditPassword(false);
    setShowEditUserModal(true);
  };

  // Edit User Submit (Login/Parol yangilash)
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUserId) return;

    const res = await updateStaff(editingUserId, {
      name: editName.trim(),
      login: editLogin.trim(),
      password: editPassword.trim() ? editPassword.trim() : undefined,
      roleId: editRole,
      windowNumber: editWindow.trim(),
      phone: editPhone.trim(),
    });

    if (res?.success) {
      setNotification(`Foydalanuvchi ${editName} ma'lumotlari (login/parol) yangilandi!`);
      setTimeout(() => setNotification(null), 3500);
      setShowEditUserModal(false);
    } else {
      setNotification(res?.error || 'Tahrirlashda xatolik yuz berdi!');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Open Edit Service Modal (Bo'limni tahrirlash)
  const openEditServiceModal = (srv) => {
    setEditingService(srv);
    setEditServiceName(srv.name || '');
    setEditServicePrefix(srv.prefix || 'X');
    setEditServiceDescription(srv.description || '');
    setEditServiceActive(srv.active !== false);
    setShowEditServiceModal(true);
  };

  // Edit Service Submit
  const handleEditServiceSubmit = async (e) => {
    e.preventDefault();
    if (!editingService?.id || !editServiceName.trim()) return;

    const res = await updateService(editingService.id, {
      name: editServiceName.trim(),
      prefix: editServicePrefix.trim().toUpperCase(),
      avgDurationMin: editingService.avgDurationMin || editingService.avg_duration_min || 8,
      description: editServiceDescription.trim(),
      active: editServiceActive,
    });

    if (res?.success) {
      setNotification(`"${editServiceName}" bo‘limi muvaffaqiyatli yangilandi va Kioskda aks ettirildi!`);
      setTimeout(() => setNotification(null), 3500);
      setShowEditServiceModal(false);
      setEditingService(null);
    } else {
      setNotification(res?.error || 'Bo‘limni yangilashda xatolik yuz berdi!');
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Open Add Service Modal (Yangi bo'lim qo'shish)
  const openAddServiceModal = () => {
    setNewServiceName('');
    setNewServicePrefix('');
    setNewServiceDescription('');
    setNewServiceActive(true);
    setShowAddServiceModal(true);
  };

  // Add Service Submit
  const handleAddServiceSubmit = async (e) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServicePrefix.trim()) return;

    const res = await addService({
      name: newServiceName.trim(),
      prefix: newServicePrefix.trim().toUpperCase(),
      description: newServiceDescription.trim(),
      avgDurationMin: 10,
      active: newServiceActive,
    });

    if (res?.success) {
      setNotification(`"${newServiceName}" yangi bo‘limi muvaffaqiyatli qo‘shildi va Kioskda aks ettirildi!`);
      setTimeout(() => setNotification(null), 3500);
      setShowAddServiceModal(false);
      setNewServiceName('');
      setNewServicePrefix('');
      setNewServiceDescription('');
    } else {
      setNotification(res?.error || 'Bo‘lim qo‘shishda xatolik yuz berdi!');
      setTimeout(() => setNotification(null), 4000);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header & Actions - OQ va TO'Q YASHIL */}
        <div className="bg-white border-2 border-emerald-200 p-6 rounded-3xl shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>{isSuperAdmin ? 'Superadmin Boshqaruvi' : 'Admin Boshqaruvi'}</span>
              </div>
            </div>
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
        {activeTab === 'STAFF' && pendingRequests.length > 0 && (
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

        {/* 1. XODIMLAR OYNASI (Talab: tugma bosilsa shu oynalarga kirsin) */}
        {activeTab === 'STAFF' && (
          <div className="space-y-6 animate-fade-in">
            {/* 4 Summary Stat KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border-2 border-emerald-200 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-extrabold uppercase text-emerald-900">Faol Xodimlar</span>
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="text-3xl font-black text-emerald-950">{regularStaff.length} nafar</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1">
              Operator xizmat ko‘rsatuvchi xodimlar
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

        {/* MAIN TABLE: Xodimlar samaradorligi (Faqat operator xodimlar ko'rinadi) */}
        <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-emerald-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-emerald-950 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-800" />
                Xodimlar Samaradorligi va Qabul Hisoboti
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Har bir xodimning bugun qabul qilgan mijozlar soni, xizmat ko‘rsatish vaqti va boshqaruvi
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-slate-600">Filtr:</span>
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="px-3 py-2 rounded-xl border border-emerald-200 text-xs font-semibold bg-emerald-50 text-emerald-950 focus:outline-hidden"
              >
                <option value="ALL">Barcha xizmatlar</option>
                <option value="srv-general">Xizmatlar</option>
                <option value="srv-accounting">Buxgalteriya</option>
              </select>

              <button
                onClick={() => handleOpenAddModal('STAFF')}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Xodim qo‘shish</span>
              </button>
            </div>
          </div>

          {/* Table: Faqat regularStaff ko'rsatiladi */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-950 text-white uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-2xl">Xodim</th>
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
                {regularStaff
                  .filter((s) => {
                    if (filterService === 'ALL') return true;
                    return s.authorizedServiceIds?.includes(filterService);
                  })
                  .map((s, index) => {
                    const served = s.servedCountToday || 0;
                    const totalMin = s.totalServiceMinutes || 0;
                    const avgMin = served > 0 ? Math.round(totalMin / served) : 8;
                    const kpiScore = Math.min(100, Math.round((served / 30) * 100));

                    const isBusy = s.status === STAFF_STATUS.BUSY;
                    const isPaused = s.status === STAFF_STATUS.PAUSED;

                    return (
                      <tr key={s.id} className="hover:bg-emerald-50/60 transition-colors">
                        
                        {/* Xodim raqami: 1-xodim, 2-xodim */}
                        <td className="p-3.5 font-black text-emerald-950 text-sm">
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300">
                            {s.windowNumber || s.window_number || index + 1}-xodim
                          </span>
                        </td>

                        {/* Xodim F.I.Sh va ichki raqam */}
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {s.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {s.phone ? `Ichki tel: ${s.phone}` : `Ichki tel: ${s.windowNumber || s.window_number || '101'}`}
                          </div>
                        </td>

                        {/* Holati: Bo'sh / Band */}
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black ${
                              isBusy
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : isPaused
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isBusy ? 'bg-rose-600 animate-pulse' : isPaused ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                            ></span>
                            {isBusy ? 'Band' : isPaused ? 'Tanaffus' : 'Bo‘sh'}
                          </span>
                        </td>

                        {/* Qabul qilgan mijozlar soni */}
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

                        {/* Amallar: Login/Parol tahrirlash va Xodimni o'chirish */}
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditUserModal(s)}
                              title="Login va parolni tahrirlash"
                              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(s.id, s.name)}
                              title="Foydalanuvchini tizimdan o‘chirish"
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 border border-red-200 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                {regularStaff.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      Hozircha birorta ham xodim qo‘shilmagan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

        {/* Oynalarga kirish tugmalari (Panelning tagida: Xodimlar, Administratorlar, Bo'limlar) */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-emerald-100">
          <button
            onClick={() => setActiveTab('STAFF')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'STAFF'
                ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20 scale-[1.02]'
                : 'bg-emerald-50/80 text-emerald-950 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Xodimlar</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                activeTab === 'STAFF'
                  ? 'bg-emerald-950 text-emerald-200'
                  : 'bg-white text-emerald-800 border border-emerald-200'
              }`}
            >
              {regularStaff.length} nafar
            </span>
          </button>

          {isSuperAdmin && (
            <>
              <button
                onClick={() => setActiveTab('ADMINS')}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'ADMINS'
                    ? 'bg-purple-800 text-white shadow-md shadow-purple-900/20 scale-[1.02]'
                    : 'bg-purple-50/80 text-purple-950 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Administratorlar</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    activeTab === 'ADMINS'
                      ? 'bg-purple-950 text-purple-200'
                      : 'bg-white text-purple-800 border border-purple-200'
                  }`}
                >
                  {adminStaff.length} nafar
                </span>
              </button>

              <button
                onClick={() => setActiveTab('SERVICES')}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'SERVICES'
                    ? 'bg-teal-800 text-white shadow-md shadow-teal-900/20 scale-[1.02]'
                    : 'bg-teal-50/80 text-teal-950 border border-teal-200 hover:bg-teal-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Bo‘limlar</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    activeTab === 'SERVICES'
                      ? 'bg-teal-950 text-teal-200'
                      : 'bg-white text-teal-800 border border-teal-200'
                  }`}
                >
                  {services.length} ta
                </span>
              </button>
            </>
          )}
        </div>

        {/* 2. SUPERADMIN UCHUN ALOHIDA ADMINLAR OYNASI (Talab: tugma bosilsa shu oynalarga kirsin) */}
        {isSuperAdmin && activeTab === 'ADMINS' && (
          <div className="bg-white border-2 border-purple-200 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-purple-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-200">
                    {adminStaff.length} nafar rahbar va ma'mur
                  </span>
                </div>
                <h2 className="text-lg font-black text-purple-950 tracking-tight flex items-center gap-2 mt-1">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                  Administratorlar va Filial Menejerlari
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tizim boshqaruvchilari, filial menejerlari va ularning tizimga kirish huquqlari
                </p>
              </div>

              <button
                onClick={() => handleOpenAddModal('ADMIN')}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <ShieldPlus className="w-4 h-4" />
                <span>Admin qo‘shish</span>
              </button>
            </div>

            {/* Adminlar Jadvali */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-950 text-white uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-2xl">№</th>
                    <th className="p-3.5">F.I.Sh</th>
                    <th className="p-3.5">Lavozimi / Roli</th>
                    <th className="p-3.5">Bo‘lim nomi</th>
                    <th className="p-3.5">Login</th>
                    <th className="p-3.5">Ichki Tel</th>
                    <th className="p-3.5">Holati</th>
                    <th className="p-3.5 text-right rounded-r-2xl">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 text-slate-700">
                  {adminStaff.map((admin, idx) => {
                    const isCurrentSuper =
                      (admin.role_id || admin.roleId || admin.role) === 'SUPERADMIN';
                    return (
                      <tr key={admin.id} className="hover:bg-purple-50/60 transition-colors">
                        <td className="p-3.5 font-black text-purple-950">
                          <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-950 border border-purple-200">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {admin.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {isCurrentSuper ? 'Tizim Bosh Rahbari' : 'Filial Ma’muri'}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border ${
                              isCurrentSuper
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-purple-100 text-purple-900 border-purple-300'
                            }`}
                          >
                            {isCurrentSuper
                              ? 'Bosh Administrator (Superadmin)'
                              : 'Filial Menejeri (Admin)'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">
                          <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-900 border border-purple-200">
                            {admin.windowNumber || admin.window_number || (isCurrentSuper ? 'Boshqaruv' : 'Menejment')}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {admin.login}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {admin.phone ? `Ichki tel: ${admin.phone}` : '-'}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            Faol
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditUserModal(admin)}
                              title="Login va parolni tahrirlash"
                              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!isCurrentSuper && (
                              <button
                                onClick={() => handleDeleteStaff(admin.id, admin.name)}
                                title="Adminni tizimdan o‘chirish"
                                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 border border-red-200 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {adminStaff.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        Hozircha birorta ham administrator qo‘shilmagan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. SUPERADMIN UCHUN BO'LIMLAR OYNASI (Talab: tugma bosilsa shu oynalarga kirsin) */}
        {isSuperAdmin && activeTab === 'SERVICES' && (
          <div className="bg-white border-2 border-teal-200 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-teal-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-900 border border-teal-200">
                    {services.length} ta asosiy bo‘lim
                  </span>
                </div>
                <h2 className="text-lg font-black text-teal-950 tracking-tight flex items-center gap-2 mt-1">
                  <Layers className="w-5 h-5 text-teal-700" />
                  Bo‘limlar va Xizmatlar Boshqaruvi (Kiosk Terminali)
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Mijozlar planshet (kiosk) terminalida ko‘radigan bo‘limlar, chipta prefikslari va xizmat parametrlari
                </p>
              </div>

              <button
                onClick={openAddServiceModal}
                className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Bo‘lim qo‘shish</span>
              </button>
            </div>

            {/* Bo'limlar Jadvali */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-teal-950 text-white uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-2xl">Prefiks</th>
                    <th className="p-3.5">Bo‘lim Nomi</th>
                    <th className="p-3.5">O‘rtacha Xizmat Vaqti</th>
                    <th className="p-3.5">Bo‘lim Tavsifi (Kioskda chiqadi)</th>
                    <th className="p-3.5">Kioskda Ko‘rinishi</th>
                    <th className="p-3.5 text-right rounded-r-2xl">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-100 text-slate-700">
                  {services.map((srv) => (
                    <tr key={srv.id} className="hover:bg-teal-50/60 transition-colors">
                      <td className="p-3.5 font-black text-teal-950">
                        <span className="px-3 py-1 rounded-xl bg-teal-100 text-teal-900 font-mono text-sm border border-teal-300">
                          {srv.prefix}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {srv.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {srv.id}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        ~{srv.avgDurationMin || srv.avg_duration_min || 8} daqiqa
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">
                        {srv.description || '—'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black ${
                            srv.active !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              srv.active !== false ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          ></span>
                          {srv.active !== false ? 'Kioskda Faol' : 'Yashirilgan'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openEditServiceModal(srv)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Tahrirlash</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        Hozircha birorta ham bo‘lim mavjud emas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modal 1: Yangi Foydalanuvchi (Xodim / Admin) Qo'shish */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm">
          <div
            className={`bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 ${
              modalMode === 'ADMIN' ? 'border-purple-800' : 'border-emerald-800'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                {modalMode === 'ADMIN' ? (
                  <ShieldPlus className="w-5 h-5 text-purple-700" />
                ) : (
                  <UserPlus className="w-5 h-5 text-emerald-800" />
                )}
                <h3
                  className={`text-lg font-black ${
                    modalMode === 'ADMIN' ? 'text-purple-950' : 'text-emerald-950'
                  }`}
                >
                  {modalMode === 'ADMIN' ? "Yangi Administrator Qo‘shish" : "Yangi Xodim Qo‘shish"}
                </h3>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3.5">
              {/* Rolni tanlash */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  {modalMode === 'ADMIN' ? 'Administrator Lavozimi / Roli:' : 'Xodim Roli:'}
                </label>
                {modalMode === 'ADMIN' ? (
                  <select
                    value={newRole}
                    onChange={(e) => {
                      setNewRole(e.target.value);
                      if (e.target.value === 'SUPERADMIN') setNewWindow('SUPER');
                      else setNewWindow('MGR');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-300 text-xs font-bold bg-purple-50 text-purple-950"
                  >
                    <option value="MANAGER">Filial Menejeri (Admin)</option>
                    {isSuperAdmin && <option value="SUPERADMIN">Bosh Administrator (Superadmin)</option>}
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value="Xizmat ko‘rsatuvchi Operator (Xodim)"
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-xs font-bold bg-emerald-50 text-emerald-950"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  F.I.Sh (To‘liq ism):
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={modalMode === 'ADMIN' ? "Masalan: Jasur Boshqaruvchi" : "Masalan: Rustam Ergashev"}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${
                    modalMode === 'ADMIN'
                      ? 'border-purple-300 focus:border-purple-700 bg-purple-50/40'
                      : 'border-emerald-300 focus:border-emerald-700 bg-emerald-50/40'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Login:
                  </label>
                  <input
                    type="text"
                    required
                    value={newLogin}
                    onChange={(e) => setNewLogin(e.target.value)}
                    placeholder={modalMode === 'ADMIN' ? "Masalan: manager2" : "Masalan: OP-107"}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${
                      modalMode === 'ADMIN' ? 'border-purple-300 bg-purple-50/40' : 'border-emerald-300 bg-emerald-50/40'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Parol:
                  </label>
                  <div className="relative">
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Standart: 123"
                      className={`w-full pl-4 pr-10 py-2.5 rounded-xl border text-xs font-semibold ${
                        modalMode === 'ADMIN' ? 'border-purple-300 bg-purple-50/40' : 'border-emerald-300 bg-emerald-50/40'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                      title={showAddPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                    >
                      {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    {modalMode === 'ADMIN' ? 'Bo‘lim nomi:' : 'Xodim Raqami (1, 2, ...):'}
                  </label>
                  <input
                    type="text"
                    value={newWindow}
                    onChange={(e) => setNewWindow(e.target.value)}
                    placeholder={modalMode === 'ADMIN' ? "Masalan: IT bo'limi yoki Boshqaruv" : `${regularStaff.length + 1}`}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${
                      modalMode === 'ADMIN' ? 'border-purple-300 bg-purple-50/40' : 'border-emerald-300 bg-emerald-50/40'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Ichki Tel (Raqam):
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder={modalMode === 'ADMIN' ? "Masalan: 201" : "Masalan: 107"}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${
                      modalMode === 'ADMIN' ? 'border-purple-300 bg-purple-50/40' : 'border-emerald-300 bg-emerald-50/40'
                    }`}
                  />
                </div>
              </div>

              {modalMode === 'STAFF' && (
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
              )}

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
                  className={`flex-1 py-2.5 rounded-xl text-white font-black text-xs shadow-md cursor-pointer ${
                    modalMode === 'ADMIN'
                      ? 'bg-purple-700 hover:bg-purple-800'
                      : 'bg-emerald-800 hover:bg-emerald-900'
                  }`}
                >
                  Saqlash va Qo‘shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Foydalanuvchi ma'lumotlari va Login/Parolni Tahrirlash (Talab: Superadmin/Admin) */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-blue-800">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-black text-slate-900">
                  Login & Parolni Tahrirlash
                </h3>
              </div>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  Ism Familiya:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-xs font-semibold bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Login:
                  </label>
                  <input
                    type="text"
                    required
                    value={editLogin}
                    onChange={(e) => setEditLogin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-xs font-semibold bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Yangi Parol:
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="O'zgartirish uchun yozing"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-blue-400 focus:outline-none focus:border-blue-600 text-xs font-semibold bg-blue-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                      title={showEditPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    Roli:
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    <option value="OPERATOR">OPERATOR (Xodim)</option>
                    <option value="MANAGER">MANAGER (Filial Menejeri / Admin)</option>
                    {isSuperAdmin && <option value="SUPERADMIN">SUPERADMIN</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                    {editRole === 'MANAGER' || editRole === 'SUPERADMIN' || editRole === 'ADMIN'
                      ? 'Bo‘lim nomi:'
                      : 'Xodim Raqami (1, 2, ...):'}
                  </label>
                  <input
                    type="text"
                    value={editWindow}
                    onChange={(e) => setEditWindow(e.target.value)}
                    placeholder={
                      editRole === 'MANAGER' || editRole === 'SUPERADMIN' || editRole === 'ADMIN'
                        ? "Masalan: IT bo'limi yoki Boshqaruv"
                        : "1"
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                  Ichki Tel (Raqam):
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Masalan: 214 yoki 119"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-700 text-white font-black text-xs hover:bg-blue-800 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bo'limni Tahrirlash (Kiosk va Tizim uchun) */}
      {showEditServiceModal && editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-4 border-teal-800 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-200">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Bo‘limni Tahrirlash</h3>
                  <p className="text-xs text-slate-500">Kiosk terminalida ko‘rinuvchi parametrlarni yangilash</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditServiceModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditServiceSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-800 uppercase tracking-wider text-[11px]">
                  Bo‘lim Nomi:
                </label>
                <input
                  type="text"
                  required
                  value={editServiceName}
                  onChange={(e) => setEditServiceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-700 text-slate-900 font-extrabold text-sm"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-800 uppercase tracking-wider text-[11px]">
                  Chipta Prefiksi (X, B, ...):
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={editServicePrefix}
                  onChange={(e) => setEditServicePrefix(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-700 text-slate-900 font-mono font-black text-sm uppercase"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-800 uppercase tracking-wider text-[11px]">
                  Bo‘lim Tavsifi (Kioskda mijozga ko‘rinadi):
                </label>
                <textarea
                  rows={2}
                  value={editServiceDescription}
                  onChange={(e) => setEditServiceDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-700 text-slate-900 font-normal text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="serviceActiveCheck"
                  checked={editServiceActive}
                  onChange={(e) => setEditServiceActive(e.target.checked)}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600 cursor-pointer"
                />
                <label htmlFor="serviceActiveCheck" className="text-xs text-slate-800 cursor-pointer font-bold select-none">
                  Kioskda ko‘rinsin (Faol holatda)
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditServiceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-all cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Yangi Bo'lim Qo'shish (Kiosk va Tizim uchun) */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-4 border-teal-800 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-200">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Yangi Bo‘lim Qo‘shish</h3>
                  <p className="text-xs text-slate-500">Kiosk terminalida yangi xizmat bo‘limi yaratish</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-800 uppercase tracking-wider text-[11px]">
                  Bo‘lim Nomi:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Kredit xizmatlari"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-700 text-slate-900 font-extrabold text-sm"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-800 uppercase tracking-wider text-[11px]">
                  Chipta Prefiksi (K, X, B, ...):
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="Masalan: K"
                  value={newServicePrefix}
                  onChange={(e) => setNewServicePrefix(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-700 text-slate-900 font-mono font-black text-sm uppercase"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-800 uppercase tracking-wider text-[11px]">
                  Bo‘lim Tavsifi (Kioskda mijozga ko‘rinadi):
                </label>
                <textarea
                  rows={2}
                  placeholder="Bo‘lim faoliyati haqida qisqacha ma'lumot..."
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-700 text-slate-900 font-normal text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newServiceActiveCheck"
                  checked={newServiceActive}
                  onChange={(e) => setNewServiceActive(e.target.checked)}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600 cursor-pointer"
                />
                <label htmlFor="newServiceActiveCheck" className="text-xs text-slate-800 cursor-pointer font-bold select-none">
                  Kioskda ko‘rinsin (Faol holatda)
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-all cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Qo‘shish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
