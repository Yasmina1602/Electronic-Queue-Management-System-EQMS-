import React, { useState, useEffect } from 'react';
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
  BarChart2,
  LogIn,
  LogOut,
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
    currentUser,
    setCurrentUser,
    logoutUser,
  } = useQueue();

  // Har safar sahifa o'zgarganda foydalanuvchi sessiyasini yangilab borish
  useEffect(() => {
    try {
      const u = localStorage.getItem('qms_user');
      setCurrentUser(u ? JSON.parse(u) : null);
    } catch {
      setCurrentUser(null);
    }
  }, [currentView, setCurrentUser]);

  const waitingCount = tickets.filter(
    (t) => t.branchId === activeBranchId && t.status === 'WAITING'
  ).length;

  // Planshet (Kiosk) va Televizor (Display) rejimlarida Navbar faqat tizimga kirmagan mijozlar uchun yashirin
  if ((currentView === 'kiosk' || currentView === 'display') && !currentUser) {
    return null;
  }

  // Avatar uchun 2 ta bosh harfni hisoblash (SA, MG, yoki xodim ism/fam)
  const getAvatarInitials = (user) => {
    if (!user) return '??';
    if (user.role === 'SUPERADMIN') return 'SA';
    if (user.role === 'MANAGER' || user.role === 'ADMIN') return 'MG';

    // Xodim uchun (ism va familiyadan 2 ta harf)
    if (user.name) {
      const parts = user.name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      if (parts.length === 1 && parts[0].length >= 2) {
        return parts[0].substring(0, 2).toUpperCase();
      }
    }
    return (user.login || 'OP').substring(0, 2).toUpperCase();
  };

  // Rollar: Superadmin va Admin uchun Kiosk va Tablo o'tish paneli qo'shildi
  let navItems = [];
  if (currentUser?.role === 'OPERATOR') {
    navItems = [
      { id: 'staff', label: 'Operator Ish Stoli', icon: Briefcase, badge: waitingCount > 0 ? waitingCount : null },
    ];
  } else if (currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN') {
    navItems = [
      { id: 'admin', label: 'Admin Paneli', icon: Shield, badge: null },
      { id: 'manager', label: 'Menejer Paneli', icon: BarChart2, badge: null },
      { id: 'kiosk', label: 'Kiosk', title: 'Kiosk Terminali', icon: Smartphone, badge: null },
      { id: 'display', label: 'Tablo', title: 'Katta Tablo Monitor', icon: Monitor, badge: null },
    ];
  }

  const handleOpenNewWindow = () => {
    window.open(window.location.href, '_blank', 'width=1200,height=800');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentView('login');
  };

  return (
    <header className="sticky top-0 z-40 bg-emerald-950/95 backdrop-blur-xl border-b-2 border-emerald-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Title */}
          <div
            onClick={() => {
              if (currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN') {
                setCurrentView('admin');
              } else if (currentUser?.role === 'OPERATOR') {
                setCurrentView('staff');
              } else {
                setCurrentView('login');
              }
            }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-white text-emerald-950 flex items-center justify-center shadow-md font-black text-lg">
              <Layers className="w-5 h-5 text-emerald-900" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                <span>ELEKTRON NAVBAT</span>
              </div>
            </div>
          </div>

          {/* Navigation Items (Rollar bo'yicha filtrlangan) */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  title={item.title || item.label}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-md border border-emerald-600 ring-2 ring-emerald-500/30'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-emerald-300" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: User Profile / Login, Branch Selector, Audio */}
          <div className="flex items-center gap-2">
            
            {/* User Auth Info: Aylana shaklidagi avatar (MG, SA, xodim ism/fam) */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-emerald-900/80 border border-emerald-700/80 p-1 pl-1.5 pr-1.5 rounded-full shadow-sm">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white shadow-md select-none border-2 transition-transform hover:scale-105 ${
                    currentUser.role === 'SUPERADMIN'
                      ? 'bg-gradient-to-tr from-purple-800 to-purple-600 border-purple-300'
                      : currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN'
                      ? 'bg-gradient-to-tr from-teal-800 to-teal-600 border-teal-300'
                      : 'bg-gradient-to-tr from-emerald-800 to-emerald-600 border-emerald-300'
                  }`}
                  title={`${currentUser.name || 'Foydalanuvchi'} (${currentUser.role === 'MANAGER' ? 'ADMIN' : currentUser.role})`}
                >
                  {getAvatarInitials(currentUser)}
                </div>
                <button
                  onClick={handleLogout}
                  title="Tizimdan chiqish"
                  className="p-1 rounded-full text-emerald-300 hover:text-rose-300 hover:bg-emerald-800/80 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentView('login')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  currentView === 'login'
                    ? 'bg-white text-emerald-950 border-white'
                    : 'bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border-emerald-700'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Kirish</span>
              </button>
            )}

            {/* Filial (Yagona Markaziy Filial) */}
            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-900/90 border border-emerald-700/80 px-2.5 py-1.5 rounded-xl text-xs text-emerald-200">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-white">Markaziy Bosh Filial</span>
            </div>

            {/* Audio Toggle: ONLY SUPERADMIN and MANAGER can control sound */}
            {currentUser && (currentUser.role === 'SUPERADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
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
            )}

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
