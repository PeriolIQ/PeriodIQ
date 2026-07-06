import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GOALS } from '@/lib/constants';
import { getPlanId, readValue, formatDate } from '@/lib/workoutPlanUtils';

import { Link } from 'react-router-dom';

export default function PlanList({ plans, selectedId, onSelect, isLoading }) {
  const { t } = useTranslation();
  
  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/30 p-4 flex justify-between items-center">
        <h2 className="font-bold">{t('plan.my_plans')}</h2>
        <Badge variant="neutral" className="text-[10px] uppercase">{t('plan.api_list')}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
        ) : plans.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">{t('plan.no_plans')}</div>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => {
              const id = getPlanId(plan);
              return (
                <div key={id} onClick={() => onSelect(plan)} className={cn("w-full p-3 rounded-lg border text-left flex justify-between items-center cursor-pointer transition-colors", id === selectedId ? "border-blue-500 bg-blue-500/10" : "border-border hover:bg-muted")}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{t(GOALS.find(g => g.value === readValue(plan, 'goal', 'Goal'))?.labelKey) || t('plan.plan_label')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(readValue(plan, 'startDate', 'StartDate'))}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={readValue(plan, 'status', 'Status') === 'Active' ? 'success' : 'neutral'}>
                      {readValue(plan, 'status', 'Status') === 'Active' ? t('common.active') : (readValue(plan, 'status', 'Status') || t('plan.plan_label'))}
                    </Badge>
                    <Link to={`/workout-plans/${id}`} onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline font-medium">{t('plan.view_detail')} &rarr;</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

