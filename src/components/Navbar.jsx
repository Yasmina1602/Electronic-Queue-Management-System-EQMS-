import React from 'react';
import { useQueue } from '../context/QueueContext';
import {
  Smartphone,
  Briefcase,
  Monitor,
  Shield,
  Building2,
  Volume2,
  VolumeX,
  ExternalLink,
  Layers,
  Sparkles,
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

  // 4 ta alohida sahifa (Talab 1)
  const navItems = [
    { id: 'kiosk', label: '1. Mijoz Kioski', icon: Smartphone, badge: null },
    { id: 'staff', label: '2. Xodim (Operator)', icon: Briefcase, badge: waitingCount > 0 ? waitingCount : null },
    { id: 'display', label: '3. Elektron Navbat (Monitor)', icon: Monitor, badge: null },
    { id: 'admin', label: '4. Admin & Samaradorlik', icon: Shield, badge: null },
  ];

  const handleOpenNewWindow = () => {
    window.open(window.location.href, '_blank', 'width=1200,height=800');
  };

  return (
    <header className="sticky top-0 z-40 bg-emerald-950/95 backdrop-blur-xl border-b-2 border-emerald-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Title - Oq va To'q Yashil */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-emerald-950 flex items-center justify-center shadow-md font-black text-lg">
              <Layers className="w-5 h-5 text-emerald-900" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                <span>ELEKTRON NAVBAT</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-700">
                  QMS PRO
                </span>
              </div>
              <div className="text-[10px] font-medium text-emerald-300">
                Oq & To‘q Yashil Bank Tizimi
              </div>
            </div>
          </div>

          {/* Navigation Items (4 ta alohida sahifa) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-md border border-emerald-600 ring-2 ring-emerald-500/30'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-emerald-300" />
                  <span className="hidden md:inline">{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Branch Selector & Audio */}
          <div className="flex items-center gap-2">
            
            {/* Branch Selector */}
            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-900/90 border border-emerald-700/80 px-2.5 py-1.5 rounded-xl text-xs text-emerald-200">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-hidden cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-emerald-950 text-white">
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
              title={audioEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                audioEnabled
                  ? 'bg-emerald-800 border-emerald-600 text-emerald-200'
                  : 'bg-emerald-950 border-emerald-800 text-emerald-400 opacity-60'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Open in New Window */}
            <button
              onClick={handleOpenNewWindow}
              title="Yangi oynada ochish"
              className="p-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700 text-emerald-200 transition-all cursor-pointer hidden sm:block"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
