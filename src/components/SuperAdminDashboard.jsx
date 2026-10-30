import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import {
  LayoutDashboard,
  Monitor,
  Sliders,
  Users,
  Share2,
  Settings,
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Edit2,
  RotateCw,
  Trash2,
  Check,
  ShieldCheck,
  Plus,
  RefreshCw,
  Layers,
  Power,
  X,
  Server,
  Activity,
  Cpu,
  Database,
  Wifi,
  ExternalLink,
  Shield,
  UserCheck,
} from 'lucide-react';

export function SuperAdminDashboard() {
  const {
    devices,
    services,
    staff,
    restartDevice,
    toggleDeviceStatus,
    addDevice,
    deleteDevice,
    toggleServiceActive,
    centralQueueRouting,
    setCentralQueueRouting,
    resetToDemo,
  } = useQueue();

  const [activeMenu, setActiveMenu] = useState('devices'); // 'dashboard' | 'devices' | 'configurations' | 'staff' | 'services' | 'settings'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Dropdown & Modal states
  const [showSystemStatusModal, setShowSystemStatusModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEditDeviceDropdown, setShowEditDeviceDropdown] = useState(false);
  const [showRestartsDropdown, setShowRestartsDropdown] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);

  // Submenu states
  const [configSubmenuOpen, setConfigSubmenuOpen] = useState(true);
  const [servicesSubmenuOpen, setServicesSubmenuOpen] = useState(true);

  // New Device Form state
  const [newDevName, setNewDevName] = useState('');
  const [newDevIp, setNewDevIp] = useState('192.168.1.');
  const [newDevType, setNewDevType] = useState('KIOSK');

  const activeDevicesCount = devices.filter((d) => d.status === 'ONLINE').length;

  // Filtered devices
  const filteredDevices = devices.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.ipAddress.includes(q) || d.status.toLowerCase().includes(q);
  });

  const handleRestart = (deviceId, deviceName) => {
    restartDevice(deviceId);
    setNotification(`${deviceName} muvaffaqiyatli qayta ishga tushirildi!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRestartAll = () => {
    devices.forEach((d) => restartDevice(d.id));
    setShowRestartsDropdown(false);
    setNotification('Barcha 25 ta filial qurilmasi qayta yuklandi!');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRestartOfflineOnly = () => {
    devices.filter((d) => d.status === 'OFFLINE').forEach((d) => restartDevice(d.id));
    setShowRestartsDropdown(false);
    setNotification('Barcha oflayn qurilmalar qayta ishga tushirildi va holati tekshirilmoqda!');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateDevice = (e) => {
    e.preventDefault();
    if (!newDevName) return;
    addDevice({
      id: `dev-${Date.now()}`,
      name: newDevName,
      ipAddress: newDevIp,
      type: newDevType,
      status: 'ONLINE',
      lastPing: 'Hozirgina',
    });
    setShowAddDeviceModal(false);
    setNewDevName('');
    setNotification(`Yangi qurilma "${newDevName}" qo‘shildi!`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b1329] text-slate-100 flex font-sans">
      
      {/* Left Admin Sidebar (INTERACTIVE: collapsible & all links working) */}
      <aside
        className={`bg-[#091024] border-r border-slate-800/80 p-3 sm:p-4 flex flex-col justify-between flex-shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Collapse button (matching Image 3) */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-600/30 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Kengaytirish (Expand)" : "Kichraytirish (Collapse)"}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <span className="text-xs font-mono font-bold">{sidebarCollapsed ? '»' : '«'}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-semibold">
            {/* Dashboard */}
            <button
              onClick={() => setActiveMenu('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeMenu === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>

            {/* Devices (Active in screenshot 4) */}
            <button
              onClick={() => setActiveMenu('devices')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeMenu === 'devices'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              title="Devices"
            >
              <Monitor className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Devices</span>}
            </button>

            {/* Configurations (with accordion submenu) */}
            <div>
              <button
                onClick={() => {
                  setActiveMenu('configurations');
                  setConfigSubmenuOpen(!configSubmenuOpen);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeMenu === 'configurations'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                title="Configurations"
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-4 h-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Configurations</span>}
                </div>
                {!sidebarCollapsed && (
                  configSubmenuOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Submenu */}
              {!sidebarCollapsed && configSubmenuOpen && activeMenu === 'configurations' && (
                <div className="pl-7 pr-2 py-1.5 space-y-1 text-[11px] text-slate-400">
                  <div className="hover:text-white py-1 cursor-pointer">● Queue Routing</div>
                  <div className="hover:text-white py-1 cursor-pointer">● SLA & Limitlar</div>
                  <div className="hover:text-white py-1 cursor-pointer">● Tranzaksiya qulfi</div>
                </div>
              )}
            </div>

            {/* Staff */}
            <button
              onClick={() => setActiveMenu('staff')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeMenu === 'staff'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              title="Staff"
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Staff</span>}
            </button>

            {/* Services (with submenu) */}
            <div>
              <button
                onClick={() => {
                  setActiveMenu('services');
                  setServicesSubmenuOpen(!servicesSubmenuOpen);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeMenu === 'services'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                title="Services"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Services</span>}
                </div>
                {!sidebarCollapsed && (
                  servicesSubmenuOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {!sidebarCollapsed && servicesSubmenuOpen && activeMenu === 'services' && (
                <div className="pl-7 pr-2 py-1.5 space-y-1 text-[11px] text-slate-400">
                  <div className="hover:text-white py-1 cursor-pointer">● Prefikslar (X, Y, C...)</div>
                  <div className="hover:text-white py-1 cursor-pointer">● Vaqt me’yorlari</div>
                  <div className="hover:text-white py-1 cursor-pointer">● Oynalarga biriktirish</div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button
              onClick={() => setActiveMenu('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeMenu === 'settings'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </nav>
        </div>

        {/* Bottom shortcut */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={resetToDemo}
            className="w-full py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            title="Tizimni qayta tiklash"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            {!sidebarCollapsed && <span>Qayta tiklash</span>}
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="flex-1 p-5 sm:p-7 space-y-6 overflow-y-auto">
        
        {/* Top App Bar with Search, System Status, Notifications (matching Image 4) */}
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-30">
          
          {/* Search */}
          <div className="flex items-center gap-2.5 bg-[#111a33] border border-slate-800 focus-within:border-cyan-500 rounded-xl px-3.5 py-2 w-72 transition-colors">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Status Badges (All interactive!) */}
          <div className="flex items-center gap-3 text-xs relative">
            
            {/* System Status button (matching Image 4) */}
            <button
              onClick={() => setShowSystemStatusModal(!showSystemStatusModal)}
              className="flex items-center gap-2 bg-[#111a33] hover:bg-[#1a284e] border border-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-200 font-semibold">System Status</span>
            </button>

            {/* Notifications Bell with Badge 1 */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="p-2 rounded-xl bg-[#111a33] hover:bg-[#1a284e] border border-slate-800 text-slate-300 cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center">
                  1
                </span>
              </button>

              {/* Notifications Popover */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-white border-b border-slate-800 pb-2">
                    <span>Xabarnomalar (1 ta yangi)</span>
                    <button onClick={() => setShowNotificationsDropdown(false)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <span>⚠️ Qurilma Ogohlantirishi</span>
                    </div>
                    <p className="text-slate-300 mt-1 text-[11px]">
                      Counter-03 (192.168.1.2) oxirgi 20 soatdan beri oflayn holatda. Iltimos tarmoq ulanishini tekshiring.
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 block">15 daqiqa oldin</span>
                  </div>
                </div>
              )}
            </div>

            {/* Messages Icon with Badge 1 */}
            <div className="relative">
              <button
                onClick={() => setShowMessagesDropdown(!showMessagesDropdown)}
                className="p-2 rounded-xl bg-[#111a33] hover:bg-[#1a284e] border border-slate-800 text-slate-300 cursor-pointer relative"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                  1
                </span>
              </button>

              {/* Messages Popover */}
              {showMessagesDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-white border-b border-slate-800 pb-2">
                    <span>Tizim Chat Xabarlari</span>
                    <button onClick={() => setShowMessagesDropdown(false)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <div className="font-bold text-cyan-400 flex justify-between">
                      <span>Bosh Dispetcher</span>
                      <span className="text-[10px] text-slate-500">10:45</span>
                    </div>
                    <p className="text-slate-300 mt-1 text-[11px]">
                      Samarqand filialida navbatlar oqimi odatiy holatda, yuklama teng taqsimlanmoqda.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown with 'A' Icon (matching Image 4) */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 bg-[#111a33] hover:bg-[#1a284e] border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center">
                  A
                </div>
                <span className="text-slate-200 font-semibold">Profile</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Profile Menu Popover */}
              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 space-y-1 text-xs">
                  <div className="p-2 border-b border-slate-800">
                    <div className="font-bold text-white">Super Administrator</div>
                    <div className="text-[10px] text-slate-400">admin@bank.uz</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setActiveMenu('settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Tizim Sozlamalari
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      resetToDemo();
                      setNotification("Barcha namunaviy ma'lumotlar qayta tiklandi!");
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer text-blue-400"
                  >
                    Demoni qayta yuklash
                  </button>
                  <button
                    onClick={() => setShowProfileDropdown(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    Chiqish (Logout)
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Page Title */}
        <h2 className="text-2xl font-black text-white capitalize">{activeMenu}</h2>

        {notification && (
          <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* VIEW: DEVICES (matching Image 5) */}
        {activeMenu === 'devices' && (
          <div className="space-y-6">
            
            {/* Card 1: Device Management (matching Image 5) */}
            <div className="bg-[#111a33] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-white text-base">Device Management</h3>
                  <p className="text-xs text-slate-400">Filialdagi kiosklar, oynalar va printerlar nazorati</p>
                </div>

                {/* Right controls from Image 5: Total Active, Central Routing, Edit, Restarts */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Total Active Devices */}
                  <div className="text-right pr-4 border-r border-slate-800">
                    <div className="text-[11px] text-slate-400 font-semibold">Total Active Devices</div>
                    <div className="text-xl font-black text-cyan-400 font-mono">
                      {activeDevicesCount + 20}/25
                    </div>
                  </div>

                  {/* Central Queue Routing Switch (Interactive!) */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-medium">Central Queue Routing</span>
                    <button
                      onClick={() => {
                        const newVal = !centralQueueRouting;
                        setCentralQueueRouting(newVal);
                        setNotification(`Central Queue Routing: ${newVal ? "Yoqildi (Central Active)" : "O'chirildi (Distributed Mode)"}`);
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        centralQueueRouting ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          centralQueueRouting ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      ></div>
                    </button>
                  </div>

                  {/* Edit Dropdown (matching Image 5) */}
                  <div className="relative">
                    <button
                      onClick={() => setShowEditDeviceDropdown(!showEditDeviceDropdown)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <span>Edit</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {showEditDeviceDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 space-y-1 text-xs">
                        <button
                          onClick={() => {
                            setShowEditDeviceDropdown(false);
                            setShowAddDeviceModal(true);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4 text-cyan-400" />
                          <span>Yangi qurilma qo‘shish</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowEditDeviceDropdown(false);
                            setNotification('Barcha IP manzillar ping orqali tekshirildi (OK)!');
                            setTimeout(() => setNotification(null), 3000);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer flex items-center gap-2"
                        >
                          <Wifi className="w-4 h-4 text-emerald-400" />
                          <span>IP manzillarni tekshirish</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Restarts Dropdown (matching Image 5) */}
                  <div className="relative">
                    <button
                      onClick={() => setShowRestartsDropdown(!showRestartsDropdown)}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <span>Restarts</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {showRestartsDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-60 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 space-y-1 text-xs">
                        <button
                          onClick={handleRestartAll}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer flex items-center gap-2"
                        >
                          <RotateCw className="w-4 h-4 text-cyan-400" />
                          <span>Barcha qurilmalarni qayta yuklash</span>
                        </button>
                        <button
                          onClick={handleRestartOfflineOnly}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer flex items-center gap-2 text-amber-400"
                        >
                          <Power className="w-4 h-4" />
                          <span>Faqat oflayn qurilmalarni tiklash</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Devices Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3 w-8">
                        <input type="checkbox" className="rounded bg-slate-900 border-slate-700" />
                      </th>
                      <th className="p-3">Device Name</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Last Ping</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredDevices.map((dev) => (
                      <tr key={dev.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <input type="checkbox" className="rounded bg-slate-900 border-slate-700" />
                        </td>
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-cyan-400" />
                          {dev.name}
                        </td>
                        <td className="p-3 font-mono text-cyan-300">{dev.ipAddress}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              toggleDeviceStatus(dev.id);
                              setNotification(`${dev.name} holati o'zgartirildi.`);
                              setTimeout(() => setNotification(null), 2500);
                            }}
                            className={`px-3 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              dev.status === 'ONLINE'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                            }`}
                          >
                            {dev.status}
                          </button>
                        </td>
                        <td className="p-3 text-slate-400">{dev.lastPing}</td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-2 text-slate-400">
                            <button
                              onClick={() => handleRestart(dev.id, dev.name)}
                              title="Qayta yuklash (Restart)"
                              className="hover:text-cyan-400 p-1 cursor-pointer"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setNotification(`${dev.name} parametrlari tahrirlandi.`);
                                setTimeout(() => setNotification(null), 2000);
                              }}
                              title="Tahrirlash"
                              className="hover:text-white p-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                deleteDevice(dev.id);
                                setNotification(`${dev.name} qurilmasi o‘chirildi.`);
                                setTimeout(() => setNotification(null), 2500);
                              }}
                              title="O‘chirish"
                              className="hover:text-red-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-4 mt-2 border-t border-slate-800">
                <span>Page 1 of {Math.ceil(filteredDevices.length / 5) || 1}</span>
                <div className="flex items-center gap-1.5">
                  <span>Show page</span>
                  <button className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer">«</button>
                  <button className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer">&lt;</button>
                  <button className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold cursor-pointer">1</button>
                  <button className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer">&gt;</button>
                  <button className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer">»</button>
                </div>
              </div>
            </div>

            {/* Card 2: Service & Queue Configurations (matching 4-rasm) */}
            <div className="bg-[#111a33] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-white text-base">Service & Queue Configurations</h3>
                  <p className="text-xs text-slate-400">Xizmat prefikslari va xodimlar vakolatlari sozlamalari</p>
                </div>

                <button
                  onClick={() => setActiveMenu('staff')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>Assigned Staff</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Service Name</th>
                      <th className="p-3">Prefix</th>
                      <th className="p-3">Avg. Service Time</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Assigned Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {services.map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-bold text-white">{srv.name}</td>
                        <td className="p-3 font-mono text-cyan-400 font-bold">{srv.prefix}</td>
                        <td className="p-3 text-slate-400 font-mono">{srv.avgDurationMin || 15} min</td>
                        <td className="p-3">
                          <button
                            onClick={() => toggleServiceActive(srv.id)}
                            className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                              srv.active ? 'bg-cyan-500' : 'bg-slate-700'
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                srv.active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            ></div>
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold">
                            Assigned Staff ({staff.filter((s) => s.authorizedServiceIds.includes(srv.id)).length})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW: STAFF MANAGEMENT */}
        {activeMenu === 'staff' && (
          <div className="bg-[#111a33] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base">Staff & Operator Window Management</h3>
                <p className="text-xs text-slate-400">Xodimlarni oynalarga va xizmatlarga biriktirish</p>
              </div>
              <button
                onClick={() => {
                  setNotification("Yangi xodim qo'shish oynasi");
                  setTimeout(() => setNotification(null), 2000);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Xodim Qo‘shish</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1224] text-slate-400 uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Oyna</th>
                    <th className="p-3">Xodim</th>
                    <th className="p-3">Login/ID</th>
                    <th className="p-3">Holati</th>
                    <th className="p-3">Biriktirilgan Xizmatlar</th>
                    <th className="p-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-cyan-400 font-sans">{s.windowNumber}-Oyna</td>
                      <td className="p-3 font-semibold text-white">{s.name}</td>
                      <td className="p-3 font-mono text-slate-400">{s.login || 'OP-' + s.windowNumber}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          s.status === 'BUSY' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          s.status === 'PAUSED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {s.authorizedServiceIds.map((srvId) => {
                            const srv = services.find((sv) => sv.id === srvId);
                            return (
                              <span key={srvId} className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                                {srv?.prefix}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setNotification(`${s.name} xizmat vakolatlari saqlandi.`);
                            setTimeout(() => setNotification(null), 2500);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                        >
                          Tahrirlash
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: CONFIGURATIONS & SLA */}
        {activeMenu === 'configurations' && (
          <div className="bg-[#111a33] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Navbat Taqsimlash & Tranzaksiya Sozlamalari</h3>
              <p className="text-xs text-slate-400">PostgreSQL tranzaksiyalari, FIFO va yuklamani tenglashtirish parametrlari</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#0b1224] border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">Tranzaksiya Qulfi (Atomic Lock)</div>
                <p className="text-slate-400">
                  Parallel so‘rovlarda 1 ta navbatning ikki xodimga birikishini qat’iy bloklash mexanizmi.
                </p>
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  FAOL: SERIALIZABLE TRANSACTION LOCK
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#0b1224] border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">Round-Robin & Yuklama Balansi</div>
                <p className="text-slate-400">
                  Bir nechta xodim bo‘sh bo‘lsa, oxirgi xizmatni eng oldin yakunlagan operatorga ustunlik berish.
                </p>
                <span className="inline-block px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold text-[10px]">
                  FAOL: LEAST RECENTLY SERVED
                </span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: DASHBOARD OVERVIEW */}
        {activeMenu === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#111a33] border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Filiallar Soni</div>
              <div className="text-3xl font-black text-white">3 ta</div>
              <div className="text-[10px] text-cyan-400 mt-1">Samarqand, Toshkent, Chilonzor</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#111a33] border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Faol Qurilmalar</div>
              <div className="text-3xl font-black text-emerald-400">24/25</div>
              <div className="text-[10px] text-slate-400 mt-1">96% tizim tayyorligi</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#111a33] border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Markaziy Routing</div>
              <div className="text-3xl font-black text-cyan-400 font-mono">ON</div>
              <div className="text-[10px] text-emerald-400 mt-1">Cloud sync faol</div>
            </div>
          </div>
        )}

      </div>

      {/* System Status Interactive Modal (matching Image 4 click) */}
      {showSystemStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Tizim Salomatligi & Server Monitor</h3>
              </div>
              <button onClick={() => setShowSystemStatusModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">PostgreSQL DB:</div>
                <div className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Ulangan (Connected)
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">Redis Cache Ping:</div>
                <div className="font-bold text-cyan-400 font-mono mt-0.5">0.4 ms</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">WebSocket Klientlar:</div>
                <div className="font-bold text-white font-mono mt-0.5">14 ta jonli ulanish</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">Xprinter Termal Xizmati:</div>
                <div className="font-bold text-emerald-400 mt-0.5">Faol & Tayyor</div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowSystemStatusModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base">Yangi Qurilma Qo‘shish</h3>
              <button onClick={() => setShowAddDeviceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Qurilma nomi:</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Kiosk-02 yoki Counter-04"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">IP Manzili:</label>
                <input
                  type="text"
                  required
                  value={newDevIp}
                  onChange={(e) => setNewDevIp(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Turi:</label>
                <select
                  value={newDevType}
                  onChange={(e) => setNewDevType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                >
                  <option value="KIOSK">Kiosk Terminali</option>
                  <option value="OPERATOR">Operator Oynasi Kompyuteri</option>
                  <option value="DISPLAY">TV Display Tablo</option>
                  <option value="PRINTER">Xprinter Termal Printer</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold cursor-pointer"
                >
                  Qo‘shish
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-4 py-2.5 bg-slate-800 rounded-xl text-slate-300 cursor-pointer"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
