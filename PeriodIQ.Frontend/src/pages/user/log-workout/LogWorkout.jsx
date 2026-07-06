import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '@/services/axiosConfig';
import { toast } from 'react-hot-toast';

export default function LogWorkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([{ exerciseId: 'Bench Press', actualSets: 3, actualReps: 10, actualWeightKg: 60 }]);
  
  const handleAddExercise = () => {
    setExercises([...exercises, { exerciseId: '', actualSets: 1, actualReps: 1, actualWeightKg: 0 }]);
  };

  const handleChange = (index, field, value) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        userId: user?.sub || user?.email || 'unknown',
        workoutPlanId: 'default-plan',
        weekNumber: 1,
        day: new Date().getDay(),
        completedAt: new Date().toISOString(),
        overallSessionRpe: 8,
        performedExercises: exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            actualSets: Number(ex.actualSets),
            actualReps: Number(ex.actualReps),
            actualWeightKg: Number(ex.actualWeightKg),
            failedRep: false
        }))
      };
      
      await api.post('/api/WorkoutSessionLogs', payload);
      toast.success(t('log_workout.save_success') || 'Đã lưu nhật ký thành công!');
      navigate('/dashboard');
    } catch (err) {
      console.error("Failed to log workout:", err);
      toast.error(t('log_workout.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('log_workout.title')}</h2>
        <p className="text-muted-foreground">{t('log_workout.subtitle')}</p>
      </div>

      <Card className="p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {exercises.map((ex, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end border-b pb-4">
                <div className="col-span-12 md:col-span-5">
                  <label className="text-sm font-medium mb-1 block">{t('log_workout.exercise')}</label>
                  <input 
                    type="text" 
                    value={ex.exerciseId} 
                    onChange={(e) => handleChange(index, 'exerciseId', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors"
                    placeholder={t('log_workout.exercise_placeholder')}
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">{t('log_workout.sets')}</label>
                  <input 
                    type="number" 
                    value={ex.actualSets}
                    onChange={(e) => handleChange(index, 'actualSets', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">{t('log_workout.reps')}</label>
                  <input 
                    type="number" 
                    value={ex.actualReps}
                    onChange={(e) => handleChange(index, 'actualReps', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-3">
                  <label className="text-sm font-medium mb-1 block">{t('log_workout.weight')}</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={ex.actualWeightKg}
                    onChange={(e) => handleChange(index, 'actualWeightKg', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={handleAddExercise}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-blue-400/20 text-blue-600 dark:text-blue-400 h-10 px-4 py-2 border w-full border-dashed border-blue-400/50"
          >
            {t('log_workout.add_exercise')}
          </button>

          <div className="pt-4 border-t flex justify-end gap-3">
             <button 
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted text-foreground h-10 px-4 py-2 border"
             >
                {t('log_workout.cancel')}
             </button>
             <button 
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-400 text-black hover:bg-blue-500 h-10 px-6 py-2 uppercase tracking-wide transition-colors"
             >
                {loading ? t('log_workout.saving') : t('log_workout.save')}
             </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

