import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import AdminLayout from './components/layout/AdminLayout';
import UserLayout from './components/layout/UserLayout';
import LoginPage from './pages/user/auth/LoginPage';
import RegisterPage from './pages/user/auth/RegisterPage';
import ForgotPasswordPage from './pages/user/auth/ForgotPasswordPage';
import ProfilePage from './pages/user/profile/ProfilePage';
import MonitoringPage from './pages/admin/MonitoringPage';
import DeploysPage from './pages/admin/DeploysPage';
import DeployDetailPage from './pages/admin/DeployDetailPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminExercisesPage from './pages/admin/AdminExercisesPage';
import AdminRulesPage from './pages/admin/AdminRulesPage';
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage';
import WorkoutPlansPage from './pages/user/workout-plans/WorkoutPlansPage';
import HomePage from './pages/user/home/HomePage';
import LogWorkout from './pages/user/log-workout/LogWorkout';
import Settings from './pages/user/settings/Settings';

function NotFound() {
  return <h2 className="text-3xl font-bold text-destructive">404 - Page Not Found</h2>;
}

// Placeholder cho các trang admin chưa được nhóm khác triển khai
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
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected user routes wrapped in UserLayout */}
      <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/workout-plans" element={<WorkoutPlansPage />} />
        <Route path="/log-workout" element={<LogWorkout />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
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
