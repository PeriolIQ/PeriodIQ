import { Card } from '@/components/ui/card';
import { ShieldCheck, Zap, Star, Crown } from 'lucide-react';

const PLAN_CONFIG = {
  Free:    { label: 'Free',     price: null,       icon: <Zap className="w-4 h-4" />,   color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/30' },
  Pro:     { label: 'Pro',      price: '$9.99/mo',  icon: <Star className="w-4 h-4" />,  color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/30' },
  Premium: { label: 'Pro Elite',price: '$14.99/mo', icon: <Crown className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
};

export default function SubscriptionCard({ tier }) {
  const plan = PLAN_CONFIG[tier] ?? PLAN_CONFIG.Free;

  return (
    <Card className="col-span-1 md:col-span-12 p-6 shadow-sm">

      <div className="flex items-center gap-2 mb-5">
        <h2 className="text-xl font-bold">Subscription &amp; Billing</h2>
        <ShieldCheck className="w-4 h-4 text-amber-400 ml-auto" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Current Plan</p>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${plan.bg} ${plan.color}`}>
              {plan.icon} {plan.label}
            </span>
            {plan.price && (
              <span className="font-mono text-2xl font-black">{plan.price}</span>
            )}
          </div>
          {tier !== 'Free' && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">Next billing: Feb 12, 2025</p>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button"
            className="px-5 py-2.5 border border-border text-foreground font-bold rounded-lg
              hover:bg-muted transition-all text-xs font-mono uppercase tracking-wider">
            Manage
          </button>
          <button type="button"
            className="px-5 py-2.5 bg-amber-400 text-black font-bold rounded-lg
              hover:bg-amber-300 transition-all text-xs font-mono uppercase tracking-wider
              shadow-lg shadow-amber-400/30">
            Upgrade
          </button>
        </div>
      </div>
    </Card>
  );
}
