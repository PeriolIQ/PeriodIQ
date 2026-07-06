import { Card } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NextSessionCard() {
  const { t } = useTranslation();
  return (
    <Card className="col-span-1 md:col-span-4 p-6 relative overflow-hidden flex flex-col justify-between min-h-[250px] shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_15px_rgba(132,204,22,0.8)]"></div>
      <div className="flex justify-between items-center pl-2">
        <h2 className="text-xl font-bold">{t('dashboard.next_session')}</h2>
        <Calendar className="text-blue-500 w-5 h-5" />
      </div>
      <div className="my-6 pl-2">
        <div className="text-3xl font-black text-blue-500">{t('dashboard.session_name')}</div>
        <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-xs font-bold mt-3 uppercase tracking-wider">
          <Clock className="w-4 h-4" />
          {t('dashboard.est_time')}
        </div>
      </div>
      <div className="flex gap-2 pl-2">
        <span className="px-3 py-1 bg-muted text-muted-foreground rounded font-mono text-xs font-bold uppercase tracking-wider">{t('dashboard.leg')}</span>
        <span className="px-3 py-1 bg-muted text-muted-foreground rounded font-mono text-xs font-bold uppercase tracking-wider">{t('dashboard.core')}</span>
      </div>
    </Card>
  );
}
