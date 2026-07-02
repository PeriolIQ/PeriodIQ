import { cn, formatDuration } from '@/lib/utils';
import { statusMeta } from './statusMeta';
import { liveDurationSeconds } from './deployTime';

const FAIL = ['Failed', 'Stopped', 'Abandoned'];

/**
 * Sơ đồ pipeline kiểu stepper: vòng tròn to có gradient + hào quang theo trạng thái, nối nhau
 * bằng đoạn thẳng ngắn; cả sơ đồ căn giữa. Đường nối sinh động: xám khi chưa chạy, dải sáng xanh
 * chảy liên tục khi stage kế đang chạy, xanh (ánh sáng lướt) khi đã xong, đỏ nếu thất bại.
 * Bấm node để nhảy tới build log của stage đó.
 */
export default function PipelineFlow({ stages = [], activeStage, onSelect, now = Date.now() }) {
  if (!stages.length) return null;

  return (
    <div className="overflow-x-auto">
      <ol className="mx-auto flex w-max items-center px-3 pt-2 pb-12">
        {stages.map((stage, i) => {
          const meta = statusMeta(stage.status);
          const { Icon } = meta;
          const isActive = activeStage === stage.name;
          const isLast = i === stages.length - 1;
          const running = stage.status === 'InProgress';
          const done = stage.status === 'Succeeded';
          const failed = FAIL.includes(stage.status);

          // Trạng thái đường nối phụ thuộc stage KẾ TIẾP.
          const nextStatus = stages[i + 1]?.status;
          const lineDone = nextStatus === 'Succeeded';
          const lineRunning = nextStatus === 'InProgress';
          const lineFailed = FAIL.includes(nextStatus);

          return (
            <li key={stage.name} className="flex shrink-0 items-center">
              {/* Node hình tròn + nhãn */}
              <div className="relative flex flex-col items-center">
                <div className="relative">
                  {/* Vòng nhấp nháy cho node đang chạy */}
                  {running && (
                    <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" aria-hidden />
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect?.(stage.name)}
                    aria-current={isActive ? 'step' : undefined}
                    title={stage.name}
                    className={cn(
                      'relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200',
                      'hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      isActive && 'scale-105',
                      done && 'border-emerald-500 bg-gradient-to-br from-emerald-400/25 to-emerald-600/10 shadow-lg shadow-emerald-500/25',
                      running && 'border-amber-500 bg-gradient-to-br from-amber-300/25 to-amber-500/10 shadow-lg shadow-amber-500/30',
                      failed && 'border-red-500 bg-gradient-to-br from-red-400/25 to-red-600/10 shadow-lg shadow-red-500/25',
                      !done && !failed && !running && 'border-border bg-gradient-to-br from-muted to-card shadow-sm',
                    )}
                  >
                    <Icon className={cn('h-6 w-6', meta.iconClass, meta.spin && 'animate-spin')} />
                  </button>
                </div>

                <div className="absolute top-full mt-2 flex w-max max-w-[8rem] flex-col items-center text-center">
                  <span className={cn('text-xs font-semibold leading-tight', isActive ? 'text-foreground' : 'text-foreground/90')}>
                    {stage.name}
                  </span>
                  <span className={cn('mt-0.5 text-[11px] leading-tight', running ? 'font-medium text-amber-500' : 'text-muted-foreground')}>
                    {meta.label} · {formatDuration(liveDurationSeconds(stage, now))}
                  </span>
                </div>
              </div>

              {/* Đoạn thẳng ngắn nối sang node kế tiếp */}
              {!isLast && (
                <div className="relative mx-1.5 h-1.5 w-16 rounded-full bg-border sm:w-24">
                  {lineDone && <div className="pipe-done h-full w-full rounded-full" />}
                  {lineFailed && <div className="h-full w-full rounded-full bg-gradient-to-r from-red-500 to-red-400" />}
                  {lineRunning && <div className="pipe-flow h-full w-full rounded-full" />}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
