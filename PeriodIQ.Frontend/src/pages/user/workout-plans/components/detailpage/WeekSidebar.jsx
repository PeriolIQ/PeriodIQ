import React from 'react';
import { cn } from '@/lib/utils';
import { getWeeks, readValue } from '@/lib/workoutPlanUtils';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function WeekSidebar({ plan, selectedWeekIndex, onSelectWeek }) {
  const { t } = useTranslation();
  const weeks = getWeeks(plan);

  return (
    <div className="flex flex-col gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-bold">{t('plan.week_sidebar_title', { n: weeks.length })}</h3>
      </div>
      <div className="flex flex-col gap-3">
        {weeks.map((week, idx) => {
          const isSelected = idx === selectedWeekIndex;
          const ruleKey = readValue(week, 'progressionRule', 'ProgressionRule') || '';
          const rule = t(`plan.week_rules.${ruleKey}`, { defaultValue: ruleKey || `Phase ${idx + 1}` });
          const volume = readValue(week, 'plannedTotalVolume', 'PlannedTotalVolume');
          const intensity = readValue(week, 'intensityMultiplier', 'IntensityMultiplier');
          
          return (
            <button
              key={idx}
              onClick={() => onSelectWeek(idx)}
              className={cn(
                "relative w-full p-4 rounded-xl text-left border transition-all overflow-hidden flex flex-col gap-3",
                isSelected 
                  ? "border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/20" 
                  : "border-border bg-card hover:bg-muted/60 hover:border-border"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="font-bold text-sm w-3/5">
                <span className="text-muted-foreground">{t('plan.week_label_colon', { n: idx + 1 })}</span><br/>
                  <span className={isSelected ? "text-blue-400" : "text-foreground"}>{rule}</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono space-y-1 text-right">
                  <div>Vol: {volume ? Math.round(volume / 1000) + 'k' : '-'}</div>
                  <div>Int: {intensity ? intensity.toFixed(1) : '-'}</div>
                </div>
              </div>
              
              {/* Progress bar visual */}
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", isSelected ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-muted-foreground/30")} 
                  style={{ width: `${(idx + 1) * 25}%` }} 
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
