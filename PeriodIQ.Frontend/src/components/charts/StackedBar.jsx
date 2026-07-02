import { cn } from '@/lib/utils';

/**
 * Thanh xếp chồng ngang (proportion) — vd phân bố trạng thái alarm.
 * Mỗi phân đoạn rộng theo tỉ lệ, có animate; danh tính kèm legend/tooltip (không chỉ dựa màu).
 *
 * @param {{label:string,value:number,color:string}[]} segments  color là mã màu CSS
 */
export default function StackedBar({ segments = [], height = 12, className = '' }) {
  const total = segments.reduce((a, s) => a + (s.value || 0), 0);
  return (
    <div
      className={cn('flex w-full overflow-hidden rounded-full bg-muted', className)}
      style={{ height }}
      role="img"
      aria-label="Phân bố trạng thái"
    >
      {total > 0 && segments.map((s) => (s.value || 0) > 0 && (
        <div
          key={s.label}
          title={`${s.label}: ${s.value}`}
          className="h-full transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
        />
      ))}
    </div>
  );
}
