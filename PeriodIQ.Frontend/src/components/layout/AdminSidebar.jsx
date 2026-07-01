import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  ClipboardList,
  Dumbbell,
  Activity,
  Rocket,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/rules', label: 'Bộ luật', icon: ListChecks },
  { to: '/admin/templates', label: 'Mẫu giáo án', icon: ClipboardList },
  { to: '/admin/exercises', label: 'Bài tập', icon: Dumbbell },
  { to: '/admin/monitoring', label: 'Giám sát hệ thống', icon: Activity },
  { to: '/admin/deploys', label: 'Lịch sử Deploy', icon: Rocket },
];

/**
 * Sidebar dùng chung cho toàn bộ khu vực /admin/*.
 * Cố định trên desktop, trượt ra (drawer) trên mobile.
 */
export default function AdminSidebar({ open, onClose }) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform md:static md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <span className="text-lg font-semibold">
            <span className="text-violet-600 dark:text-violet-400">⚡ PeriodIQ</span>
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">Admin</span>
          </span>
          <button className="md:hidden" onClick={onClose} aria-label="Đóng menu">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ← Về trang chính
          </NavLink>
        </div>
      </aside>
    </>
  );
}
