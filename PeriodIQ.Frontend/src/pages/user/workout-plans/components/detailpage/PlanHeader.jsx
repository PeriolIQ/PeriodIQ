import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDate, readValue } from '@/lib/workoutPlanUtils';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

export default function PlanHeader({ plan, onBack }) {
  const { t } = useTranslation();
  
  if (!plan) return null;

  const goal = readValue(plan, 'goal', 'Goal');
  const level = readValue(plan, 'fitnessLevel', 'FitnessLevel');
  const startDate = formatDate(readValue(plan, 'startDate', 'StartDate'));
  const endDate = formatDate(readValue(plan, 'endDate', 'EndDate'));
  const title = t('constants.goals.' + goal?.toLowerCase()) || goal;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
          {title} <span className="text-muted-foreground/50">{t('plan.phase')}</span>
        </h1>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors border border-border rounded-lg px-3 py-1.5 hover:bg-muted/60 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="bg-blue-900/40 text-blue-400 hover:bg-blue-900/60 border-blue-500/30 px-3 py-1 font-medium rounded-md">
          {t('plan.goal_label')}: {title}
        </Badge>
        <Badge className="bg-muted/50 text-muted-foreground hover:bg-muted/80 border-border px-3 py-1 font-medium rounded-md">
          {t('plan.level_label')}: {t('constants.levels.' + level?.toLowerCase()) || level}
        </Badge>
        <div className="text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-md border border-border/50">
          {startDate} - {endDate || t('common.updating')}
        </div>
      </div>
    </div>
  );
}
