import { cn } from '@/lib/utils';

/**
 * Sparkline dạng cột nhỏ gọn cho time-series đếm (invocations, errors...).
 * Khi toàn 0 vẫn hiện một hàng cột mờ sát đáy -> trông như "baseline im lặng", không trống trải.
 *
 * @param {{value:number,label?:string}[]} data
 */
export default function MiniBars({ data = [], height = 40, colorClass = 'bg-sky-500/70' }) {
  const max = Math.max(...data.map((d) => d.value || 0), 1);
  const bars = data.length ? data : Array.from({ length: 12 }, () => ({ value: 0 }));
  const hasData = bars.some((d) => (d.value || 0) > 0);

  // Không có dữ liệu -> đường baseline gọn ở đáy (trông như biểu đồ phẳng ở mức 0).
  if (!hasData) {
    return (
      <div className="flex items-end" style={{ height }}>
        <div className="h-0.5 w-full rounded-full bg-border" />
      </div>
    );
  }

  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {bars.map((d, i) => {
        const active = (d.value || 0) > 0;
        return (
          <div
            key={i}
            title={d.label ? `${d.label}: ${Math.round(d.value)}` : String(Math.round(d.value || 0))}
            className={cn('flex-1 rounded-sm transition-[height] duration-500 motion-reduce:transition-none', active ? colorClass : 'bg-muted')}
            style={{ height: active ? `${Math.max((d.value / max) * 100, 6)}%` : '6%' }}
          />
        );
      })}
    </div>
  );
}
