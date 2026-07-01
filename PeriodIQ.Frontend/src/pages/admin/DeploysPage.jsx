import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { RefreshCw, GitCommitHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDeployHistory, getStatusVariant, STATUS_LABEL } from '@/services/deployService';
import { formatDuration } from '@/lib/utils';

export default function DeploysPage() {
  const navigate = useNavigate();
  const { data: deploys, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['deploys'],
    queryFn: getDeployHistory,
  });

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
