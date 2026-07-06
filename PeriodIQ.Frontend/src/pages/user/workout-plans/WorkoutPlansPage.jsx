import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, CalendarDays, Dumbbell, TrendingUp } from 'lucide-react';
import {
  generateWorkoutPlan,
  getMyWorkoutPlans,
} from '@/services/workoutPlanService';
import { EQUIPMENT, LIMITATIONS } from '@/lib/constants';

import { getPlanId, getWeeks, getDays, getExercises, readValue, sortPlans } from '@/lib/workoutPlanUtils';
import { toast } from 'react-hot-toast';

import PageHeader from './components/page/PageHeader';
import Metric from './components/page/Metric';
import GeneratePlanForm from './components/page/GeneratePlanForm';
import PlanList from './components/page/PlanList';

const initialForm = {
  templateId: '',
  goal: 'Hypertrophy',
  fitnessLevel: 'Intermediate',
  availableDaysPerWeek: 4,
  startDate: new Date().toISOString().slice(0, 10),
  current1RMs: {
    Squat: 100,
    Bench: 80,
    Deadlift: 120,
  },
  limitations: [],
  equipment: EQUIPMENT.map(e => e.value),
};

export default function WorkoutPlansPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState(initialForm);
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeWeeks = getWeeks(activePlan);

  const planSummary = useMemo(() => {
    if (!activePlan || activeWeeks.length === 0) {
      return { weeks: 0, days: 0, exercises: 0, volume: 0 };
    }

    const days = activeWeeks.reduce((total, week) => total + getDays(week).length, 0);
    const exercises = activeWeeks.reduce(
      (total, week) => total + getDays(week).reduce((dayTotal, day) => dayTotal + getExercises(day).length, 0),
      0
    );
    const volume = activeWeeks.reduce(
      (total, week) => total + Number(readValue(week, 'plannedTotalVolume', 'PlannedTotalVolume') ?? 0),
      0
    );

    return { weeks: activeWeeks.length, days, exercises, volume: Math.round(volume) };
  }, [activePlan, activeWeeks]);

  const activePlanId = getPlanId(activePlan);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setIsLoadingPlans(true);

    try {
      const data = await getMyWorkoutPlans();
      const sorted = sortPlans(Array.isArray(data) ? data : []);
      setPlans(sorted);
      setActivePlan((current) => current ?? sorted[0] ?? null);
    } catch (err) {
      toast.error(err.message || 'Error loading plans');
    } finally {
      setIsLoadingPlans(false);
    }
  }

  const updateField = (field) => (event) => {
    const value = field === 'availableDaysPerWeek' ? Number(event.target.value) : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const update1RM = (lift) => (event) => {
    setForm((current) => ({
      ...current,
      current1RMs: { ...current.current1RMs, [lift]: Number(event.target.value) }
    }));
  };

  const toggleLimitation = (value) => {
    setForm((current) => ({
      ...current,
      limitations: current.limitations.includes(value)
        ? current.limitations.filter(i => i !== value)
        : [...current.limitations, value]
    }));
  };

  const toggleEquipment = (value) => {
    setForm((current) => ({
      ...current,
      equipment: current.equipment.includes(value)
        ? current.equipment.filter(i => i !== value)
        : [...current.equipment, value]
    }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        daysPerWeek: form.availableDaysPerWeek,
        mainLifts: form.current1RMs
      };
      const generatedPlan = await generateWorkoutPlan(payload);
      setActivePlan(generatedPlan);
      setPlans(sortPlans([generatedPlan, ...plans]));
      toast.success(t('plan.success_msg') || 'Tạo giáo án thành công!');
    } catch (err) {
      toast.error(err.message || 'Error generating plan');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
      <PageHeader onRefresh={loadPlans} isRefreshing={isLoadingPlans} t={t} />

      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={CalendarDays} label={t('plan.weeks')} value={planSummary.weeks || '-'} tone="lime" />
        <Metric icon={Activity} label={t('plan.sessions')} value={planSummary.days || '-'} tone="sky" />
        <Metric icon={Dumbbell} label={t('plan.exercises')} value={planSummary.exercises || '-'} tone="violet" />
        <Metric icon={TrendingUp} label={t('plan.volume')} value={planSummary.volume.toLocaleString('vi-VN') || '-'} tone="amber" />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <GeneratePlanForm
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          updateField={updateField}
          update1RM={update1RM}
          toggleLimitation={toggleLimitation}
          toggleEquipment={toggleEquipment}
          t={t}
        />
        <PlanList plans={plans} selectedId={activePlanId} onSelect={setActivePlan} isLoading={isLoadingPlans} t={t} />
      </div>
    </div>
  );
}
