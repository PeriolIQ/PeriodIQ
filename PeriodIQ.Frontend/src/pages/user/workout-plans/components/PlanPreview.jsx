import React, { useState } from 'react';
import { Dumbbell, Calendar } from 'lucide-react';
import { getWeeks, getDays, getExercises, formatKg, readValue, formatDate } from '@/lib/workoutPlanUtils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function PlanPreview({ plan, t }) {
  const [activeWeek, setActiveWeek] = useState(0);

  if (!plan) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center bg-card/50">
        <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <h3 className="text-lg font-bold">{t('plan.not_selected')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t('plan.select_prompt')}</p>
      </div>
    );
  }

  const weeks = getWeeks(plan);
  const currentWeekData = weeks[activeWeek] || weeks[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase text-foreground">
            {t('plan.plan_label')}: {t('constants.goals.' + readValue(plan, 'goal', 'Goal')?.toLowerCase()) || readValue(plan, 'goal', 'Goal')}
          </h2>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground font-medium">
            <Calendar className="w-4 h-4" />
            {formatDate(readValue(plan, 'startDate', 'StartDate'))}
          </div>
        </div>
        <Badge variant={readValue(plan, 'status', 'Status') === 'Active' ? 'success' : 'neutral'}>
          {readValue(plan, 'status', 'Status') === 'Active' 
            ? t('common.active') 
            : (readValue(plan, 'status', 'Status') === 'Completed' 
                ? t('common.completed') 
                : readValue(plan, 'status', 'Status'))}
        </Badge>
      </div>

      <div className="flex overflow-x-auto gap-2 py-2 hide-scrollbar">
        {weeks.map((week, idx) => (
          <button
            key={idx}
            onClick={() => setActiveWeek(idx)}
            className={cn(
              "whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all border",
              activeWeek === idx 
                ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                : "bg-card border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {t('plan.week_label', { week: idx + 1 })}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {currentWeekData && getDays(currentWeekData).map((day, dayIdx) => (
          <Card key={dayIdx} className="overflow-hidden border-border shadow-md rounded-2xl">
            <CardHeader className="bg-muted/40 border-b border-border/50 py-3.5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-3 tracking-wide">
                <span className="bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2.5 py-1 rounded text-xs uppercase font-black">
                  Ngày {readValue(day, 'dayNumber', 'DayNumber')}
                </span>
                {readValue(day, 'focusArea', 'FocusArea')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/10 text-muted-foreground text-[11px] uppercase tracking-wider text-left border-b border-border/50">
                    <tr>
                      <th className="px-5 py-3 font-bold">{t('plan.exercise')}</th>
                      <th className="px-5 py-3 font-bold">{t('plan.muscle')}</th>
                      <th className="px-5 py-3 font-bold text-center">Sets × Reps</th>
                      <th className="px-5 py-3 font-bold text-center">{t('plan.weight')}</th>
                      <th className="px-5 py-3 font-bold text-center">RPE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {getExercises(day).map((ex, exIdx) => (
                      <tr key={exIdx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-foreground">
                          {readValue(ex, 'exerciseName', 'ExerciseName')}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground font-medium">
                          {readValue(ex, 'muscleGroup', 'MuscleGroup')}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono font-bold">
                          {readValue(ex, 'sets', 'Sets')} × {readValue(ex, 'reps', 'Reps')}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge variant="outline" className="font-mono text-[13px] font-black text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                            {formatKg(readValue(ex, 'targetWeightKg', 'TargetWeightKg'))}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-center text-muted-foreground font-mono font-bold">
                          {readValue(ex, 'rpe', 'Rpe')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
