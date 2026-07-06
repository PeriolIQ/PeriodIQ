import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getWorkoutPlanById } from '@/services/workoutPlanService';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PlanHeader from './components/detailpage/PlanHeader';
import WeekSidebar from './components/detailpage/WeekSidebar';
import DayList from './components/detailpage/DayList';
import ExerciseList from './components/detailpage/ExerciseList';
import { getWeeks, getDays } from '@/lib/workoutPlanUtils';

export default function PlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    async function loadPlan() {
      try {
        const data = await getWorkoutPlanById(id);
        setPlan(data);
      } catch (err) {
        setError(err.message || 'Error loading plan');
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [id]);

  const weeks = useMemo(() => plan ? getWeeks(plan) : [], [plan]);
  const currentWeek = weeks[selectedWeekIndex];
  const currentDay = currentWeek ? getDays(currentWeek)[selectedDayIndex] : null;

  // Handle week change to reset day index
  const handleWeekChange = (idx) => {
    setSelectedWeekIndex(idx);
    setSelectedDayIndex(0);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground font-medium">{t('common.loading')}</div>;
  }

  if (error || !plan) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-red-500 mb-6 font-bold">{error || 'Plan not found'}</p>
        <Button onClick={() => navigate('/workout-plans')} variant="outline" className="border-border">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 pt-2 pb-16">
      <PlanHeader plan={plan} onBack={() => navigate('/workout-plans')} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
        <div className="lg:col-span-3">
          <WeekSidebar 
            plan={plan} 
            selectedWeekIndex={selectedWeekIndex} 
            onSelectWeek={handleWeekChange} 
          />
        </div>
        
        <div className="lg:col-span-9 flex flex-col gap-6">
          <DayList 
            week={currentWeek} 
            selectedDayIndex={selectedDayIndex} 
            onSelectDay={setSelectedDayIndex} 
          />
          
          <ExerciseList day={currentDay} />
        </div>
      </div>
    </div>
  );
}
