import { cn } from '@/lib/utils';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageHeader({ onRefresh, isRefreshing, t }) {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" />
          {t('plan.rule_engine')}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">{t('plan.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground line-clamp-2">{t('plan.subtitle')}</p>
      </div>
      <Button variant="outline" className="h-10 w-fit gap-2" onClick={onRefresh} disabled={isRefreshing}>
        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        {t('plan.refresh')}
      </Button>
    </div>
  );
}

