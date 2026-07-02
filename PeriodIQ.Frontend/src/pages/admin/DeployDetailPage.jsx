import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDeployDetail, getStatusVariant, STATUS_LABEL } from '@/services/deployService';
import { formatDuration } from '@/lib/utils';

export default function DeployDetailPage() {
  const { executionId } = useParams();
  const navigate = useNavigate();

  const { data: deploy, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['deploy', executionId],
    queryFn: () => getDeployDetail(executionId),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/deploys')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại danh sách
        </Button>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải chi tiết deploy...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">
          Không thể tải chi tiết deploy{error?.response?.status ? ` (HTTP ${error.response.status})` : ''}.
        </p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin lần deploy</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Commit</p>
                <p className="font-mono font-medium">{deploy.commitId?.slice(0, 8) ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Trạng thái</p>
                <Badge variant={getStatusVariant(deploy.status)} dot>
                  {STATUS_LABEL[deploy.status] || deploy.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Thời lượng</p>
                <p className="font-medium">{formatDuration(deploy.durationSeconds)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Thời gian bắt đầu</p>
                <p className="font-medium">
                  {deploy.startTime ? dayjs(deploy.startTime).format('HH:mm:ss DD/MM/YYYY') : '—'}
                </p>
              </div>
              {deploy.commitMessage && (
                <div className="sm:col-span-2 lg:col-span-4">
                  <p className="text-xs text-muted-foreground">Commit message</p>
                  <p className="font-medium">{deploy.commitMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {Array.isArray(deploy.stages) && deploy.stages.length > 0 && (() => {
            const maxStage = Math.max(...deploy.stages.map((s) => s.durationSeconds || 0), 1);
            const stageColor = (status) =>
              status === 'Succeeded' ? 'bg-emerald-500'
                : status === 'Failed' || status === 'Stopped' ? 'bg-red-500'
                : status === 'InProgress' ? 'bg-amber-500'
                : 'bg-muted-foreground';
            return (
              <Card>
                <CardHeader>
                  <CardTitle>Các stage</CardTitle>
                  <p className="text-xs text-muted-foreground">Độ dài thanh thể hiện thời lượng tương đối giữa các stage</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deploy.stages.map((stage) => (
                    <div key={stage.name} className="rounded-lg border border-border px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{stage.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums text-muted-foreground">{formatDuration(stage.durationSeconds)}</span>
                          <Badge variant={getStatusVariant(stage.status)}>{STATUS_LABEL[stage.status] || stage.status}</Badge>
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${stageColor(stage.status)}`}
                          style={{ width: `${Math.max(((stage.durationSeconds || 0) / maxStage) * 100, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })()}

          <Card>
            <CardHeader>
              <CardTitle>Build log (CodeBuild)</CardTitle>
            </CardHeader>
            <CardContent>
              {deploy.logs?.length ? (
                <pre className="max-h-[28rem] overflow-auto rounded-lg bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
                  {(Array.isArray(deploy.logs) ? deploy.logs.join('\n') : deploy.logs)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">Không có log để hiển thị.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
