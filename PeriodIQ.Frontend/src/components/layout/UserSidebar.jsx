import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Edit3, Trophy, Settings as SettingsIcon, ShieldCheck, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function UserSidebar({ open, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/workout-plans', label: 'Workout Plan', icon: CalendarDays },
    { to: '/log-workout', label: 'Log Session', icon: Edit3 },
    { to: '/prs', label: 'PR History', icon: Trophy },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {open && <button aria-label="Đóng menu" className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />}
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform md:static md:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        
        {/* Profile Header */}
        <div className="flex h-24 items-center gap-3 border-b border-border px-5">
          <div className="h-12 w-12 shrink-0 rounded-full bg-muted border-2 border-lime-400 flex items-center justify-center text-lg font-bold overflow-hidden">
             {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-lime-600 dark:text-lime-400">Elite Performer</span>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Level 42 Athlete</span>
          </div>
          <button className="md:hidden ml-auto" onClick={onClose} aria-label="Đóng menu">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} 
              className={({ isActive }) => cn(
                'flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'bg-lime-400/20 text-lime-600 dark:text-lime-400 border-r-4 border-lime-400' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg'
              )}>
              {({ isActive }) => (
                <>
                  <Icon className="h-5 w-5 shrink-0" /> 
                  <span className={cn(isActive && 'font-bold')}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
          
          {isAdmin && (
            <div className="mt-8 pt-4 border-t border-border">
              <NavLink to="/admin" className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/30">
                <ShieldCheck className="h-5 w-5" /> Admin Zone
              </NavLink>
            </div>
          )}
        </nav>

        <div className="border-t border-border p-4 flex flex-col gap-3">
           <Button className="w-full bg-lime-400 text-black hover:bg-lime-500 font-bold tracking-wide uppercase py-6 text-sm">
              Start Training
           </Button>
           <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors py-2">
             <LogOut className="h-4 w-4" /> Đăng xuất
           </button>
        </div>
      </aside>
    </>
  );
}
