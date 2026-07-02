/**
 * Donut / gauge SVG cho tỉ lệ phần trăm (uptime, tỉ lệ deploy thành công...).
 * Giá trị luôn hiển thị dạng số ở giữa (không chỉ dựa vào màu).
 *
 * @param {number} value  0..100
 * @param {string} colorClass  class text-* điều khiển màu cung tiến trình
 */
export default function DonutGauge({
  value = 0,
  size = 132,
  strokeWidth = 12,
  label,
  sublabel,
  colorClass = 'text-emerald-500',
  centerText,
}) {
  const pct = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${label || 'Tỉ lệ'}: ${pct.toFixed(1)}%`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            className="stroke-muted" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            className={`${colorClass} transition-[stroke-dasharray] duration-500 motion-reduce:transition-none`}
            stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {centerText ?? `${pct.toFixed(1)}%`}
          </span>
          {sublabel && <span className="text-[11px] text-muted-foreground">{sublabel}</span>}
        </div>
      </div>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}
