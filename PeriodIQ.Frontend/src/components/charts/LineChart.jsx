import { useMemo, useState } from 'react';
import { useElementWidth } from '@/hooks/useElementWidth';

/**
 * Line chart đa series (SVG nhẹ) cho time-series cùng đơn vị — 1 trục y chung.
 * - Legend luôn hiện (danh tính không dựa màu đơn thuần), đường mảnh 2px, grid nhạt.
 * - Hover: crosshair + tooltip liệt kê giá trị từng series tại mốc thời gian.
 * - Khi chưa có dữ liệu vẫn vẽ đường phẳng ở mức 0 (trông như biểu đồ, không trống).
 *
 * @param {{id:string,label:string,color:string,data:{value:number,label?:string}[]}[]} series  color là mã màu CSS
 */
export default function LineChart({ series = [], height = 200, unit = '', valueFormatter, area = false, showDots = false, labelLast = false }) {
  const [ref, width] = useElementWidth();
  const [hover, setHover] = useState(null);

  const padX = 10;
  const padTop = 12;
  const padBottom = 22;

  const rawLen = Math.max(0, ...series.map((s) => s.data?.length ?? 0));
  const len = rawLen || 12;
  const labelSource = series.find((s) => (s.data?.length ?? 0) === rawLen)?.data ?? [];
  const labels = labelSource.map((d) => d.label || '');
  const getVal = (s, i) => s.data?.[i]?.value ?? 0;

  const geo = useMemo(() => {
    if (!width) return null;
    const allVals = series.flatMap((s) => (s.data ?? []).map((d) => d.value || 0));
    const max = Math.max(...allVals, 1);
    const range = max || 1;
    const innerW = width - padX * 2;
    const innerH = height - padTop - padBottom;
    const x = (i) => (len === 1 ? width / 2 : padX + (i / (len - 1)) * innerW);
    const y = (v) => padTop + innerH - (v / range) * innerH;

    const lines = series.map((s) => {
      const pts = Array.from({ length: len }, (_, i) => ({ x: x(i), y: y(getVal(s, i)), v: getVal(s, i) }));
      const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      const areaPath = `${path} L${pts[pts.length - 1].x},${height - padBottom} L${pts[0].x},${height - padBottom} Z`;
      return { ...s, pts, path, areaPath };
    });
    return { max, x, y, lines, innerH };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, series, len, height]);

  const fmt = (v) => (valueFormatter ? valueFormatter(v) : `${Math.round(v)}${unit}`);
  const tickIdx = rawLen > 1 ? [...new Set([0, Math.floor((len - 1) / 2), len - 1])] : [];

  return (
    <div className="w-full">
      <div ref={ref} className="relative w-full" style={{ height }}>
        {geo && (
          <svg width={width} height={height} className="overflow-visible" role="img" aria-label="Biểu đồ đường đa series">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <line key={t} x1={padX} x2={width - padX} y1={padTop + geo.innerH * t} y2={padTop + geo.innerH * t}
                className="stroke-border" strokeWidth="1" strokeDasharray="3 3" />
            ))}

            {geo.lines.map((l) => (
              <g key={l.id}>
                {area && <path d={l.areaPath} fill={l.color} opacity="0.08" />}
                <path d={l.path} fill="none" stroke={l.color} strokeWidth="2"
                  strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </g>
            ))}

            {/* Điểm mốc trên từng đường (chỉ khi dữ liệu thưa để tránh rối) */}
            {showDots && len <= 16 && geo.lines.map((l) => (
              <g key={`dots-${l.id}`}>
                {l.pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={l.color} className="stroke-card" strokeWidth="1.5" />)}
              </g>
            ))}

            {/* Nhãn giá trị ở điểm cuối mỗi đường (dùng màu chữ, không dùng màu series) */}
            {labelLast && geo.lines.map((l) => {
              const p = l.pts[l.pts.length - 1];
              return p ? (
                <text key={`lbl-${l.id}`} x={p.x - 5} y={p.y - 6} textAnchor="end" className="fill-foreground text-[10px] font-semibold">
                  {fmt(p.v)}
                </text>
              ) : null;
            })}

            {hover != null && (
              <g>
                <line x1={geo.x(hover)} x2={geo.x(hover)} y1={padTop} y2={height - padBottom} className="stroke-border" strokeWidth="1" />
                {geo.lines.map((l) => l.pts[hover] && (
                  <circle key={l.id} cx={l.pts[hover].x} cy={l.pts[hover].y} r="3.5" fill={l.color} className="stroke-card" strokeWidth="2" />
                ))}
              </g>
            )}

            {tickIdx.map((i) => (
              <text key={i} x={geo.x(i)} y={height - 6}
                textAnchor={i === 0 ? 'start' : i === len - 1 ? 'end' : 'middle'}
                className="fill-muted-foreground text-[10px]">{labels[i]}</text>
            ))}

            {Array.from({ length: len }, (_, i) => (
              <rect key={i} x={i === 0 ? 0 : (geo.x(i - 1) + geo.x(i)) / 2} y={0}
                width={(i === 0 ? geo.x(0) : (geo.x(i) - geo.x(i - 1)) / 2) + (i === len - 1 ? width - geo.x(i) : (geo.x(i + 1) - geo.x(i)) / 2)}
                height={height} fill="transparent"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            ))}
          </svg>
        )}

        {hover != null && geo && (
          <div className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1.5 text-xs shadow-md"
            style={{ left: Math.min(Math.max(geo.x(hover), 60), (width || 0) - 60), top: 2 }}>
            {labels[hover] && <p className="mb-1 font-medium text-popover-foreground">{labels[hover]}</p>}
            {series.map((s) => (
              <p key={s.id} className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="ml-auto pl-3 font-medium tabular-nums text-popover-foreground">{fmt(s.data?.[hover]?.value ?? 0)}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
