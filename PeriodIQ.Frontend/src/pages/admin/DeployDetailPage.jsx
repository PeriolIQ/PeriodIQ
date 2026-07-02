import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PipelineFlow from '@/components/deploy/PipelineFlow';
import StageLogPanel from '@/components/deploy/StageLogPanel';
import { getDeployDetail, getStatusVariant, STATUS_LABEL } from '@/services/deployService';
import { formatDuration } from '@/lib/utils';

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function DeployDetailPage() {
  const { executionId } = useParams();
  const navigate = useNavigate();

  const {
    data: deploy,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['deploy', executionId],
    queryFn: () => getDeployDetail(executionId),
    // Realtime: khi pipeline đang chạy, tự lấy lại chi tiết (gồm build log) mỗi 3s; dừng khi kết thúc.
    refetchInterval: (query) => (query.state.data?.status === 'InProgress' ? 3000 : false),
    refetchIntervalInBackground: false,
  });

  const stages = Array.isArray(deploy?.stages) ? deploy.stages : [];
  const isLive = deploy?.status === 'InProgress';

  // Đồng hồ nhảy mỗi giây khi đang chạy để thời lượng stage + thanh tiến độ cập nhật realtime.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isLive) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLive]);

  // Trạng thái đóng/mở của từng panel stage (điều khiển từ page để sơ đồ có thể "nhảy tới" stage).
  const [openMap, setOpenMap] = useState({});
  const [activeStage, setActiveStage] = useState(null);
  const inited = useRef(false);

  // Lần đầu có dữ liệu: tự xổ MỌI stage có log (hoặc đang chạy) — không cần bấm.
  useEffect(() => {
    if (inited.current) return;
    const list = Array.isArray(deploy?.stages) ? deploy.stages : [];
    if (list.length === 0) return;
    inited.current = true;
    const openInit = {};
    list.forEach((s) => {
      if ((s.logs?.length ?? 0) > 0 || s.status === 'InProgress') openInit[s.name] = true;
    });
    setOpenMap(openInit);
    const target =
      list.find((s) => s.status === 'InProgress') ||
      [...list].reverse().find((s) => (s.logs?.length ?? 0) > 0) ||
      list[list.length - 1];
    if (target) setActiveStage(target.name);
  }, [deploy]);

  const handleSelect = (name) => {
    setOpenMap((m) => ({ ...m, [name]: true }));
    setActiveStage(name);
    // Chờ panel mở rồi cuộn tới.
    requestAnimationFrame(() => {
      document.getElementById(`stage-${slugify(name)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/deploys')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại danh sách
        </Button>
        <div className="flex items-center gap-3">
          {!isLoading && !isError && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {isLive ? 'Đang cập nhật realtime · ' : ''}
              Cập nhật lúc {dayjs(dataUpdatedAt).format('HH:mm:ss')}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải chi tiết deploy...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">
          Không thể tải chi tiết deploy{error?.response?.status ? ` (HTTP ${error.response.status})` : ''}.
        </p>
      ) : (
        <>
          {/* Sơ đồ cây các stage — ở đầu trang */}
          {stages.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Sơ đồ pipeline</CardTitle>
                  {isLive && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/70" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                      </span>
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Bấm vào một stage để xem build log của stage đó</p>
              </CardHeader>
              <CardContent>
                <PipelineFlow stages={stages} activeStage={activeStage} onSelect={handleSelect} now={now} />
              </CardContent>
            </Card>
          )}

          {/* Thông tin chung */}
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

          {/* Build log theo từng stage — cột trung tâm, thu hẹp 2 bên */}
          <div className="mx-auto w-full max-w-5xl space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">Build log theo stage</h3>
            </div>
            {stages.length > 0 ? (
              stages.map((stage) => (
                <StageLogPanel
                  key={stage.name}
                  stage={stage}
                  now={now}
                  open={!!openMap[stage.name]}
                  onOpenChange={(v) => {
                    setOpenMap((m) => ({ ...m, [stage.name]: v }));
                    if (v) setActiveStage(stage.name);
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Không có stage nào để hiển thị.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
