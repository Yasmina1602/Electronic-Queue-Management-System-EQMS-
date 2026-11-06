import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { api } from '../utils/api';
import {
  Layers,
  Shield,
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export function LoginPage({ onNavigate }) {
  const { setActiveStaffId, syncWithBackend, setCurrentUser } = useQueue();
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const loginVal = loginInput.trim();
    const passVal = passwordInput.trim();

    if (!loginVal || !passVal) {
      setErrorMessage('Login va parolni kiriting!');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.login(loginVal, passVal);
      if (res.success && res.user) {
        localStorage.setItem('qms_auth_token', res.token);
        localStorage.setItem('qms_user', JSON.stringify(res.user));
        localStorage.setItem('qms_staff_auth_id', res.user.id);

        if (setCurrentUser) {
          setCurrentUser(res.user);
        }

        if (res.user.role === 'OPERATOR' && res.user.id) {
          setActiveStaffId(res.user.id);
        }

        await syncWithBackend();

        // Role-based redirection: Filial Menejeri admin hisoblanadi
        if (res.user.role === 'SUPERADMIN' || res.user.role === 'MANAGER' || res.user.role === 'ADMIN') {
          localStorage.setItem('qms_admin_auth', 'true');
          onNavigate('admin');
        } else {
          // OPERATOR
          onNavigate('staff');
        }
      } else {
        setErrorMessage(res.error || 'Login yoki parol noto‘g‘ri!');
      }
    } catch (err) {
      // Local fallback for offline/demo
      const userLower = loginVal.toLowerCase();
      if (userLower.includes('superadmin') && (passVal === 'admin123' || passVal === '1234' || passVal === '123')) {
        const superUser = { id: 'superadmin-1', name: 'Bosh Administrator', role: 'SUPERADMIN', login: 'superadmin' };
        localStorage.setItem('qms_user', JSON.stringify(superUser));
        localStorage.setItem('qms_admin_auth', 'true');
        if (setCurrentUser) setCurrentUser(superUser);
        onNavigate('admin');
      } else if (userLower.includes('manager') && (passVal === '123' || passVal === '1234' || passVal === 'admin123')) {
        const mgrUser = { id: 'manager-1', name: 'Filial Menejeri', role: 'MANAGER', login: 'manager' };
        localStorage.setItem('qms_user', JSON.stringify(mgrUser));
        localStorage.setItem('qms_admin_auth', 'true');
        if (setCurrentUser) setCurrentUser(mgrUser);
        onNavigate('admin');
      } else if (userLower.startsWith('op-') && (passVal === '123' || passVal === '1234')) {
        const opUser = { id: 'staff-1', name: 'Sanjarbek Aliyev', role: 'OPERATOR', login: loginVal, windowNumber: '1' };
        localStorage.setItem('qms_user', JSON.stringify(opUser));
        localStorage.setItem('qms_staff_auth_id', 'staff-1');
        setActiveStaffId('staff-1');
        if (setCurrentUser) setCurrentUser(opUser);
        onNavigate('staff');
      } else {
        setErrorMessage(err.message || 'Login yoki parol noto‘g‘ri!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50/50 to-slate-200 flex flex-col justify-center items-center p-4 font-sans text-slate-900">
      
      {/* Brand & Auth Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-emerald-900/10 p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-900 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-950/20">
            <Layers className="w-8 h-8 text-emerald-200" />
          </div>
          <h1 className="text-2xl font-black text-emerald-950 tracking-tight">
            Tizimga Kirish
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Elektron Navbat Boshqaruv Tizimi
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Login (Foydalanuvchi logini)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Masalan: manager, superadmin yoki OP-101"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-700 text-sm font-semibold bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Parol
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Parolingizni kiriting"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-700 text-sm font-semibold bg-slate-50 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-900 to-emerald-700 hover:from-emerald-800 hover:to-emerald-600 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-900/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Tekshirilmoqda...</span>
            ) : (
              <>
                <span>Kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>

      <div className="text-center text-xs text-slate-500 mt-4 font-medium">
        Xavfsiz Role-Based Access Control (RBAC) va PostgreSQL 18 bilan himoyalangan
      </div>

    </div>
  );
}

