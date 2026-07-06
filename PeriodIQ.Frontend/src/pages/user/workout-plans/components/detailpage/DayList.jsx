import React from 'react';
import { cn } from '@/lib/utils';
import { getDays, readValue } from '@/lib/workoutPlanUtils';
import { useTranslation } from 'react-i18next';

export default function DayList({ week, selectedDayIndex, onSelectDay }) {
  const { t } = useTranslation();
  if (!week) return null;
  const days = getDays(week);

  return (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
      <h3 className="text-lg font-bold mb-4">{t('plan.week_detail', { n: readValue(week, 'weekNumber', 'WeekNumber') })}</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
        {days.map((day, idx) => {
          const isSelected = idx === selectedDayIndex;
          const exercisesCount = readValue(day, 'exercises', 'Exercises')?.length || 0;
          
          return (
            <button
              key={idx}
              onClick={() => onSelectDay(idx)}
              className={cn(
                "min-w-[150px] p-4 rounded-xl text-left border transition-all flex flex-col justify-between min-h-[110px]",
                isSelected 
                  ? "border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/20" 
                  : "border-border bg-card hover:bg-muted/60 hover:border-border"
              )}
            >
              <div>
                <div className="text-sm text-muted-foreground font-semibold mb-1">
                  {t('plan.day_label', { n: readValue(day, 'dayNumber', 'DayNumber') })}
                </div>
                <div className={cn("font-bold text-base truncate", isSelected ? "text-blue-400" : "text-foreground")}>
                  {t(`plan.focus_areas.${readValue(day, 'focusArea', 'FocusArea')}`, { defaultValue: readValue(day, 'focusArea', 'FocusArea') || 'Fullbody' })}
                </div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[120px]">
                  {Array.from(new Set(readValue(day, 'exercises', 'Exercises')?.map(e => readValue(e, 'muscleGroup', 'MuscleGroup')) || []))
                    .map(mg => t(`plan.muscle_groups.${mg}`, { defaultValue: mg }))
                    .join(', ')}
                </div>
              </div>
              
              <div className="flex gap-1.5 mt-3">
                {Array.from({ length: Math.min(6, exercisesCount) }).map((_, i) => (
                  <div key={i} className={cn("h-3 w-4 rounded-sm", isSelected ? "bg-blue-500" : "bg-muted-foreground/30")} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
