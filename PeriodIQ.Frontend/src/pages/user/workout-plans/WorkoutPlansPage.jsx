import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  Dumbbell,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  generateWorkoutPlan,
  getMyWorkoutPlans,
} from '@/services/workoutPlanService';

const EQUIPMENT = ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight'];

const LIMITATIONS = [
  { value: 'lower_back_fatigue', label: 'Mỏi lưng dưới' },
  { value: 'shoulder_pain', label: 'Đau vai' },
  { value: 'knee_pain', label: 'Đau gối' },
];

const GOALS = [
  { value: 'Hypertrophy', label: 'Hypertrophy' },
  { value: 'Strength', label: 'Strength' },
  { value: 'Endurance', label: 'Endurance' },
  { value: 'Fat Loss', label: 'Fat Loss' },
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const initialForm = {
  templateId: '',
  goal: 'Hypertrophy',
  fitnessLevel: 'Intermediate',
  daysPerWeek: 4,
  startDate: new Date().toISOString().slice(0, 10),
  mainLifts: {
    squat: 100,
    bench: 80,
    deadlift: 120,
    overheadPress: 50,
  },
  limitations: [],
  equipment: EQUIPMENT,
};

function readValue(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }

  return undefined;
}

function getPlanId(plan) {
  return readValue(plan, 'id', 'Id') ?? '';
}

function getWeeks(plan) {
  return readValue(plan, 'weeks', 'Weeks') ?? [];
}

function getDays(week) {
  return readValue(week, 'days', 'Days') ?? [];
}

function getExercises(day) {
  return readValue(day, 'exercises', 'Exercises') ?? [];
}

function formatDate(value) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatKg(value) {
  const number = Number(value ?? 0);
  if (number <= 0) return 'BW';
  return `${number.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} kg`;
}

function sortPlans(plans) {
  return [...plans].sort((a, b) => {
    const aTime = new Date(readValue(a, 'generatedAt', 'GeneratedAt', 'startDate', 'StartDate') ?? 0).getTime();
    const bTime = new Date(readValue(b, 'generatedAt', 'GeneratedAt', 'startDate', 'StartDate') ?? 0).getTime();
    return bTime - aTime;
  });
}

export default function WorkoutPlansPage() {
  const [form, setForm] = useState(initialForm);
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const activeWeeks = getWeeks(activePlan);

  const planSummary = useMemo(() => {
    if (!activePlan || activeWeeks.length === 0) {
      return {
        weeks: 0,
        days: 0,
        exercises: 0,
        volume: 0,
      };
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

    return {
      weeks: activeWeeks.length,
      days,
      exercises,
      volume: Math.round(volume),
    };
  }, [activePlan, activeWeeks]);

  const activePlanId = getPlanId(activePlan);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setIsLoadingPlans(true);
    setError('');

    try {
      const data = await getMyWorkoutPlans();
      const sorted = sortPlans(Array.isArray(data) ? data : []);
      setPlans(sorted);
      setActivePlan((current) => current ?? sorted[0] ?? null);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.Message || err.message || 'Không tải được danh sách giáo án.');
    } finally {
      setIsLoadingPlans(false);
    }
  }

  const updateField = (field) => (event) => {
    const value = field === 'daysPerWeek' ? Number(event.target.value) : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateLift = (field) => (event) => {
    setForm((current) => ({
      ...current,
      mainLifts: {
        ...current.mainLifts,
        [field]: event.target.value,
      },
    }));
  };

  const toggleArrayField = (field, value) => {
    setForm((current) => {
      const values = current[field];
      return {
        ...current,
        [field]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsGenerating(true);

    try {
      const payload = {
        templateId: form.templateId.trim(),
        goal: form.goal,
        fitnessLevel: form.fitnessLevel,
        daysPerWeek: Number(form.daysPerWeek),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        equipment: form.equipment,
        limitations: form.limitations,
        mainLifts: Object.fromEntries(
          Object.entries(form.mainLifts).map(([key, value]) => [key, Number(value) || 0])
        ),
      };
      const generatedPlan = await generateWorkoutPlan(payload);
      const generatedId = getPlanId(generatedPlan);

      setActivePlan(generatedPlan);
      setPlans((current) => {
        const filtered = generatedId
          ? current.filter((plan) => getPlanId(plan) !== generatedId)
          : current;
        return sortPlans([generatedPlan, ...filtered]);
      });
      setNotice('Rule Engine đã sinh giáo án mới gồm volume, CNS conflict và progression.');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.Message || err.message || 'Không thể tạo giáo án.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
      <PageHeader onRefresh={loadPlans} isRefreshing={isLoadingPlans} />

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={CalendarDays} label="Số tuần" value={planSummary.weeks || '-'} tone="lime" />
        <Metric icon={Activity} label="Buổi tập" value={planSummary.days || '-'} tone="sky" />
        <Metric icon={Dumbbell} label="Bài tập" value={planSummary.exercises || '-'} tone="violet" />
        <Metric icon={TrendingUp} label="Volume dự kiến" value={planSummary.volume ? planSummary.volume.toLocaleString('vi-VN') : '-'} tone="amber" />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <GeneratePlanForm
          form={form}
          isGenerating={isGenerating}
          onSubmit={handleSubmit}
          updateField={updateField}
          updateLift={updateLift}
          toggleArrayField={toggleArrayField}
        />

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <PlanList
            plans={plans}
            activePlanId={activePlanId}
            isLoading={isLoadingPlans}
            onSelect={setActivePlan}
          />
          <PlanPreview plan={activePlan} />
        </div>
      </div>
    </div>
  );
}

function PageHeader({ onRefresh, isRefreshing }) {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-lime-500/20 bg-lime-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-700 dark:text-lime-300">
          <Sparkles className="h-3.5 w-3.5" />
          Rule Engine
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Giáo án chu kỳ 4 tuần</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">
          Tạo giáo án theo Volume Filter, CNS Conflict Resolution và Progression Builder. Kết quả có tuần deload, set/rep và mức tạ mục tiêu.
        </p>
      </div>
      <Button variant="outline" className="h-10 w-fit gap-2" onClick={onRefresh} disabled={isRefreshing}>
        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Làm mới
      </Button>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  const tones = {
    lime: 'bg-lime-500/10 text-lime-700 dark:text-lime-300',
    sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function GeneratePlanForm({ form, isGenerating, onSubmit, updateField, updateLift, toggleArrayField }) {
  return (
    <Card className="p-5">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-black">Tạo giáo án</h2>
          <p className="mt-1 text-sm text-muted-foreground">Nhập thông số chính để Lambda Rule Engine tính plan mới.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mục tiêu">
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.goal} onChange={updateField('goal')}>
              {GOALS.map((goal) => (
                <option key={goal.value} value={goal.value}>{goal.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Trình độ">
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.fitnessLevel} onChange={updateField('fitnessLevel')}>
              {LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </Field>
          <Field label="Buổi mỗi tuần">
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.daysPerWeek} onChange={updateField('daysPerWeek')}>
              {[2, 3, 4, 5, 6].map((day) => (
                <option key={day} value={day}>{day} buổi</option>
              ))}
            </select>
          </Field>
          <Field label="Ngày bắt đầu">
            <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" type="date" value={form.startDate} onChange={updateField('startDate')} />
          </Field>
          <Field label="Template ID" className="sm:col-span-2">
            <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.templateId} onChange={updateField('templateId')} placeholder="Bỏ trống để dùng default blueprint" />
          </Field>
        </div>

        <div className="space-y-3">
          <SectionTitle icon={Target} title="1RM hiện tại" />
          <div className="grid gap-3 sm:grid-cols-2">
            <LiftInput id="squat" label="Squat" value={form.mainLifts.squat} onChange={updateLift('squat')} />
            <LiftInput id="bench" label="Bench Press" value={form.mainLifts.bench} onChange={updateLift('bench')} />
            <LiftInput id="deadlift" label="Deadlift" value={form.mainLifts.deadlift} onChange={updateLift('deadlift')} />
            <LiftInput id="overheadPress" label="Overhead Press" value={form.mainLifts.overheadPress} onChange={updateLift('overheadPress')} />
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle icon={ShieldAlert} title="Hạn chế cơ thể" />
          <div className="flex flex-wrap gap-2">
            {LIMITATIONS.map((item) => (
              <ToggleChip
                key={item.value}
                active={form.limitations.includes(item.value)}
                label={item.label}
                onClick={() => toggleArrayField('limitations', item.value)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle icon={Dumbbell} title="Thiết bị có sẵn" />
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map((item) => (
              <ToggleChip
                key={item}
                active={form.equipment.includes(item)}
                label={item}
                onClick={() => toggleArrayField('equipment', item)}
              />
            ))}
          </div>
        </div>

        <Button className="h-11 w-full gap-2 bg-lime-400 font-black uppercase tracking-wide text-black hover:bg-lime-500" type="submit" disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isGenerating ? 'Đang sinh giáo án' : 'Tạo giáo án 4 tuần'}
        </Button>
      </form>
    </Card>
  );
}

function PlanList({ plans, activePlanId, isLoading, onSelect }) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black">Plan của tôi</h2>
          <p className="text-xs text-muted-foreground">Danh sách lấy từ API</p>
        </div>
        <Badge variant="neutral">{plans.length}</Badge>
      </div>

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang tải
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Chưa có giáo án. Hãy tạo plan đầu tiên bằng form bên trái.
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => {
            const id = getPlanId(plan);
            const isActive = id && id === activePlanId;
            return (
              <button
                key={id || `${readValue(plan, 'startDate', 'StartDate')}-${readValue(plan, 'goal', 'Goal')}`}
                type="button"
                onClick={() => onSelect(plan)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isActive
                    ? 'border-lime-500/50 bg-lime-500/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{readValue(plan, 'goal', 'Goal') || 'Workout Plan'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(readValue(plan, 'startDate', 'StartDate'))}</p>
                  </div>
                  <Badge variant={readValue(plan, 'status', 'Status') === 'Active' ? 'success' : 'neutral'}>
                    {readValue(plan, 'status', 'Status') || 'Plan'}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function PlanPreview({ plan }) {
  if (!plan) {
    return (
      <Card className="flex min-h-[520px] items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-300">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black">Chưa chọn giáo án</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tạo giáo án mới hoặc chọn một plan trong danh sách để xem chi tiết 4 tuần.</p>
        </div>
      </Card>
    );
  }

  const weeks = getWeeks(plan);

  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="success" dot>{readValue(plan, 'status', 'Status') || 'Active'}</Badge>
            <Badge variant="info">{readValue(plan, 'fitnessLevel', 'FitnessLevel') || 'Intermediate'}</Badge>
          </div>
          <h2 className="text-2xl font-black">{readValue(plan, 'goal', 'Goal') || 'Giáo án'} Mesocycle</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(readValue(plan, 'startDate', 'StartDate'))} - {formatDate(readValue(plan, 'endDate', 'EndDate'))}
          </p>
        </div>
        <div className="rounded-lg border border-border px-4 py-3 text-sm">
          <p className="font-bold">Rule Engine Output</p>
          <p className="mt-1 text-muted-foreground">Volume &gt; CNS &gt; Progression</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {weeks.map((week) => (
          <WeekBlock key={readValue(week, 'weekNumber', 'WeekNumber')} week={week} />
        ))}
      </div>
    </Card>
  );
}

function WeekBlock({ week }) {
  const weekNumber = readValue(week, 'weekNumber', 'WeekNumber');
  const focus = readValue(week, 'focus', 'Focus');
  const isDeload = String(focus ?? '').toLowerCase().includes('deload');

  return (
    <section className="rounded-lg border border-border">
      <div className="flex flex-col justify-between gap-3 border-b border-border p-4 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black">Tuần {weekNumber}: {focus}</h3>
            {isDeload && <Badge variant="warning">Deload</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{readValue(week, 'progressionRule', 'ProgressionRule')}</p>
        </div>
        <div className="flex gap-2 text-xs font-bold text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-1">
            Intensity {Math.round(Number(readValue(week, 'intensityMultiplier', 'IntensityMultiplier') ?? 0) * 100)}%
          </span>
          <span className="rounded-md bg-muted px-2 py-1">
            {Math.round(Number(readValue(week, 'plannedTotalVolume', 'PlannedTotalVolume') ?? 0)).toLocaleString('vi-VN')} kg
          </span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {getDays(week).map((day) => (
          <DayBlock key={`${weekNumber}-${readValue(day, 'dayNumber', 'DayNumber')}`} day={day} />
        ))}
      </div>
    </section>
  );
}

function DayBlock({ day }) {
  return (
    <div className="p-4">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
        <div>
          <p className="font-bold">
            {readValue(day, 'dayLabel', 'DayLabel') || `Day ${readValue(day, 'dayNumber', 'DayNumber')}`} - {readValue(day, 'focusArea', 'FocusArea')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{readValue(day, 'conflictStatus', 'ConflictStatus')}</p>
        </div>
        <Badge variant="neutral">CNS {readValue(day, 'cnsStressScore', 'CnsStressScore') ?? '-'}</Badge>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 text-left">Bài tập</th>
              <th className="py-2 pr-3 text-left">Nhóm cơ</th>
              <th className="py-2 pr-3 text-left">Set</th>
              <th className="py-2 pr-3 text-left">Rep</th>
              <th className="py-2 pr-3 text-left">Intensity</th>
              <th className="py-2 pr-3 text-left">RPE</th>
              <th className="py-2 pr-3 text-left">Tạ</th>
            </tr>
          </thead>
          <tbody>
            {getExercises(day).map((exercise) => (
              <tr key={readValue(exercise, 'exerciseId', 'ExerciseId')} className="border-b border-border last:border-0">
                <td className="py-3 pr-3 font-medium">{readValue(exercise, 'exerciseName', 'ExerciseName') || readValue(exercise, 'exerciseId', 'ExerciseId')}</td>
                <td className="py-3 pr-3 text-muted-foreground">{readValue(exercise, 'muscleGroup', 'MuscleGroup')}</td>
                <td className="py-3 pr-3">{readValue(exercise, 'sets', 'Sets')}</td>
                <td className="py-3 pr-3">{readValue(exercise, 'reps', 'Reps')}</td>
                <td className="py-3 pr-3">{readValue(exercise, 'intensityPercentage', 'IntensityPercentage')}%</td>
                <td className="py-3 pr-3">{readValue(exercise, 'rpe', 'Rpe')}</td>
                <td className="py-3 pr-3 font-bold">{formatKg(readValue(exercise, 'targetWeightKg', 'TargetWeightKg'))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 text-sm font-black">
      <Icon className="h-4 w-4 text-lime-600 dark:text-lime-300" />
      {title}
    </div>
  );
}

function Field({ label, className = '', children }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function LiftInput({ id, label, value, onChange }) {
  return (
    <Field label={label}>
      <input
        id={id}
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        type="number"
        min="0"
        step="2.5"
        value={value}
        onChange={onChange}
      />
    </Field>
  );
}

function ToggleChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-lime-500/40 bg-lime-500/15 text-lime-700 dark:text-lime-300'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
