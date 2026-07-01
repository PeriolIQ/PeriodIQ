import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/axiosConfig';

export default function LogWorkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      navigate('/');
    } catch (err) {
      console.error("Failed to log workout:", err);
      alert("Có lỗi xảy ra khi lưu nhật ký.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ghi Log Buổi Tập</h2>
        <p className="text-muted-foreground">Lưu lại thành tích buổi tập hôm nay của bạn.</p>
      </div>

      <Card className="p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {exercises.map((ex, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end border-b pb-4">
                <div className="col-span-12 md:col-span-5">
                  <label className="text-sm font-medium mb-1 block">Bài tập</label>
                  <input 
                    type="text" 
                    value={ex.exerciseId} 
                    onChange={(e) => handleChange(index, 'exerciseId', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:border-lime-500 transition-colors"
                    placeholder="VD: Squat"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Sets</label>
                  <input 
                    type="number" 
                    value={ex.actualSets}
                    onChange={(e) => handleChange(index, 'actualSets', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 transition-colors"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Reps</label>
                  <input 
                    type="number" 
                    value={ex.actualReps}
                    onChange={(e) => handleChange(index, 'actualReps', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 transition-colors"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-3">
                  <label className="text-sm font-medium mb-1 block">Tạ (kg)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={ex.actualWeightKg}
                    onChange={(e) => handleChange(index, 'actualWeightKg', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 transition-colors"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={handleAddExercise}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-lime-400/20 text-lime-600 dark:text-lime-400 h-10 px-4 py-2 border w-full border-dashed border-lime-400/50"
          >
            + Thêm bài tập
          </button>

          <div className="pt-4 border-t flex justify-end gap-3">
             <button 
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted text-foreground h-10 px-4 py-2 border"
             >
                Hủy
             </button>
             <button 
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-lime-400 text-black hover:bg-lime-500 h-10 px-6 py-2 uppercase tracking-wide transition-colors"
             >
                {loading ? 'Đang lưu...' : 'Lưu Nhật Ký & Nhận XP'}
             </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
