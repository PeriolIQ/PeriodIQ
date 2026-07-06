import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FITNESS_LEVELS, GOALS, EQUIPMENT, LIMITATIONS } from '@/lib/constants';

function Field({ label, className = '', children }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export default function GeneratePlanForm({ form, isSubmitting, onSubmit, updateField, update1RM, toggleLimitation, toggleEquipment, t }) {
  return (
    <Card className="p-5">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-black">{t('plan.form_title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('plan.form_subtitle')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('plan.goal')}>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.goal} onChange={updateField('goal')}>
              {GOALS.map(g => <option key={g.value} value={g.value}>{t(g.labelKey)}</option>)}
            </select>
          </Field>
          <Field label={t('plan.level')}>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.fitnessLevel} onChange={updateField('fitnessLevel')}>
              {FITNESS_LEVELS.map(l => <option key={l.value} value={l.value}>{t(l.labelKey)}</option>)}
            </select>
          </Field>
          <Field label={t('plan.days_week')}>
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="7" className="h-10 w-24 rounded-lg border border-input bg-background px-3 text-sm" value={form.availableDaysPerWeek} onChange={updateField('availableDaysPerWeek')} required />
              <span className="text-sm text-muted-foreground">{t('plan.days_unit')}</span>
            </div>
          </Field>
          <Field label={t('plan.start_date')}>
            <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" type="date" value={form.startDate} onChange={updateField('startDate')} />
          </Field>
          <Field label={t('plan.template_id')}>
            <input type="text" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" placeholder={t('plan.template_placeholder')} value={form.templateId} onChange={updateField('templateId')} />
          </Field>
        </div>

        <Field label={t('plan.current_1rm')}>
          <div className="flex gap-2">
            <input type="number" placeholder="Squat" className="h-10 w-1/3 rounded-lg border border-input bg-background px-3 text-sm" value={form.current1RMs.Squat} onChange={update1RM('Squat')} />
            <input type="number" placeholder="Bench" className="h-10 w-1/3 rounded-lg border border-input bg-background px-3 text-sm" value={form.current1RMs.Bench} onChange={update1RM('Bench')} />
            <input type="number" placeholder="Deadlift" className="h-10 w-1/3 rounded-lg border border-input bg-background px-3 text-sm" value={form.current1RMs.Deadlift} onChange={update1RM('Deadlift')} />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('plan.limitations')}>
            <div className="flex flex-col gap-2.5">
              {LIMITATIONS.map(lim => (
                <label key={lim.value} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.limitations.includes(lim.value)} onChange={() => toggleLimitation(lim.value)} className="mt-1 rounded border-input text-blue-500 focus:ring-blue-500 shrink-0" />
                  <span className="leading-snug">{t(lim.labelKey)}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label={t('plan.equipment')}>
            <div className="flex flex-col gap-2.5">
              {EQUIPMENT.map(eq => (
                <label key={eq.value} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.equipment.includes(eq.value)} onChange={() => toggleEquipment(eq.value)} className="mt-1 rounded border-input text-blue-500 focus:ring-blue-500 shrink-0" />
                  <span className="leading-snug">{t(eq.labelKey)}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-bold text-black bg-blue-400 hover:bg-blue-500">
          {isSubmitting ? (
            <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> {t('plan.generating')}</span>
          ) : (
            <span className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> {t('plan.generate_btn')}</span>
          )}
        </Button>
      </form>
    </Card>
  );
}

