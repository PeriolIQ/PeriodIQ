import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  RefreshCw, CheckCircle2, XCircle, AlertCircle, Server, Globe, Cpu,
  Activity, Gauge, BellRing, FileText, ExternalLink, Database, Zap,
  PieChart, BarChart3, TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { checkHealth, getHistory, computeUptime } from '@/services/healthService';
import {
  getMonitoringOverview, getMonitoringMetrics, ALARM_STATE, prettyAlarmName, formatBytes,
} from '@/services/monitoringService';
import AreaChart from '@/components/charts/AreaChart';
import DonutGauge from '@/components/charts/DonutGauge';
import DonutChart from '@/components/charts/DonutChart';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import StackedBar from '@/components/charts/StackedBar';
import StatusStrip from '@/components/charts/StatusStrip';
import { cn } from '@/lib/utils';

const LAMBDA_MEMORY_MB = 512;
const POLL_INTERVAL_MS = 30_000;
const CW_POLL_MS = 60_000;

// Màu series (thứ tự cố định, phân biệt tốt) cho biểu đồ đường.
const SERIES_COLOR = { sky: '#0ea5e9', violet: '#8b5cf6', amber: '#f59e0b', red: '#ef4444', emerald: '#10b981' };

const TONES = {
  emerald: { grad: 'from-emerald-500/15', chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', val: 'text-emerald-600 dark:text-emerald-400' },
  red: { grad: 'from-red-500/15', chip: 'bg-red-500/15 text-red-600 dark:text-red-400', val: 'text-red-600 dark:text-red-400' },
  amber: { grad: 'from-amber-500/15', chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', val: 'text-amber-600 dark:text-amber-400' },
  sky: { grad: 'from-sky-500/15', chip: 'bg-sky-500/15 text-sky-600 dark:text-sky-400', val: 'text-foreground' },
};

function getRegionFromApiUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const match = apiUrl.match(/execute-api\.([a-z0-9-]+)\.amazonaws\.com/i);
  return match?.[1] || import.meta.env.VITE_AWS_REGION || 'N/A';
}

function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      LIVE
    </span>
  );
}

function StatTile({ icon: Icon, label, value, sub, tone = 'sky', delay = 0 }) {
  const t = TONES[tone] ?? TONES.sky;
  return (
    <Card
      className="relative overflow-hidden transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-3 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent', t.grad)} />
      <CardContent className="relative flex items-center gap-4 p-5">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', t.chip)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn('text-xl font-bold tabular-nums', t.val)}>{value}</p>
          {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon: Icon, title, desc, tone = 'sky', right }) {
  const t = TONES[tone] ?? TONES.sky;
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', t.chip)}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function alarmVisual(state) {
  if (state === 'OK') return { Icon: CheckCircle2, cls: 'text-emerald-500', border: 'border-l-emerald-500', tint: 'from-emerald-500/[0.06]', pulse: false };
  if (state === 'ALARM') return { Icon: XCircle, cls: 'text-red-500', border: 'border-l-red-500', tint: 'from-red-500/[0.1]', pulse: true };
  return { Icon: AlertCircle, cls: 'text-muted-foreground', border: 'border-l-muted-foreground/40', tint: 'from-muted/40', pulse: false };
}

export default function MonitoringPage() {
  const { data: record, isFetching, refetch } = useQuery({
    queryKey: ['health-check'], queryFn: checkHealth, refetchInterval: POLL_INTERVAL_MS,
  });
  const { data: overview, refetch: refetchOverview, isFetching: fetchingOverview } = useQuery({
    queryKey: ['monitoring-overview'], queryFn: getMonitoringOverview, refetchInterval: CW_POLL_MS,
  });
  const { data: metrics = [] } = useQuery({
    queryKey: ['monitoring-metrics'], queryFn: () => getMonitoringMetrics(3), refetchInterval: CW_POLL_MS,
  });

  const history = record ? getHistory() : [];
  const uptime = computeUptime(history);
  const isHealthy = record?.ok;

  const latencySeries = history
    .filter((h) => h.ok && h.latencyMs != null)
    .slice(-40)
    .map((h) => ({ value: h.latencyMs, label: dayjs(h.timestamp).format('HH:mm:ss') }));
  const okLatencies = latencySeries.map((p) => p.value);
  const avgLatency = okLatencies.length ? Math.round(okLatencies.reduce((a, b) => a + b, 0) / okLatencies.length) : null;
  const peakLatency = okLatencies.length ? Math.max(...okLatencies) : null;

  const uptimeColor = uptime == null ? 'text-muted-foreground'
    : uptime >= 99 ? 'text-emerald-500' : uptime >= 95 ? 'text-amber-500' : 'text-red-500';
  const uptimeTone = uptime == null ? 'sky' : uptime >= 99 ? 'emerald' : uptime >= 95 ? 'amber' : 'red';

  const alarms = overview?.alarms ?? [];
  const alarmCounts = {
    alarm: alarms.filter((a) => a.state === 'ALARM').length,
    ok: alarms.filter((a) => a.state === 'OK').length,
    insufficient: alarms.filter((a) => a.state === 'INSUFFICIENT_DATA').length,
  };
  const seriesById = Object.fromEntries(metrics.map((s) => [s.id, s]));
  const sumSeries = (id) => Math.round((seriesById[id]?.points ?? []).reduce((a, p) => a + (p.value || 0), 0));
  const toXY = (id) => (seriesById[id]?.points ?? []).map((p) => ({ value: p.value, label: dayjs(p.timestamp).format('HH:mm') }));

  // Biểu đồ đường lớn theo thời gian (gộp các metric cùng đơn vị)
  const invocationSeries = [
    { id: 'api', label: 'API', color: SERIES_COLOR.sky, data: toXY('api_invocations') },
    { id: 'worker', label: 'Worker', color: SERIES_COLOR.violet, data: toXY('worker_invocations') },
  ];
  const errorSeries = [
    { id: 'api_err', label: 'API errors', color: SERIES_COLOR.red, data: toXY('api_errors') },
    { id: 'worker_err', label: 'Worker errors', color: SERIES_COLOR.amber, data: toXY('worker_errors') },
    { id: 'e5xx', label: 'Lỗi 5xx', color: SERIES_COLOR.violet, data: toXY('error_count_5xx') },
    { id: 'throttle', label: 'DynamoDB throttle', color: SERIES_COLOR.sky, data: toXY('dynamo_throttled') },
  ];
  const durationRaw = toXY('api_duration_p95');
  const durationData = durationRaw.length ? durationRaw : Array.from({ length: 12 }, () => ({ value: 0, label: '' }));
  const durationHasData = durationRaw.some((p) => p.value > 0);

  // Xu hướng sự cố (các metric gây alarm) — có lỗi thì đường vọt lên, bình thường thì "không có gì".
  const hasIncidents = errorSeries.some((s) => s.data.some((p) => p.value > 0));

  // Donut: phân bố trạng thái alarm (status colors)
  const alarmDist = [
    { label: 'Cảnh báo', value: alarmCounts.alarm, color: '#ef4444' },
    { label: 'Chưa đủ dữ liệu', value: alarmCounts.insufficient, color: '#a1a1aa' },
    { label: 'Bình thường', value: alarmCounts.ok, color: '#10b981' },
  ];
  // Bar: invocations theo function (mỗi function là 1 thực thể -> màu riêng)
  const invByFunction = [
    { label: 'API', value: sumSeries('api_invocations'), colorClass: 'bg-sky-500/80' },
    { label: 'Worker', value: sumSeries('worker_invocations'), colorClass: 'bg-violet-500/80' },
  ];
  // Bar: lỗi theo nguồn (một series "lỗi" -> cùng màu, phân biệt bằng nhãn)
  const errorsBySource = [
    { label: 'API err', value: sumSeries('api_errors'), colorClass: 'bg-red-500/70' },
    { label: 'Worker err', value: sumSeries('worker_errors'), colorClass: 'bg-red-500/70' },
    { label: '5xx', value: sumSeries('error_count_5xx'), colorClass: 'bg-red-500/70' },
    { label: 'Throttle', value: sumSeries('dynamo_throttled'), colorClass: 'bg-red-500/70' },
  ];

  const tiles = [
    { icon: isHealthy ? CheckCircle2 : XCircle, label: 'Trạng thái API', value: record ? (isHealthy ? 'Bình thường' : 'Sự cố') : '—', sub: record ? `${record.latencyMs} ms` : 'đang kiểm tra…', tone: record ? (isHealthy ? 'emerald' : 'red') : 'sky' },
    { icon: Gauge, label: 'Uptime', value: uptime == null ? '—' : `${uptime.toFixed(1)}%`, sub: `${history.length} lần kiểm tra`, tone: uptimeTone },
    { icon: BellRing, label: 'Alarms cảnh báo', value: overview ? String(alarmCounts.alarm) : '—', sub: `${alarmCounts.ok} bình thường`, tone: alarmCounts.alarm > 0 ? 'red' : 'emerald' },
    { icon: Zap, label: 'Response time', value: record ? `${record.latencyMs} ms` : '—', sub: avgLatency ? `TB ${avgLatency} ms` : '', tone: 'sky' },
  ];

  const refreshAll = () => { refetch(); refetchOverview(); };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Theo dõi API và hạ tầng PeriodIQ theo thời gian thực (CloudWatch).</p>
          <LivePill />
        </div>
        <div className="flex items-center gap-2">
          {overview?.dashboardUrl && (
            <a href={overview.dashboardUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
                CloudWatch Dashboard
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isFetching || fetchingOverview}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching || fetchingOverview ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t, i) => <StatTile key={t.label} {...t} delay={i * 70} />)}
      </div>

      {/* CloudWatch Alarms */}
      <section className="space-y-4">
        <SectionHeader
          icon={BellRing} tone={alarmCounts.alarm > 0 ? 'red' : 'emerald'}
          title="CloudWatch Alarms" desc="Cảnh báo tự động gửi email qua SNS khi vượt ngưỡng"
        />
        {alarms.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
            Chưa đọc được alarm (cần deploy CloudWatch + quyền IAM, hoặc chưa có alarm nào).
          </CardContent></Card>
        ) : (
          <>
            {/* Tóm tắt sức khỏe alarm + thanh phân bố trạng thái */}
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:w-60 sm:shrink-0">
                  <span className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl',
                    alarmCounts.alarm > 0 ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                  )}>
                    {alarmCounts.alarm > 0 ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {alarmCounts.alarm > 0 ? `${alarmCounts.alarm} alarm đang cảnh báo` : 'Tất cả alarm bình thường'}
                    </p>
                    <p className="text-xs text-muted-foreground">{alarms.length} alarm đang giám sát</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <StackedBar height={12} segments={alarmDist} />
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                    {alarmDist.map((s) => (
                      <span key={s.label} className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                        {s.label}
                        <span className="font-semibold tabular-nums text-foreground">{s.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Biểu đồ tổng hợp xu hướng sự cố theo thời gian */}
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Xu hướng sự cố (3 giờ)</CardTitle>
                {hasIncidents && <span className="text-xs text-muted-foreground">errors · 5xx · throttle theo thời gian</span>}
              </CardHeader>
              <CardContent>
                {hasIncidents ? (
                  <LineChart series={errorSeries} height={240} showDots labelLast />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </span>
                    <p className="text-sm font-medium">Không có sự cố nào trong 3 giờ qua</p>
                    <p className="text-xs text-muted-foreground">Mọi metric lỗi / 5xx / throttle đều bằng 0 — hệ thống bình thường.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alarms.map((a, i) => {
              const v = alarmVisual(a.state);
              const st = ALARM_STATE[a.state] ?? ALARM_STATE.INSUFFICIENT_DATA;
              return (
                <Card
                  key={a.name}
                  className={cn('relative overflow-hidden border-l-4 transition-all duration-300 animate-in fade-in-0 zoom-in-95 hover:-translate-y-0.5 hover:shadow-md', v.border)}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent', v.tint)} />
                  <CardContent className="relative space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                          {v.pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/50" />}
                          <v.Icon className={cn('relative h-4 w-4', v.cls)} />
                        </span>
                        <span className="truncate text-sm font-semibold capitalize" title={a.name}>
                          {prettyAlarmName(a.name, overview?.environment)}
                        </span>
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    {a.description && <p className="line-clamp-2 text-xs text-muted-foreground">{a.description}</p>}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{a.metricName || 'metric math'}</span>
                      {a.updatedAt && <span className="tabular-nums">{dayjs(a.updatedAt).format('HH:mm DD/MM')}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          </>
        )}
      </section>

      {/* CloudWatch metrics — biểu đồ lớn theo thời gian */}
      <section className="space-y-4">
        <SectionHeader icon={Zap} tone="violet" title="CloudWatch Metrics" desc="Lambda / DynamoDB / custom · 3 giờ gần nhất" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Invocations theo thời gian</CardTitle>
              <span className="text-xs text-muted-foreground">API {sumSeries('api_invocations').toLocaleString('vi-VN')} · Worker {sumSeries('worker_invocations').toLocaleString('vi-VN')}</span>
            </CardHeader>
            <CardContent><LineChart series={invocationSeries} height={220} area /></CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /> API duration p95 (ms)</CardTitle>
              <span className="text-xs text-muted-foreground">Hiện tại {Math.round(durationRaw.length ? durationRaw[durationRaw.length - 1].value : 0).toLocaleString('vi-VN')} ms</span>
            </CardHeader>
            <CardContent><AreaChart data={durationData} unit=" ms" height={220} className={durationHasData ? 'text-violet-500' : 'text-muted-foreground/50'} /></CardContent>
          </Card>
        </div>
      </section>

      {/* Biểu đồ tổng hợp: donut + bar */}
      <section className="space-y-4">
        <SectionHeader icon={PieChart} tone="violet" title="Biểu đồ tổng hợp" desc="Phân bố alarm · invocations · lỗi (3 giờ gần nhất)" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-1.5"><PieChart className="h-3.5 w-3.5" /> Phân bố trạng thái Alarm</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center py-2">
              <DonutChart data={alarmDist} centerLabel="alarms" emptyText="Chưa có alarm." />
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Invocations theo function</CardTitle></CardHeader>
            <CardContent>
              <BarChart data={invByFunction} height={150} valueFormatter={(v) => Math.round(v).toLocaleString('vi-VN')} />
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Lỗi theo nguồn</CardTitle></CardHeader>
            <CardContent>
              <BarChart data={errorsBySource} height={150} valueFormatter={(v) => Math.round(v).toLocaleString('vi-VN')} emptyText="Không có lỗi 🎉" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Uptime + response time */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /> Uptime</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {uptime === null ? (
              <p className="py-8 text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : (
              <>
                <DonutGauge value={uptime} colorClass={uptimeColor} sublabel="uptime" />
                <p className="text-center text-xs text-muted-foreground">Dựa trên {history.length} lần kiểm tra (client-side)</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Response time (ms)</CardTitle>
              <p className="text-xs text-muted-foreground">{latencySeries.length} lần kiểm tra thành công gần nhất (client-side)</p>
            </div>
            <div className="flex gap-4 text-right text-xs">
              <div><p className="text-muted-foreground">Trung bình</p><p className="text-base font-semibold tabular-nums text-foreground">{avgLatency ?? '—'} ms</p></div>
              <div><p className="text-muted-foreground">Cao nhất</p><p className="text-base font-semibold tabular-nums text-foreground">{peakLatency ?? '—'} ms</p></div>
            </div>
          </CardHeader>
          <CardContent><AreaChart data={latencySeries} unit=" ms" height={180} className="text-sky-500" /></CardContent>
        </Card>
      </div>

      {/* System info + log groups */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-1.5"><Server className="h-3.5 w-3.5" /> Thông tin hệ thống</CardTitle></CardHeader>
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
              <span className="font-medium">{overview?.region || getRegionFromApiUrl()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Environment</span>
              <span className="font-medium">{record?.data?.environment ?? overview?.environment ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Commit</span>
              <span className="font-mono text-xs font-medium">{record?.data?.commit ?? 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Log groups (Lambda) · retention</CardTitle></CardHeader>
          <CardContent className="p-0">
            {(overview?.logGroups ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chưa đọc được log group.</p>
            ) : (
              <div className="divide-y divide-border">
                {overview.logGroups.map((lg) => (
                  <div key={lg.name} className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/40">
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-mono text-xs">{lg.name}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs tabular-nums text-muted-foreground">{formatBytes(lg.storedBytes)}</span>
                      <Badge variant={lg.retentionInDays ? 'info' : 'neutral'}>
                        {lg.retentionInDays ? `${lg.retentionInDays} ngày` : 'Không hết hạn'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Uptime history strip */}
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /> Lịch sử kiểm tra</CardTitle>
          <p className="text-xs text-muted-foreground">Mỗi thanh là một lần health-check · xanh = OK, đỏ = lỗi</p>
        </CardHeader>
        <CardContent>
          <StatusStrip history={history} />
          {history.length > 0 && (
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>{dayjs(history[Math.max(history.length - 60, 0)].timestamp).format('HH:mm:ss')}</span>
              <span>{dayjs(history[history.length - 1].timestamp).format('HH:mm:ss')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
