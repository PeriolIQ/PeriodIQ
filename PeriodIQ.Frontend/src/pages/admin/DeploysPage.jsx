import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { RefreshCw, GitCommitHorizontal, CheckCircle2, XCircle, Timer, ListChecks } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDeployHistory, getStatusVariant, STATUS_LABEL } from '@/services/deployService';
import { formatDuration } from '@/lib/utils';
import DonutGauge from '@/components/charts/DonutGauge';
import BarChart from '@/components/charts/BarChart';

function statusBarColor(status) {
  switch (status) {
    case 'Succeeded': return 'bg-emerald-500';
    case 'Failed':
    case 'Stopped': return 'bg-red-500';
    case 'InProgress': return 'bg-amber-500';
    default: return 'bg-muted-foreground';
  }
}

export default function DeploysPage() {
  const navigate = useNavigate();
  const { data: deploys, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['deploys'],
    queryFn: getDeployHistory,
  });

  const stats = useMemo(() => {
    if (!deploys?.length) return null;
    const total = deploys.length;
    const succeeded = deploys.filter((d) => d.status === 'Succeeded').length;
    const failed = deploys.filter((d) => d.status === 'Failed' || d.status === 'Stopped').length;
    const durations = deploys.filter((d) => d.durationSeconds != null).map((d) => d.durationSeconds);
    const avgDuration = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

    // Bar chart: thời lượng các lần deploy gần nhất (cũ -> mới, đọc trái sang phải).
    const durationBars = [...deploys]
      .slice(0, 12)
      .reverse()
      .map((d) => ({
        value: d.durationSeconds ?? 0,
        label: d.commitId ? d.commitId.slice(0, 6) : '—',
        caption: d.startTime ? dayjs(d.startTime).format('HH:mm DD/MM') : '',
        colorClass: statusBarColor(d.status),
      }));

    return {
      total,
      succeeded,
      failed,
      avgDuration,
      successRate: (succeeded / total) * 100,
      durationBars,
    };
  }, [deploys]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Lịch sử các lần chạy CodePipeline — bấm vào một dòng để xem build log chi tiết.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Success rate donut */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" /> Tỉ lệ thành công
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-around gap-4">
              <DonutGauge
                value={stats.successRate}
                colorClass={stats.successRate >= 90 ? 'text-emerald-500' : stats.successRate >= 70 ? 'text-amber-500' : 'text-red-500'}
                sublabel={`${stats.succeeded}/${stats.total}`}
              />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-muted-foreground">Thành công</span>
                  <span className="ml-auto font-semibold tabular-nums">{stats.succeeded}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">Thất bại</span>
                  <span className="ml-auto font-semibold tabular-nums">{stats.failed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">TB thời lượng</span>
                  <span className="ml-auto font-semibold tabular-nums">{formatDuration(stats.avgDuration)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duration bar chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" /> Thời lượng deploy gần đây
              </CardTitle>
              <p className="text-xs text-muted-foreground">Cũ → mới · màu theo trạng thái · rê chuột để xem chi tiết</p>
            </CardHeader>
            <CardContent>
              <BarChart data={stats.durationBars} height={170} valueFormatter={formatDuration} />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Đang tải lịch sử deploy...</div>
          ) : isError ? (
            <div className="p-6 text-sm text-red-500">
              Không thể tải lịch sử deploy
              {error?.response?.status ? ` (HTTP ${error.response.status})` : ''}. Vui lòng thử lại.
            </div>
          ) : !deploys?.length ? (
            <div className="p-6 text-sm text-muted-foreground">Chưa có lần deploy nào.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Commit</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 font-medium">Thời lượng</th>
                  <th className="px-5 py-3 font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {deploys.map((d) => (
                  <tr
                    key={d.executionId}
                    onClick={() => navigate(`/admin/deploys/${d.executionId}`)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <GitCommitHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-mono text-xs font-medium">
                            {d.commitId ? d.commitId.slice(0, 8) : '—'}
                          </p>
                          {d.commitMessage && (
                            <p className="max-w-xs truncate text-xs text-muted-foreground">{d.commitMessage}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={getStatusVariant(d.status)} dot>
                        {STATUS_LABEL[d.status] || d.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDuration(d.durationSeconds)}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {d.startTime ? dayjs(d.startTime).format('HH:mm:ss DD/MM/YYYY') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
