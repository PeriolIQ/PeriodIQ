import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { RefreshCw, CheckCircle2, XCircle, Clock, Server, Globe, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { checkHealth, getHistory, computeUptime } from '@/services/healthService';

// Tham chiếu Globals.Function.MemorySize trong template.yml — health endpoint
// hiện chưa trả về memory/region nên lấy từ cấu hình hạ tầng tĩnh + API URL.
const LAMBDA_MEMORY_MB = 512;
const POLL_INTERVAL_MS = 30_000;

function getRegionFromApiUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const match = apiUrl.match(/execute-api\.([a-z0-9-]+)\.amazonaws\.com/i);
  return match?.[1] || import.meta.env.VITE_AWS_REGION || 'N/A';
}

export default function MonitoringPage() {
  const { data: record, isFetching, refetch } = useQuery({
    queryKey: ['health-check'],
    queryFn: checkHealth,
    refetchInterval: POLL_INTERVAL_MS,
  });

  // record thay đổi sau mỗi lần poll -> đọc lại lịch sử local để tính uptime %.
  const history = record ? getHistory() : [];
  const uptime = computeUptime(history);

  const isHealthy = record?.ok;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Theo dõi tình trạng API và hạ tầng PeriodIQ theo thời gian thực.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Health status card */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!record ? (
              <p className="text-sm text-muted-foreground">Đang kiểm tra...</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {isHealthy ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  <Badge variant={isHealthy ? 'success' : 'error'} dot>
                    {isHealthy ? 'Hoạt động bình thường' : 'Sự cố'}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Response time: <span className="font-medium text-foreground">{record.latencyMs} ms</span>
                  </p>
                  <p>
                    Kiểm tra lúc:{' '}
                    <span className="font-medium text-foreground">
                      {dayjs(record.timestamp).format('HH:mm:ss DD/MM/YYYY')}
                    </span>
                  </p>
                  {!isHealthy && record.error && (
                    <p className="text-red-500">Lỗi: {record.error}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Uptime indicator */}
        <Card>
          <CardHeader>
            <CardTitle>Uptime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uptime === null ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : (
              <>
                <p className="text-3xl font-bold">{uptime.toFixed(1)}%</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${uptime >= 99 ? 'bg-emerald-500' : uptime >= 95 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${uptime}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Dựa trên {history.length} lần kiểm tra gần nhất (client-side)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* System info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Server className="h-3.5 w-3.5" /> API version</span>
              <span className="font-medium">{record?.data?.version ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Cpu className="h-3.5 w-3.5" /> Lambda memory</span>
              <span className="font-medium">{LAMBDA_MEMORY_MB} MB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Globe className="h-3.5 w-3.5" /> Region</span>
              <span className="font-medium">{getRegionFromApiUrl()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Environment</span>
              <span className="font-medium">{record?.data?.environment ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Commit</span>
              <span className="font-mono text-xs font-medium">{record?.data?.commit ?? 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
