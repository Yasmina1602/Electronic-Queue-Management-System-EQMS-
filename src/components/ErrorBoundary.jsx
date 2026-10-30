import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('QMS Application Error Caught:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b1329] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#111a33] border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white">Sahifani yuklashda xatolik yuz berdi</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Brauzerdagi ma’lumotlar yangilanishi sababli kutilmagan holat yuz berdi. Quyidagi tugma orqali tizimni toza holatda qayta tiklashingiz mumkin.
            </p>

            {this.state.error && (
              <div className="bg-[#0b1224] p-3 rounded-xl border border-slate-800 text-[11px] text-red-400 font-mono text-left max-h-24 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tizimni Qayta Tiklash</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.search = '?view=kiosk';
                }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Bosh sahifa
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
