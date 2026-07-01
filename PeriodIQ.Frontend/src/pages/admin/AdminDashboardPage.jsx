import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, ClipboardList, Dumbbell, ListChecks, RefreshCw, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAdminStats } from '@/services/adminMasterDataService';

const shortcuts = [
  { to: '/admin/rules', label: 'Bộ luật', icon: ListChecks, detail: 'Volume, CNS, progression' },
  { to: '/admin/templates', label: 'Mẫu giáo án', icon: ClipboardList, detail: 'Khung ngày tập' },
  { to: '/admin/exercises', label: 'Bài tập', icon: Dumbbell, detail: 'Master data bài tập' },
  { to: '/admin/monitoring', label: 'Giám sát', icon: Activity, detail: 'Health và uptime' },
  { to: '/admin/deploys', label: 'Deploy', icon: Rocket, detail: 'Pipeline history' },
];

function metric(data, key) {
  const pascalKey = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  return data?.[key] ?? data?.[pascalKey] ?? 0;
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  });

  const activeRules = metric(data, 'activeRules');
  const totalRules = metric(data, 'totalRules');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tổng quan</h2>
          <p className="mt-1 text-sm text-muted-foreground">Bảng điều khiển quản trị dữ liệu và vận hành PeriodIQ.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {isError && (
        <Card>
          <CardContent className="pt-5 text-sm text-red-500">
            Không thể tải thống kê{error?.response?.status ? ` (HTTP ${error.response.status})` : ''}.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Bài tập" value={metric(data, 'totalExercises')} loading={isLoading} />
        <MetricCard label="Mẫu giáo án" value={metric(data, 'totalWorkoutTemplates')} loading={isLoading} />
        <MetricCard label="Bộ luật active" value={`${activeRules}/${totalRules}`} loading={isLoading} />
        <MetricCard label="Giáo án đã tạo" value={metric(data, 'totalWorkoutPlans')} loading={isLoading} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Khu vực quản trị</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {shortcuts.map(({ to, label, icon: Icon, detail }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/60"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{detail}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rule Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Luật đang bật</span>
              <Badge variant={activeRules > 0 ? 'success' : 'warning'} dot>
                {activeRules}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Template khả dụng</span>
              <span className="font-medium">{metric(data, 'totalWorkoutTemplates')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active plans</span>
              <span className="font-medium">{metric(data, 'activeWorkoutPlans')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, loading }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{loading ? '—' : value}</p>
      </CardContent>
    </Card>
  );
}
