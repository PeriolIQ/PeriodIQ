import { useMemo, useState } from 'react';
import { generateWorkoutPlan } from '../services/workoutPlanService';

const EQUIPMENT = ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight'];
const LIMITATIONS = [
  { value: 'lower_back_fatigue', label: 'Mỏi lưng dưới' },
  { value: 'shoulder_pain', label: 'Đau vai' },
  { value: 'knee_pain', label: 'Đau gối' },
];

const initialForm = {
  templateId: '',
  goal: 'Hypertrophy',
  fitnessLevel: 'Intermediate',
  daysPerWeek: 4,
  mainLifts: {
    squat: 100,
    bench: 80,
    deadlift: 120,
    overheadPress: 50,
  },
  limitations: [],
  equipment: EQUIPMENT,
};

export default function WorkoutPlansPage() {
  const [form, setForm] = useState(initialForm);
  const [plan, setPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const planSummary = useMemo(() => {
    if (!plan?.weeks?.length) return null;
    const days = plan.weeks.reduce((total, week) => total + (week.days?.length ?? 0), 0);
    const exercises = plan.weeks.reduce(
      (total, week) => total + (week.days ?? []).reduce((dayTotal, day) => dayTotal + (day.exercises?.length ?? 0), 0),
      0
    );

    return {
      weeks: plan.weeks.length,
      days,
      exercises,
      totalVolume: Math.round(plan.weeks.reduce((total, week) => total + Number(week.plannedTotalVolume ?? 0), 0)),
    };
  }, [plan]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        templateId: form.templateId.trim(),
        daysPerWeek: Number(form.daysPerWeek),
        mainLifts: Object.fromEntries(
          Object.entries(form.mainLifts).map(([key, value]) => [key, Number(value) || 0])
        ),
      };
      const generatedPlan = await generateWorkoutPlan(payload);
      setPlan(generatedPlan);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.Message || err.message || 'Không thể tạo giáo án.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="plans-page">
      <div className="plans-header">
        <div>
          <p className="plans-eyebrow">Rule Engine</p>
          <h1>Giáo án chu kỳ 4 tuần</h1>
          <p>Nhập thông số tập luyện để hệ thống tự tính volume, conflict CNS và progression.</p>
        </div>
      </div>

      <div className="plans-layout">
        <form className="plans-form" onSubmit={handleSubmit}>
          <section>
            <h2>Thông số chính</h2>
            <div className="plans-grid">
              <label className="plans-field">
                <span>Mục tiêu</span>
                <select value={form.goal} onChange={updateField('goal')}>
                  <option value="Hypertrophy">Hypertrophy</option>
                  <option value="Strength">Strength</option>
                  <option value="Endurance">Endurance</option>
                  <option value="Fat Loss">Fat Loss</option>
                </select>
              </label>

              <label className="plans-field">
                <span>Trình độ</span>
                <select value={form.fitnessLevel} onChange={updateField('fitnessLevel')}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>

              <label className="plans-field">
                <span>Số buổi mỗi tuần</span>
                <select value={form.daysPerWeek} onChange={updateField('daysPerWeek')}>
                  {[2, 3, 4, 5, 6].map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>

              <label className="plans-field">
                <span>Template ID</span>
                <input value={form.templateId} onChange={updateField('templateId')} placeholder="Có thể bỏ trống" />
              </label>
            </div>
          </section>

          <section>
            <h2>1RM hiện tại</h2>
            <div className="plans-grid">
              <LiftInput id="squat" label="Squat" value={form.mainLifts.squat} onChange={updateLift('squat')} />
              <LiftInput id="bench" label="Bench Press" value={form.mainLifts.bench} onChange={updateLift('bench')} />
              <LiftInput id="deadlift" label="Deadlift" value={form.mainLifts.deadlift} onChange={updateLift('deadlift')} />
              <LiftInput id="overheadPress" label="Overhead Press" value={form.mainLifts.overheadPress} onChange={updateLift('overheadPress')} />
            </div>
          </section>

          <section>
            <h2>Giới hạn & thiết bị</h2>
            <div className="plans-checks">
              {LIMITATIONS.map((item) => (
                <label key={item.value} className="plans-check">
                  <input
                    type="checkbox"
                    checked={form.limitations.includes(item.value)}
                    onChange={() => toggleArrayField('limitations', item.value)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="plans-checks">
              {EQUIPMENT.map((item) => (
                <label key={item} className="plans-check">
                  <input
                    type="checkbox"
                    checked={form.equipment.includes(item)}
                    onChange={() => toggleArrayField('equipment', item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </section>

          {error && <div className="plans-error">{error}</div>}

          <button className="plans-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang sinh giáo án...' : 'Tạo giáo án 4 tuần'}
          </button>
        </form>

        <section className="plans-result">
          {!plan ? (
            <div className="plans-empty">
              <h2>Chưa có giáo án</h2>
              <p>Kết quả sinh bởi Rule Engine sẽ hiển thị tại đây sau khi bạn bấm tạo.</p>
            </div>
          ) : (
            <>
              <div className="plans-result-header">
                <div>
                  <p className="plans-eyebrow">{plan.goal} / {plan.fitnessLevel}</p>
                  <h2>Giáo án đã tạo</h2>
                </div>
                <span className="plans-status">{plan.status}</span>
              </div>

              {planSummary && (
                <div className="plans-stats">
                  <Stat label="Tuần" value={planSummary.weeks} />
                  <Stat label="Buổi" value={planSummary.days} />
                  <Stat label="Bài tập" value={planSummary.exercises} />
                  <Stat label="Volume kg" value={planSummary.totalVolume} />
                </div>
              )}

              <div className="plans-weeks">
                {plan.weeks?.map((week) => (
                  <article key={week.weekNumber} className="plans-week">
                    <div className="plans-week-title">
                      <div>
                        <h3>Tuần {week.weekNumber}: {week.focus}</h3>
                        <p>{week.progressionRule}</p>
                      </div>
                      <span>{Math.round(Number(week.intensityMultiplier ?? 0) * 100)}%</span>
                    </div>

                    {week.days?.map((day) => (
                      <div key={`${week.weekNumber}-${day.dayNumber}`} className="plans-day">
                        <div className="plans-day-title">
                          <strong>{day.dayLabel} - {day.focusArea}</strong>
                          <span>{day.conflictStatus}</span>
                        </div>

                        <div className="plans-table-wrap">
                          <table className="plans-table">
                            <thead>
                              <tr>
                                <th>Bài tập</th>
                                <th>Nhóm cơ</th>
                                <th>Set</th>
                                <th>Rep</th>
                                <th>Intensity</th>
                                <th>RPE</th>
                                <th>Tạ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {day.exercises?.map((exercise) => (
                                <tr key={exercise.exerciseId}>
                                  <td>{exercise.exerciseName || exercise.exerciseId}</td>
                                  <td>{exercise.muscleGroup}</td>
                                  <td>{exercise.sets}</td>
                                  <td>{exercise.reps}</td>
                                  <td>{exercise.intensityPercentage}%</td>
                                  <td>{exercise.rpe}</td>
                                  <td>{exercise.targetWeightKg > 0 ? `${exercise.targetWeightKg} kg` : 'BW'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function LiftInput({ id, label, value, onChange }) {
  return (
    <label className="plans-field">
      <span>{label}</span>
      <input id={id} type="number" min="0" step="2.5" value={value} onChange={onChange} />
    </label>
  );
}

function Stat({ label, value }) {
  return (
    <div className="plans-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
