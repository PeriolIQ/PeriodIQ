import { Menu } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const PAGE_TITLES = [
  { match: /^\/workout-plans/, title: 'Giáo án' },
  { match: /^\/log-workout/, title: 'Ghi Log Buổi Tập' },
  { match: /^\/exercises/, title: 'Bài tập' },
  { match: /^\/settings/, title: 'Cài đặt' },
  { match: /^\/profile/, title: 'Hồ sơ cá nhân' },
  { match: /^\/$/, title: 'Tổng quan' },
];

function getPageTitle(pathname) {
  return PAGE_TITLES.find((p) => p.match.test(pathname))?.title ?? 'PeriodIQ';
}

export default function UserHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="md:hidden sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4">
      <button className="md:hidden" onClick={onMenuClick} aria-label="Mở menu">
        <Menu className="h-5 w-5" />
      </button>
      
      <h1 className="text-lg font-semibold">{getPageTitle(location.pathname)}</h1>
      
      <div className="ml-auto flex items-center gap-3">
        <Link to="/profile" className="hidden flex-col items-end text-right sm:flex hover:opacity-80 transition-opacity">
          <span className="text-sm font-medium leading-none">{user?.name || user?.email}</span>
        </Link>
        <Link to="/profile" className="hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
