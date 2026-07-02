import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, Maximize2, Minimize2, Copy, Check, Download,
  ZoomIn, ZoomOut, ArrowDownToLine, Search, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatDuration } from '@/lib/utils';
import { statusMeta } from './statusMeta';
import { liveDurationSeconds } from './deployTime';

const MIN_FONT = 10;
const MAX_FONT = 20;
const clampFont = (n) => Math.min(MAX_FONT, Math.max(MIN_FONT, n));
const FAIL = ['Failed', 'Stopped', 'Abandoned'];

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Highlight (đơn giản) lần khớp đầu tiên của filter trong 1 dòng log. */
function highlight(line, query) {
  if (!query) return line;
  const idx = line.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return line;
  return (
    <>
      {line.slice(0, idx)}
      <mark className="rounded-sm bg-amber-400/30 text-amber-100">{line.slice(idx, idx + query.length)}</mark>
      {line.slice(idx + query.length)}
    </>
  );
}

/** Khung terminal hiển thị log: số dòng, tự cuộn xuống đáy (tail), lọc theo từ khoá. */
function LogConsole({ logs, font, query, live, follow, setFollow, className }) {
  const ref = useRef(null);

  // Cuộn tay lên => tạm dừng tail; cuộn về đáy => tự bật lại. (Không đổi state khi query lọc rỗng-chiều-cao.)
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (atBottom !== follow) setFollow(atBottom);
  };

  // Tail: khi bật "theo dõi", cuộn xuống đáy mỗi khi có log mới.
  useEffect(() => {
    const el = ref.current;
    if (!el || !follow) return;
    el.scrollTop = el.scrollHeight;
  }, [logs, follow]);

  const rows = useMemo(() => {
    const numbered = logs.map((line, i) => ({ n: i + 1, line }));
    if (!query) return numbered;
    const q = query.toLowerCase();
    return numbered.filter((r) => r.line.toLowerCase().includes(q));
  }, [logs, query]);

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className={cn('overflow-auto bg-zinc-950 font-mono leading-relaxed text-zinc-100', className)}
      style={{ fontSize: `${font}px` }}
    >
      {rows.length === 0 ? (
        <div className="p-4 text-zinc-500">
          {query ? 'Không có dòng log nào khớp bộ lọc.' : live ? 'Đang chờ log đầu tiên…' : 'Chưa có log.'}
        </div>
      ) : (
        <div className="min-w-full py-2">
          {rows.map(({ n, line }) => (
            <div key={n} className="flex gap-3 px-4 hover:bg-white/[0.04]">
              <span className="w-10 shrink-0 select-none text-right tabular-nums text-zinc-600">{n}</span>
              <span className="whitespace-pre-wrap break-all">{highlight(line, query)}</span>
            </div>
          ))}
          {live && (
            <div className="flex gap-3 px-4 text-amber-400/80">
              <span className="w-10 shrink-0" />
              <span className="animate-pulse">▌ đang nhận log…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Panel log của 1 stage: có thể thu/phóng (collapse + toàn màn hình), zoom cỡ chữ,
 * copy / tải log, lọc theo từ khoá và tự cuộn khi đang chạy (realtime).
 */
export default function StageLogPanel({ stage, open = true, onOpenChange, now = Date.now() }) {
  const meta = statusMeta(stage.status);
  const { Icon } = meta;
  const live = stage.status === 'InProgress';
  const failed = FAIL.includes(stage.status);
  const done = stage.status === 'Succeeded';
  const dur = liveDurationSeconds(stage, now);
  // % là tiến độ của RIÊNG stage: xong = 100%, thất bại = 100% (đỏ), đang chạy = thanh chảy, còn lại = 0%.
  const barPct = live || done || failed ? 100 : 0;
  const logs = Array.isArray(stage.logs) ? stage.logs : stage.logs ? [String(stage.logs)] : [];
  const hasLogs = logs.length > 0;

  const [full, setFull] = useState(false);
  const [font, setFont] = useState(12);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState('');
  const [follow, setFollow] = useState(true);

  // Thoát toàn màn hình bằng Escape + khoá cuộn nền khi đang phóng to.
  useEffect(() => {
    if (!full) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setFull(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [full]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(logs.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard bị chặn — bỏ qua */
    }
  };

  const download = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(stage.name) || 'stage'}-build-log.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const iconBtn = 'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
      <div className="relative min-w-[10rem] flex-1">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Lọc log…"
          className="h-7 w-full rounded-md border border-border bg-background pl-7 pr-7 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Xoá bộ lọc">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <button type="button" onClick={() => setFont((f) => clampFont(f - 1))} className={iconBtn} aria-label="Thu nhỏ chữ" title="Thu nhỏ chữ">
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="w-8 select-none text-center text-xs tabular-nums text-muted-foreground">{font}px</span>
        <button type="button" onClick={() => setFont((f) => clampFont(f + 1))} className={iconBtn} aria-label="Phóng to chữ" title="Phóng to chữ">
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setFollow((v) => !v)}
        className={cn(iconBtn, follow && 'bg-muted text-foreground')}
        aria-pressed={follow}
        aria-label="Tự cuộn theo log mới"
        title="Tự cuộn theo log mới"
      >
        <ArrowDownToLine className="h-4 w-4" />
      </button>
      <button type="button" onClick={copy} disabled={!hasLogs} className={iconBtn} aria-label="Sao chép log" title="Sao chép log">
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      </button>
      <button type="button" onClick={download} disabled={!hasLogs} className={iconBtn} aria-label="Tải log" title="Tải log">
        <Download className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => setFull((v) => !v)} className={iconBtn} aria-label={full ? 'Thu nhỏ' : 'Phóng to toàn màn hình'} title={full ? 'Thu nhỏ' : 'Phóng to toàn màn hình'}>
        {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  );

  const headerLeft = (
    <>
      <Icon className={cn('h-5 w-5 shrink-0', meta.iconClass, meta.spin && 'animate-spin')} />
      <span className="truncate text-[15px] font-semibold">{stage.name}</span>
      <Badge variant={meta.variant}>{meta.label}</Badge>
      {live && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          LIVE
        </span>
      )}
    </>
  );

  // Toàn màn hình: overlay cố định, log chiếm toàn bộ chiều cao còn lại.
  if (full) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">{headerLeft}</div>
          <span className={cn('tabular-nums text-xs', live ? 'font-medium text-amber-500' : 'text-muted-foreground')}>{formatDuration(dur)}</span>
        </div>
        {toolbar}
        <LogConsole logs={logs} font={font} query={query} live={live} follow={follow} setFollow={setFollow} className="flex-1" />
      </div>
    );
  }

  return (
    <div
      id={`stage-${slugify(stage.name)}`}
      className={cn(
        'scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card transition-shadow',
        'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.10)] hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.14)]',
        open && 'ring-1 ring-ring/10',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-5 py-4">
        <button
          type="button"
          onClick={() => onOpenChange?.(!open)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')} />
          {headerLeft}
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <span className={cn('tabular-nums text-xs', live ? 'font-medium text-amber-500' : 'text-muted-foreground')}>{formatDuration(dur)}</span>
        </div>
      </div>

      {/* Thanh tiến độ của riêng stage: xong = 100%, đang chạy = thanh chảy; thụt vào 2 bên cho đỡ sát mép. */}
      <div className="px-5 pb-3">
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-700 ease-out',
              live && 'pipe-flow',
              !live && failed && 'bg-gradient-to-r from-red-500 to-red-400',
              !live && done && 'bg-gradient-to-r from-emerald-500 to-emerald-400',
            )}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      {open && (
        hasLogs || live ? (
          <>
            {toolbar}
            <LogConsole logs={logs} font={font} query={query} live={live} follow={follow} setFollow={setFollow} className="max-h-[34rem] min-h-[12rem]" />
          </>
        ) : (
          <div className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Stage này không tạo build log (không dùng CodeBuild).
          </div>
        )
      )}
    </div>
  );
}
