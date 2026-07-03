import { Card } from '@/components/ui/card';
import { Dumbbell, Target } from 'lucide-react';

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const GOALS = ['Strength', 'Hypertrophy', 'Endurance', 'Weight Loss', 'General Fitness'];

const LEVEL_COLOR = {
  Beginner:     'text-emerald-400',
  Intermediate: 'text-lime-400',
  Advanced:     'text-orange-400',
};

const fieldCls =
  'w-full h-10 px-3 rounded-md border border-border bg-muted/50 text-foreground text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-lime-400/40 focus:border-lime-400/60 transition-all appearance-none cursor-pointer';

export default function TrainingProfileCard({ form, setField }) {
  const days = Number(form.availableDaysPerWeek) || 1;

  return (
    <Card className="col-span-1 md:col-span-12 p-6 shadow-sm">

      <div className="flex items-center gap-2 mb-5">
        <h2 className="text-xl font-bold">Training Profile</h2>
        <Dumbbell className="w-4 h-4 text-purple-400 ml-auto" />
      </div>

      <div className="space-y-6">
        {/* Fitness Level + Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Dumbbell className="w-3 h-3" /> Fitness Level
            </label>
            <select className={fieldCls} value={form.fitnessLevel}
              onChange={(e) => setField('fitnessLevel', e.target.value)}>
              {FITNESS_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            {form.fitnessLevel && (
              <span className={`text-xs font-mono font-bold ${LEVEL_COLOR[form.fitnessLevel]}`}>
                ● {form.fitnessLevel.toUpperCase()}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Target className="w-3 h-3" /> Primary Goal
            </label>
            <select className={fieldCls} value={form.primaryGoal}
              onChange={(e) => setField('primaryGoal', e.target.value)}>
              {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Days Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Available Training Days Per Week
            </label>
            <span className="font-black text-2xl text-lime-400">{days}</span>
          </div>

          <input
            type="range" min="1" max="7" step="1" value={days}
            onChange={(e) => setField('availableDaysPerWeek', e.target.value)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted
              [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lime-400
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(163,230,53,0.6)]"
          />

          <div className="flex justify-between">
            {[1,2,3,4,5,6,7].map((n) => (
              <span key={n} className={`font-mono text-xs font-bold w-6 text-center
                ${n === days ? 'text-lime-400' : 'text-muted-foreground/40'}`}>
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <div className="font-mono text-xs font-bold text-muted-foreground mb-1">LEVEL</div>
            <div className={`text-xl font-black ${LEVEL_COLOR[form.fitnessLevel] ?? 'text-foreground'}`}>
              {form.fitnessLevel || '—'}
            </div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <div className="font-mono text-xs font-bold text-muted-foreground mb-1">GOAL</div>
            <div className="text-xl font-black text-purple-400">{form.primaryGoal || '—'}</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <div className="font-mono text-xs font-bold text-muted-foreground mb-1">DAYS/WK</div>
            <div className="text-xl font-black text-lime-400">{days}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
