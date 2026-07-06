import { Card } from '@/components/ui/card';
import { User, Mail, Scale, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const fieldCls =
  'w-full h-10 px-3 rounded-md border border-border bg-muted/50 text-foreground text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/60 transition-all placeholder:text-muted-foreground';

export default function PersonalInfoCard({ form, setField }) {
  const { t } = useTranslation();
  return (
    <Card className="col-span-1 md:col-span-12 p-6 shadow-sm">

      <div className="flex items-center gap-2 mb-5">
        <h2 className="text-xl font-bold">{t('profile.personal_info')}</h2>
        <User className="w-4 h-4 text-blue-400 ml-auto" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <UserCircle className="w-3 h-3" /> {t('profile.fullname')}
          </label>
          <input className={fieldCls} type="text"
            value={form.fullName} onChange={(e) => setField('fullName', e.target.value)}
            placeholder="Alex Johnson" />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Mail className="w-3 h-3" /> {t('profile.email')}
          </label>
          <input className={fieldCls} type="email"
            value={form.email} onChange={(e) => setField('email', e.target.value)}
            placeholder="email@example.com" />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <User className="w-3 h-3" /> {t('profile.gender')}
          </label>
          <select className={fieldCls + ' appearance-none cursor-pointer'}
            value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
            <option value="">-- Select --</option>
            <option value="Male">{t('profile.male')}</option>
            <option value="Female">{t('profile.female')}</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Scale className="w-3 h-3" /> {t('profile.bodyweight')}
          </label>
          <input className={fieldCls} type="number" min="30" max="300" step="0.1"
            value={form.bodyWeightKg} onChange={(e) => setField('bodyWeightKg', e.target.value)}
            placeholder="70" />
        </div>
      </div>
    </Card>
  );
}

