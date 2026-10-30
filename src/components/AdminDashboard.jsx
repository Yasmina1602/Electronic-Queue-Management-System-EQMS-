import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { TICKET_STATUS, STAFF_STATUS } from '../constants/initialData';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  Hourglass,
  Layers,
  Settings,
  RefreshCw,
  Trash2,
  PlusCircle,
  Shield,
  Building,
  UserCheck,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export function AdminDashboard() {
  const {
    branches,
    activeBranchId,
    setActiveBranchId,
    services,
    staff,
    tickets,
    createTicket,
    toggleServiceActive,
    resetToDemo,
    clearQueue,
  } = useQueue();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'staff' | 'services' | 'logs'
  const [filterStatus, setFilterStatus] = useState('ALL');

  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // Branch-specific tickets
  const branchTickets = tickets.filter((t) => t.branchId === activeBranchId);

  // Analytics Computations
  const totalTickets = branchTickets.length;
  const completedTickets = branchTickets.filter((t) => t.status === TICKET_STATUS.COMPLETED);
  const waitingTickets = branchTickets.filter((t) => t.status === TICKET_STATUS.WAITING);
  const inServiceTickets = branchTickets.filter(
    (t) => t.status === TICKET_STATUS.IN_SERVICE || t.status === TICKET_STATUS.CALLED
  );
  const noShowTickets = branchTickets.filter((t) => t.status === TICKET_STATUS.NO_SHOW);

  // Compute average waiting time (minutes)
  let totalWaitMs = 0;
  let waitCount = 0;
  branchTickets.forEach((t) => {
    if (t.calledAt && t.createdAt) {
      totalWaitMs += t.calledAt - t.createdAt;
      waitCount++;
    }
  });
  const avgWaitMin = waitCount > 0 ? Math.round(totalWaitMs / waitCount / 60000) : 4;

  // Compute average service duration (minutes)
  let totalServiceMs = 0;
  let serviceCount = 0;
  completedTickets.forEach((t) => {
    if (t.completedAt && t.startedAt) {
      totalServiceMs += t.completedAt - t.startedAt;
      serviceCount++;
    }
  });
  const avgServiceMin = serviceCount > 0 ? Math.round(totalServiceMs / serviceCount / 60000) : 7;

  // Active staff count
  const branchStaff = staff.filter((s) => s.branchId === activeBranchId);
  const activeStaffCount = branchStaff.filter(
    (s) => s.status === STAFF_STATUS.AVAILABLE || s.status === STAFF_STATUS.BUSY
  ).length;

  // Quick Simulation Helper
  const handleSimulateRandomCustomer = () => {
    const activeServices = services.filter((s) => s.active);
    if (activeServices.length === 0) return;
    const randomService = activeServices[Math.floor(Math.random() * activeServices.length)];
    createTicket(randomService.id);
  };

  const handleSimulateBulk = (count = 3) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        handleSimulateRandomCustomer();
      }, i * 200);
    }
  };

  // Filtered tickets list for logs tab
  const filteredTickets = branchTickets.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Header & Simulation Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              Filial Boshqaruvi va Analitika
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Jonli SLA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Filial: <strong className="text-white">{currentBranch?.name}</strong> • Real vaqtdagi statistik ko‘rsatkichlar
          </p>
        </div>

        {/* Action Buttons: Demo seed / Simulate */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateRandomCustomer}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            +1 Mijoz Kiritish
          </button>

          <button
            onClick={() => handleSimulateBulk(4)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-all border border-slate-700 cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-400" />
            +4 Ta Navbat Oqimi
          </button>

          <button
            onClick={resetToDemo}
            title="Dastlabki namunaviy ma'lumotlarni tiklash"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            Demoni Tiklash
          </button>

          <button
            onClick={clearQueue}
            title="Barcha navbatlarni tozalash"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 font-medium text-xs transition-all border border-slate-700 hover:border-red-500/30 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Tozalash
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Jami Navbatlar</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTickets}</div>
          <div className="text-[10px] text-slate-500 mt-1">Bugungi oqim</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Kutmoqda</span>
            <Hourglass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{waitingTickets.length}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">FIFO tartibida</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Xizmat Ko‘rsatildi</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedTickets.length}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Muvaffaqiyatli</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">O‘rtacha Kutish</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">~{avgWaitMin} daq</div>
          <div className="text-[10px] text-slate-500 mt-1">SLA standarti: &lt;10 daq</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">O‘rtacha Xizmat</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">~{avgServiceMin} daq</div>
          <div className="text-[10px] text-slate-500 mt-1">Bajarish vaqti</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Faol Operatorlar</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {activeStaffCount} <span className="text-xs text-slate-500 font-normal">/ {branchStaff.length}</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">Oynalarda tayyor</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Xodimlar Samaradorligi' },
          { id: 'services', label: 'Xizmatlar Sozlamasi' },
          { id: 'logs', label: 'Navbatlar Arxivi & Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Staff Performance Table */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Operatorlar va Oynalar Holati</h3>
            <span className="text-xs text-slate-400">Filial: {currentBranch?.name}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Oyna #</th>
                  <th className="p-3.5">Xodim Ismi</th>
                  <th className="p-3.5">Holati</th>
                  <th className="p-3.5">Vakolatli Xizmatlar</th>
                  <th className="p-3.5">Joriy Bandlik</th>
                  <th className="p-3.5 text-right">Bugungi Mijozlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {branchStaff.map((st) => {
                  const currentServingTicket = tickets.find(
                    (t) =>
                      (t.id === st.currentTicketId || t.staffId === st.id) &&
                      (t.status === TICKET_STATUS.CALLED || t.status === TICKET_STATUS.IN_SERVICE)
                  );

                  return (
                    <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-blue-400 font-sans">{st.windowNumber}-Oyna</td>
                      <td className="p-3.5 font-semibold text-white">{st.name}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            st.status === STAFF_STATUS.AVAILABLE
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : st.status === STAFF_STATUS.BUSY
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : st.status === STAFF_STATUS.PAUSED
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700/40 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              st.status === STAFF_STATUS.AVAILABLE
                                ? 'bg-emerald-400'
                                : st.status === STAFF_STATUS.BUSY
                                ? 'bg-blue-400'
                                : st.status === STAFF_STATUS.PAUSED
                                ? 'bg-amber-400'
                                : 'bg-slate-400'
                            }`}
                          ></span>
                          {st.status}
                          {st.pauseReason && ` (${st.pauseReason})`}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {st.authorizedServiceIds.map((srvId) => {
                            const srv = services.find((s) => s.id === srvId);
                            return (
                              <span
                                key={srvId}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium"
                              >
                                {srv?.prefix}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3.5">
                        {currentServingTicket ? (
                          <span className="font-extrabold text-amber-300 font-sans">
                            {currentServingTicket.ticketNumber} ({currentServingTicket.status})
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-bold text-white font-mono">
                        {st.servedCountToday || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Services Management */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className={`p-5 rounded-2xl border transition-all ${
                srv.active
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-950/60 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 font-extrabold text-xl flex items-center justify-center border border-blue-500/30">
                  {srv.prefix}
                </span>
                <button
                  onClick={() => toggleServiceActive(srv.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    srv.active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {srv.active ? 'Faol' : 'To‘xtatilgan'}
                </button>
              </div>

              <h4 className="font-bold text-white text-base mb-1">{srv.name}</h4>
              <p className="text-xs text-slate-400 mb-3">{srv.description}</p>

              <div className="text-xs text-slate-400 pt-3 border-t border-slate-800 flex justify-between">
                <span>O‘rtacha muddat:</span>
                <strong className="text-slate-200">~{srv.avgDurationMin} daqiqa</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Detailed Queue Logs */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-white text-sm">Navbatlar Tarixi (Jonli Audit)</h3>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {['ALL', 'WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3">Raqam</th>
                  <th className="p-3">Xizmat</th>
                  <th className="p-3">Holat</th>
                  <th className="p-3">Olingan Vaqt</th>
                  <th className="p-3">Chaqirilgan Vaqt</th>
                  <th className="p-3">Oyna #</th>
                  <th className="p-3 text-right">Kutish Davomiyligi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      Ushbu filtr bo‘yicha navbatlar topilmadi.
                    </td>
                  </tr>
                ) : (
                  filteredTickets
                    .slice()
                    .reverse()
                    .map((t) => {
                      const srv = services.find((s) => s.id === t.serviceId);
                      const waitTimeMin = t.calledAt
                        ? Math.max(1, Math.round((t.calledAt - t.createdAt) / 60000))
                        : Math.max(1, Math.round((Date.now() - t.createdAt) / 60000));

                      return (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-extrabold text-white text-sm font-sans">
                            {t.ticketNumber}
                          </td>
                          <td className="p-3 font-medium text-slate-300">{srv?.name}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                t.status === TICKET_STATUS.COMPLETED
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : t.status === TICKET_STATUS.IN_SERVICE
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : t.status === TICKET_STATUS.CALLED
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : t.status === TICKET_STATUS.WAITING
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {new Date(t.createdAt).toLocaleTimeString('uz-UZ')}
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {t.calledAt ? new Date(t.calledAt).toLocaleTimeString('uz-UZ') : '—'}
                          </td>
                          <td className="p-3 font-bold text-blue-400">
                            {t.windowNumber ? `${t.windowNumber}-Oyna` : '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-300">
                            {waitTimeMin} daqiqa
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
