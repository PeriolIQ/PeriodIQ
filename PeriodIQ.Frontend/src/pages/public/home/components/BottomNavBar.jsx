import { LayoutDashboard, Dumbbell, LineChart, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BottomNavBar() {
  const { t } = useTranslation();

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-[#0e0e0e] border-t border-[#353534] rounded-t-lg shadow-lg">
      <Link className="flex flex-col items-center justify-center text-slate-400 p-2 hover:text-[#0056b3] transition-all" to="/dashboard">
        <LayoutDashboard className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-semibold">{t('home.nav_dashboard')}</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-[#0056b3] bg-[#3378c7]/10 rounded-xl p-2 border border-[#0056b3]/20 scale-90 duration-150" to="/workout-plans">
        <Dumbbell className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-bold">{t('home.nav_training')}</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-slate-400 p-2 hover:text-[#0056b3] transition-all" to="/profile">
        <LineChart className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-semibold">{t('home.nav_progress')}</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-slate-400 p-2 hover:text-[#0056b3] transition-all" to="/profile">
        <User className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-semibold">{t('home.nav_profile')}</span>
      </Link>
    </nav>
  );
}
