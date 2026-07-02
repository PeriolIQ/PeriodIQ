import { Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const PAGE_TITLES = [
  { match: /^\/admin\/monitoring/, title: 'Giám sát hệ thống' },
  { match: /^\/admin\/deploys\/.+/, title: 'Chi tiết Deploy' },
  { match: /^\/admin\/deploys/, title: 'Lịch sử Deploy' },
  { match: /^\/admin\/rules/, title: 'Bộ luật Rule Engine' },
  { match: /^\/admin\/templates/, title: 'Mẫu giáo án' },
  { match: /^\/admin\/exercises/, title: 'Bài tập' },
  { match: /^\/admin$/, title: 'Tổng quan' },
];

function getPageTitle(pathname) {
  return PAGE_TITLES.find((p) => p.match.test(pathname))?.title ?? 'Admin';
}

export default function AdminHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6">
      <button className="md:hidden" onClick={onMenuClick} aria-label="Mở menu">
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-semibold">{getPageTitle(location.pathname)}</h1>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden flex-col items-end text-right sm:flex">
          <span className="text-sm font-medium leading-none">{user?.name || user?.email}</span>
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">
          {(user?.name || user?.email || 'A')[0].toUpperCase()}
        </div>
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
