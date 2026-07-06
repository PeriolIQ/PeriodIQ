import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import logoImg from '@/assets/logo2.png';
import { useTranslation } from 'react-i18next';

export default function TopAppBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="flex justify-between items-center w-full px-6 py-3 fixed top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="flex items-center gap-3">
        <img alt="PeriodIQ Brand Logo" className="h-8 w-8 object-cover rounded-full" src={logoImg} />
        <Link to="/home" className="text-2xl font-black text-white uppercase tracking-tighter">
          Period<span className="text-blue-500">IQ</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="hidden flex-col items-end text-right sm:flex hover:opacity-80 transition-opacity">
              <span className="text-sm font-semibold text-slate-200">
                {user?.name || user?.email || t('sidebar.user')}
              </span>
            </Link>
            <Link to="/dashboard" className="hover:opacity-80 transition-opacity" title="Vào Dashboard">
              <div className="h-9 w-9 rounded-full bg-blue-600 border border-blue-500/50 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_10px_rgba(37,99,235,0.4)]">
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
            </Link>
            <button
              onClick={logout}
              className="text-sm text-slate-400 hover:text-red-400 transition-colors ml-2"
            >
              {t('home.logout')}
            </button>
          </div>
        ) : (
          <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            {t('home.login')}
          </Link>
        )}
      </div>
    </header>
  );
}
