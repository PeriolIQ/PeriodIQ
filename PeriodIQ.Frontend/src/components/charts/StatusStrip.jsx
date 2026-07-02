import { useState } from 'react';

/**
 * Dải trạng thái kiểu "status page": mỗi lần health-check là một thanh dọc,
 * xanh = ok, đỏ = lỗi. Trực quan hoá lịch sử uptime theo thời gian.
 *
 * @param {{ok:boolean,latencyMs?:number,timestamp?:string,label?:string}[]} history
 */
export default function StatusStrip({ history = [], max = 60 }) {
  const [hover, setHover] = useState(null);
  const items = history.slice(-max);

  if (!items.length) {
    return <p className="text-xs text-muted-foreground">Chưa có lịch sử kiểm tra.</p>;
  }

  return (
    <div className="relative flex h-10 items-stretch gap-[3px]">
      {items.map((h, i) => (
        <div key={i} className="group relative flex-1"
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
          <div
            className={`h-full w-full rounded-sm transition-colors ${h.ok ? 'bg-emerald-500/70 hover:bg-emerald-500' : 'bg-red-500/70 hover:bg-red-500'}`}
          />
          {hover === i && (
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-md">
              <p className={`font-medium ${h.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {h.ok ? 'OK' : 'Lỗi'}{h.latencyMs != null ? ` · ${h.latencyMs} ms` : ''}
              </p>
              {h.label && <p className="text-muted-foreground">{h.label}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
