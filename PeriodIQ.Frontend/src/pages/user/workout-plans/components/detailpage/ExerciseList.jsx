import React from 'react';
import { getExercises, readValue, formatKg } from '@/lib/workoutPlanUtils';
import { Cpu, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ExerciseList({ day, onBack }) {
  const { t } = useTranslation();
  if (!day) return null;
  const exercises = getExercises(day);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/80">
        <h3 className="text-xl font-bold">
          {t('plan.exercises_header', {
            day: readValue(day, 'dayNumber', 'DayNumber'),
            focus: t(`plan.focus_areas.${readValue(day, 'focusArea', 'FocusArea')}`, { defaultValue: readValue(day, 'focusArea', 'FocusArea') })
          })}
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-blue-500 text-sm font-mono font-bold uppercase">
            <Cpu className="w-4 h-4" />
            {t('plan.ai_optimized')}
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors border border-border rounded-lg px-3 py-1.5 hover:bg-muted/60"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {exercises.map((ex, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-5 border-b border-border/60 last:border-0 hover:bg-muted/30 px-4 -mx-4 rounded-xl transition-colors">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-foreground">{readValue(ex, 'exerciseName', 'ExerciseName')}</h4>
              <p className="text-sm text-blue-400/90 mt-1 font-medium">
                {t(`plan.muscle_groups.${readValue(ex, 'muscleGroup', 'MuscleGroup')}`, { defaultValue: readValue(ex, 'muscleGroup', 'MuscleGroup') })}
              </p>
              
              <div className="flex gap-8 mt-5">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">{t('plan.sets_x_reps')}</div>
                  <div className="font-mono font-bold text-sm">
                    {readValue(ex, 'sets', 'Sets')} × {readValue(ex, 'reps', 'Reps')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">{t('plan.target_rpe')}</div>
                  <div className="font-mono font-bold text-sm">
                    {readValue(ex, 'rpe', 'Rpe')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">{t('plan.rest')}</div>
                  <div className="font-mono font-bold text-sm">
                    {readValue(ex, 'restTimeInSeconds', 'RestTimeInSeconds')}s
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 text-right pr-2">
              <div className="text-4xl font-black text-blue-400">
                {readValue(ex, 'targetWeightKg', 'TargetWeightKg')}
                <span className="text-lg text-muted-foreground ml-1">kg</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                {t('plan.target_weight')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
