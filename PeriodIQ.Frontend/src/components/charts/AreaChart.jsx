import { useId, useMemo, useState } from 'react';
import { useElementWidth } from '@/hooks/useElementWidth';

/**
 * Area chart SVG nhẹ (không cần thư viện) cho time-series như response latency.
 * - Responsive theo container, stroke nét căng.
 * - Hover hiển thị tooltip giá trị + nhãn thời gian.
 * - Màu theo currentColor -> điều khiển bằng class text-* của Tailwind.
 *
 * @param {{value:number,label?:string}[]} data
 */
export default function AreaChart({
  data = [],
  height = 160,
  unit = '',
  valueFormatter,
  className = 'text-foreground',
}) {
  const [ref, width] = useElementWidth();
  const gradientId = useId();
  const [hover, setHover] = useState(null);

  const padX = 8;
  const padTop = 12;
  const padBottom = 8;

  const geometry = useMemo(() => {
    if (!width || data.length === 0) return null;
    const values = data.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const innerW = width - padX * 2;
    const innerH = height - padTop - padBottom;

    const points = data.map((d, i) => {
      const x = data.length === 1 ? width / 2 : padX + (i / (data.length - 1)) * innerW;
      const y = padTop + innerH - ((d.value - min) / range) * innerH;
      return { x, y, ...d };
    });

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const area = `${line} L${points[points.length - 1].x},${height - padBottom} L${points[0].x},${height - padBottom} Z`;
    return { points, line, area, max, min };
  }, [width, data, height]);

  const fmt = (v) => (valueFormatter ? valueFormatter(v) : `${Math.round(v)}${unit}`);

  if (data.length === 0) {
    return (
      <div ref={ref} className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        Chưa có dữ liệu để hiển thị.
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`} style={{ height }}>
      {geometry && (
        <svg width={width} height={height} className="overflow-visible" role="img"
          aria-label={`Biểu đồ đường: cao nhất ${fmt(geometry.max)}, thấp nhất ${fmt(geometry.min)}`}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* gridlines nhạt */}
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={padX} x2={width - padX} y1={padTop + (height - padTop - padBottom) * t}
              y2={padTop + (height - padTop - padBottom) * t}
              className="stroke-border" strokeWidth="1" strokeDasharray="3 3" />
          ))}

          <path d={geometry.area} fill={`url(#${gradientId})`} />
          <path d={geometry.line} fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

          {hover != null && geometry.points[hover] && (
            <g>
              <line x1={geometry.points[hover].x} x2={geometry.points[hover].x} y1={padTop}
                y2={height - padBottom} className="stroke-border" strokeWidth="1" />
              <circle cx={geometry.points[hover].x} cy={geometry.points[hover].y} r="4"
                fill="currentColor" className="stroke-card" strokeWidth="2" />
            </g>
          )}

          {/* vùng hover trong suốt để bắt chuột theo cột */}
          {geometry.points.map((p, i) => (
            <rect key={i} x={i === 0 ? 0 : (geometry.points[i - 1].x + p.x) / 2} y={0}
              width={
                (i === 0 ? p.x : (p.x - geometry.points[i - 1].x) / 2) +
                (i === geometry.points.length - 1 ? width - p.x : (geometry.points[i + 1].x - p.x) / 2)
              }
              height={height} fill="transparent"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          ))}
        </svg>
      )}

      {hover != null && geometry?.points[hover] && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-md"
          style={{ left: geometry.points[hover].x, top: Math.max(geometry.points[hover].y - 44, 0) }}>
          <p className="font-medium text-popover-foreground">{fmt(geometry.points[hover].value)}</p>
          {geometry.points[hover].label && (
            <p className="text-muted-foreground">{geometry.points[hover].label}</p>
          )}
        </div>
      )}
    </div>
  );
}
