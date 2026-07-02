import { ChevronRight } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { statusMeta } from './statusMeta';

/**
 * Sơ đồ cây các stage của pipeline (Source → BuildBackend → Deploy → ...).
 * Mỗi node hiển thị tên stage, icon trạng thái và thời lượng; bấm để nhảy tới log của stage đó.
 * Cuộn ngang trên màn hình hẹp để giữ được luồng đọc trái → phải.
 */
export default function PipelineFlow({ stages = [], activeStage, onSelect }) {
  if (!stages.length) return null;

  return (
    <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
      {stages.map((stage, i) => {
        const meta = statusMeta(stage.status);
        const { Icon } = meta;
        const isActive = activeStage === stage.name;
        const connectorDone = stage.status === 'Succeeded';

        return (
          <div key={stage.name} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect?.(stage.name)}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'group flex min-w-[9.5rem] cursor-pointer flex-col gap-1.5 rounded-xl border px-4 py-3 text-left transition-all',
                'hover:border-ring/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                isActive ? 'border-ring bg-muted/60 shadow-sm' : 'border-border bg-card',
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4 shrink-0', meta.iconClass, meta.spin && 'animate-spin')} />
                <span className="truncate text-sm font-medium">{stage.name}</span>
              </div>
              <div className="flex items-center justify-between gap-2 pl-6">
                <span className="text-xs text-muted-foreground">{meta.label}</span>
                <span className="tabular-nums text-xs text-muted-foreground">
                  {formatDuration(stage.durationSeconds)}
                </span>
              </div>
            </button>

            {i < stages.length - 1 && (
              <ChevronRight
                className={cn('h-4 w-4 shrink-0', connectorDone ? 'text-emerald-500' : 'text-muted-foreground/40')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
