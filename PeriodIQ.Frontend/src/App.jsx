import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

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

function App() {
  return (
    <Router>
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
          <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
              <span className="text-violet-600 dark:text-violet-400">PeriodIQ Admin</span>
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
        </header>

        <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
