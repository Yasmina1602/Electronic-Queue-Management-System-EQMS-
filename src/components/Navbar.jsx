import React from 'react';
import { useQueue } from '../context/QueueContext';
import {
  Smartphone,
  Briefcase,
  Monitor,
  BarChart3,
  Building2,
  Volume2,
  VolumeX,
  ExternalLink,
  Layers,
  Shield,
  TrendingUp,
} from 'lucide-react';

export function Navbar({ currentView, setCurrentView }) {
  const {
    branches,
    activeBranchId,
    setActiveBranchId,
    tickets,
    audioEnabled,
    setAudioEnabled,
    speechEnabled,
    setSpeechEnabled,
  } = useQueue();

  const waitingCount = tickets.filter(
    (t) => t.branchId === activeBranchId && t.status === 'WAITING'
  ).length;

  const navItems = [
    { id: 'staff', label: '1. Operator', icon: Briefcase, badge: waitingCount > 0 ? waitingCount : null },
    { id: 'manager', label: '2. Menejer Tahlil', icon: TrendingUp, badge: null },
    { id: 'admin', label: '3. Super Admin', icon: Shield, badge: null },
    { id: 'display', label: '4. Katta Tablo (TV)', icon: Monitor, badge: null },
  ];

  const handleOpenNewWindow = () => {
    window.open(window.location.href, '_blank', 'width=1200,height=800');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#091024]/90 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>ELEKTRON NAVBAT</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  ENTERPRISE
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Boshqaruv Tizimi</div>
            </div>
          </div>

          {/* Navigation Views Switcher */}
          <nav className="flex items-center gap-1 bg-[#111a33] p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="md:hidden">{item.label.split('.')[0]}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick link back to Customer Kiosk Terminal */}
          <button
            onClick={() => setCurrentView('kiosk')}
            title="Mijozlar terminaliga (Kiosk) o‘tish"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mijozlar Kioski (/)</span>
          </button>

          {/* Right Tools: Branch Selector & Audio Toggle */}
          <div className="flex items-center gap-2">
            
            {/* Branch Selector */}
            <div className="hidden xl:flex items-center gap-1.5 bg-[#111a33] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                setSpeechEnabled(!audioEnabled);
              }}
              title={audioEnabled ? "Ovozli e'lonlar yoqilgan" : "Ovoz o'chirilgan"}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                audioEnabled
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* New Window Button (To simulate multi-screen setup) */}
            <button
              onClick={handleOpenNewWindow}
              title="Yangi tabda ochish (Multi-ekran)"
              className="hidden sm:flex items-center gap-1 p-2 rounded-xl bg-[#111a33] hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
