import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import dashboardService from '@/services/dashboardService';

export default function CnsStatusCard() {
  const [readiness, setReadiness] = useState(100);
  const [statusText, setStatusText] = useState("Optimal for Training");

  useEffect(() => {
    dashboardService.getMyStatus().then(status => {
      if (status) {
        // Simple readiness formula (mocking until we have real ML model)
        // Values are typically 1-10
        const sleep = status.sleepQuality || 7;
        const stress = status.stressLevel || 5;
        const sore = status.sorenessLevel || 5;
        
        // 100% = max sleep(10), min stress(1), min sore(1)
        const score = (sleep * 4) + ((10 - stress) * 3) + ((10 - sore) * 3);
        const finalReadiness = Math.max(10, Math.min(100, Math.round(score)));
        setReadiness(finalReadiness);
        
        if (finalReadiness >= 80) setStatusText("Optimal for Training");
        else if (finalReadiness >= 60) setStatusText("Ready with Caution");
        else setStatusText("Need Recovery");
      }
    }).catch(err => console.error(err));
  }, []);

  const dashArray = 283; // 2 * PI * 45
  const dashOffset = dashArray - (dashArray * readiness) / 100;
  
  const colorClass = readiness >= 80 ? "text-lime-500" : readiness >= 60 ? "text-yellow-500" : "text-red-500";
  const bgClass = readiness >= 80 ? "bg-lime-400/20" : readiness >= 60 ? "bg-yellow-400/20" : "bg-red-400/20";
  const borderClass = readiness >= 80 ? "border-lime-400/30" : readiness >= 60 ? "border-yellow-400/30" : "border-red-400/30";
  const textBgClass = readiness >= 80 ? "bg-lime-400/10 text-lime-600 dark:text-lime-400" : readiness >= 60 ? "bg-yellow-400/10 text-yellow-600 dark:text-yellow-400" : "bg-red-400/10 text-red-600 dark:text-red-400";

  return (
    <Card className="col-span-1 md:col-span-4 p-6 relative overflow-hidden flex flex-col justify-between min-h-[320px] border-border shadow-sm">
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${bgClass} rounded-full blur-3xl pointer-events-none`}></div>
      <h2 className="text-xl font-bold">CNS Status</h2>
      
      <div className="flex-1 flex flex-col items-center justify-center relative my-4">
        <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
          <circle className="text-muted stroke-current" cx="50" cy="50" fill="none" r="45" strokeWidth="8" strokeLinecap="round" />
          <circle className={`${colorClass} stroke-current transition-all duration-1000 ease-out`} cx="50" cy="50" fill="none" r="45" strokeWidth="8" strokeLinecap="round" strokeDasharray={dashArray} strokeDashoffset={dashOffset} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="font-mono text-[10px] font-bold text-muted-foreground tracking-widest">READINESS</span>
          <span className={`text-4xl font-black ${colorClass}`}>{readiness}%</span>
        </div>
      </div>
      
      <div className={`text-center py-2 rounded border ${borderClass} ${textBgClass} font-mono text-xs font-bold uppercase tracking-widest transition-colors duration-500`}>
        {statusText}
      </div>
    </Card>
  );
}
