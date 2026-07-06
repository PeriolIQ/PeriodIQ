import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLabel, GOALS } from '@/lib/constants';
import dashboardService from '@/services/dashboardService';

export default function CurrentMesocycleCard() {
  const { t } = useTranslation();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    dashboardService.getMyPlans().then(plans => {
      if (plans && plans.length > 0) {
        // Find the active or most recent plan
        const activePlan = plans.find(p => p.status === 'Active') || plans[0];
        setPlan(activePlan);
      }
    }).catch(err => console.error(err));
  }, []);

  if (!plan) {
    return (
      <Card className="col-span-1 md:col-span-8 p-6 flex flex-col justify-center items-center min-h-[320px] border-border shadow-sm">
        <Dumbbell className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">{t('dashboard.meso_no_active')}</h2>
        <p className="text-muted-foreground">{t('dashboard.meso_create')}</p>
      </Card>
    );
  }

  // Calculate current week based on start date
  const startDate = new Date(plan.startDate);
  const now = new Date();
  const diffTime = Math.abs(now - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const currentWeek = Math.min(plan.weeks.length, Math.max(1, Math.ceil(diffDays / 7)));
  
  // Calculate total volume for the current week
  const currentWeekPlan = plan.weeks.find(w => w.weekNumber === currentWeek) || plan.weeks[0];
  const targetRir = currentWeekPlan?.progressionRule || "1-2";
  const estVolume = currentWeekPlan?.plannedTotalVolume || 14000;
  
  // Calculate progress bar
  const progressPercent = (currentWeek / Math.max(1, plan.weeks.length)) * 100;

  return (
    <Card className="col-span-1 md:col-span-8 p-6 flex flex-col justify-between min-h-[320px] border-border shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">{t('dashboard.meso_current')}</h2>
          <p className="text-muted-foreground font-mono text-xs mt-1 uppercase tracking-widest">{t('dashboard.meso_goal')}: {getLabel(t, GOALS, plan.goal) || plan.goal}</p>
        </div>
        <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded font-mono text-xs font-bold flex items-center gap-1.5 uppercase">
          <Dumbbell className="w-4 h-4" />
          {currentWeekPlan?.focus || 'Tập trung Volume'}
        </div>
      </div>
      
      <div className="flex-1 flex items-center my-6">
        <div className="w-full space-y-3">
          <div className="flex justify-between font-mono text-xs font-bold text-muted-foreground uppercase">
            <span>{t('plan.week_label', { week: currentWeek })}</span>
            <span>{t('plan.week_label', { week: plan.weeks.length || 4 })}</span>
          </div>
          <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
            <div className="h-full bg-purple-500 relative" style={{width: `${progressPercent}%`}}>
              <div className="absolute inset-0 bg-white/20" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)'}}></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-auto">
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <div className="font-mono text-xs font-bold text-muted-foreground mb-1 uppercase">{t('dashboard.meso_avg_rir')}</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{targetRir.includes('RIR') ? targetRir : '1-2 RIR'}</div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <div className="font-mono text-xs font-bold text-muted-foreground mb-1 uppercase">{t('dashboard.meso_volume')}</div>
          <div className="text-2xl font-bold">{(estVolume/1000).toFixed(1)}k<span className="text-sm text-muted-foreground">kg</span></div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <div className="font-mono text-xs font-bold text-muted-foreground mb-1 uppercase">STATUS</div>
          <div className="text-2xl font-bold">{plan.status === 'Active' ? t('common.active') : plan.status}</div>
        </div>
      </div>
    </Card>
  );
}
