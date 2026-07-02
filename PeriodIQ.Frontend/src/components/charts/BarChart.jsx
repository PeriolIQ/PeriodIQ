import { useState } from 'react';

/**
 * Bar chart dọc nhẹ (SVG-less, dùng div) để so sánh giá trị theo hạng mục —
 * ví dụ thời lượng các lần deploy gần nhất. Mỗi cột có thể mang màu riêng theo
 * trạng thái, hover hiện tooltip. Giá trị luôn có nhãn text.
 *
 * @param {{value:number,label?:string,caption?:string,colorClass?:string}[]} data
 */
export default function BarChart({ data = [], height = 160, valueFormatter, emptyText = 'Chưa có dữ liệu.' }) {
  const [hover, setHover] = useState(null);
  const fmt = (v) => (valueFormatter ? valueFormatter(v) : String(v));

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        {emptyText}
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * 100, 2);
        return (
          <div key={i} className="group relative flex flex-1 flex-col items-center justify-end gap-1"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {hover === i && (
              <div className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-md">
                <p className="font-medium text-popover-foreground">{fmt(d.value)}</p>
                {d.caption && <p className="text-muted-foreground">{d.caption}</p>}
              </div>
            )}
            <div
              className={`w-full max-w-9 rounded-t-md transition-[height] duration-500 motion-reduce:transition-none ${d.colorClass || 'bg-foreground/80'} ${hover === i ? 'opacity-100' : 'opacity-85'}`}
              style={{ height: `${h}%` }}
            />
            {d.label && (
              <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground">
                {d.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
