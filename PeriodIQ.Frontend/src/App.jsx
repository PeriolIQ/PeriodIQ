import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import MonitoringPage from './pages/admin/MonitoringPage';
import DeploysPage from './pages/admin/DeploysPage';
import DeployDetailPage from './pages/admin/DeployDetailPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminExercisesPage from './pages/admin/AdminExercisesPage';
import AdminRulesPage from './pages/admin/AdminRulesPage';
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage';
import WorkoutPlansPage from './pages/WorkoutPlansPage';

function Dashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">Chào mừng bạn đến với hệ thống quản lý giáo án PeriodIQ.</p>
    </div>
  );
}

function NotFound() {
  return <h2 className="text-3xl font-bold text-destructive">404 - Page Not Found</h2>;
}

// Header hiển thị sau khi đăng nhập
function AppHeader() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 flex-1">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <span className="text-violet-600 dark:text-violet-400">⚡ PeriodIQ</span>
        </Link>
        <Link to="/" className="text-foreground transition-colors hover:text-foreground">
          Trang Chủ
        </Link>
        <Link to="/exercises" className="text-muted-foreground transition-colors hover:text-foreground">
          Bài Tập
        </Link>
        <Link to="/workout-plans" className="text-muted-foreground transition-colors hover:text-foreground">
          Giáo Án
        </Link>
        {isAdmin && (
          <Link to="/admin" className="text-muted-foreground transition-colors hover:text-foreground">
            Quản trị
          </Link>
        )}
      </nav>

      {/* User section */}
      <div className="flex items-center gap-3 ml-auto">
        <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium hidden md:block">{user?.name || user?.email}</span>
        </Link>
        <button
          id="header-logout"
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

// Placeholder cho các trang admin chưa được nhóm khác triển khai
// (vd: /admin/rules, /admin/templates, /admin/exercises — phạm vi Người 4).
function AdminComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
      <p className="text-lg font-medium">Tính năng đang được xây dựng</p>
      <p className="text-sm text-muted-foreground">Trang này thuộc phạm vi phụ trách khác trong nhóm.</p>
    </div>
  );
}

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isAdminSection = location.pathname.startsWith('/admin');

  if (isLoading) return null;

  // Khu vực /admin/* dùng AdminLayout riêng (sidebar + header riêng),
  // không lồng thêm AppHeader của khu vực user.
  if (isAdminSection) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="rules" element={<AdminRulesPage />} />
          <Route path="templates" element={<AdminTemplatesPage />} />
          <Route path="exercises" element={<AdminExercisesPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="deploys" element={<DeploysPage />} />
          <Route path="deploys/:executionId" element={<DeployDetailPage />} />
          <Route path="*" element={<AdminComingSoon />} />
        </Route>
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {isAuthenticated && <AppHeader />}
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/workout-plans" element={<ProtectedRoute><WorkoutPlansPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
