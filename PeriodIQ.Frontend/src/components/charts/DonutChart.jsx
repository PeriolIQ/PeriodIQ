/**
 * Donut nhiều phân đoạn (proportion) + chú thích trực tiếp giá trị.
 * Danh tính không dựa vào màu đơn thuần: legend luôn kèm nhãn + số.
 *
 * @param {{label:string,value:number,color:string}[]} data  color là mã màu CSS
 */
export default function DonutChart({
  data = [],
  size = 148,
  strokeWidth = 16,
  centerLabel,
  emptyText = 'Chưa có dữ liệu.',
}) {
  const total = data.reduce((a, d) => a + (d.value || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = data.filter((d) => d.value > 0).length > 1 ? 3 : 0; // khe hở 2-3px giữa các phân đoạn

  let cursor = 0;
  const segments = data.map((d) => {
    const frac = total > 0 ? (d.value || 0) / total : 0;
    const len = frac * circumference;
    const seg = { ...d, len, offset: cursor };
    cursor += len;
    return seg;
  });

  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={centerLabel || 'Biểu đồ tỉ lệ'}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-muted" strokeWidth={strokeWidth} />
          {total > 0 && segments.map((s, i) => (
            s.value > 0 && (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${Math.max(s.len - gap, 0.001)} ${circumference - Math.max(s.len - gap, 0.001)}`}
                strokeDashoffset={-s.offset}
                className="transition-[stroke-dasharray] duration-500 motion-reduce:transition-none"
              />
            )
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-foreground">{total}</span>
          {centerLabel && <span className="text-[11px] text-muted-foreground">{centerLabel}</span>}
        </div>
      </div>

      {total === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="min-w-[9rem] space-y-1.5 text-sm">
          {data.map((d) => (
            <li key={d.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="text-muted-foreground">{d.label}</span>
              <span className="ml-auto font-semibold tabular-nums text-foreground">{d.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
