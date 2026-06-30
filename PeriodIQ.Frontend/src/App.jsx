import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';

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
  const { user, logout } = useAuth();
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

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {isAuthenticated && <AppHeader />}
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Routes>
          {/* Public routes */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

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

