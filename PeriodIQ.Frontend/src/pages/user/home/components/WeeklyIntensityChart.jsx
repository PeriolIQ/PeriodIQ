import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import dashboardService from '@/services/dashboardService';

export default function WeeklyIntensityChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    dashboardService.getMyLogs().then(logs => {
      // Calculate last 7 days
      const days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        
        // Find if there's a log for this day
        const dayLogs = logs.filter(log => {
          const logDate = new Date(log.completedAt);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === d.getTime();
        });
        
        // Average RPE if multiple logs, otherwise 0
        let rpe = 0;
        if (dayLogs.length > 0) {
          const sum = dayLogs.reduce((acc, log) => acc + (log.overallSessionRpe || 0), 0);
          rpe = sum / dayLogs.length;
        }
        
        const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        
        days.push({
          label: dayLabels[d.getDay()],
          rpe: Math.min(10, Math.max(0, rpe)) // clamp 0-10
        });
      }
      
      setChartData(days);
    }).catch(err => console.error(err));
  }, []);

  return (
    <Card className="col-span-1 md:col-span-8 p-6 min-h-[250px] flex flex-col shadow-sm">
      <h2 className="text-xl font-bold mb-6">7-Day Intensity (RPE)</h2>
      <div className="flex-1 flex items-end justify-between gap-4 h-full pt-4">
        
        {chartData.length === 0 ? (
          <div className="w-full text-center text-muted-foreground text-sm">Loading chart data...</div>
        ) : (
          chartData.map((data, index) => {
            const heightPercent = data.rpe === 0 ? 5 : (data.rpe / 10) * 100;
            
            // Color based on RPE intensity
            let colorClass = "bg-muted";
            let shadowClass = "";
            let textClass = "text-muted-foreground";
            
            if (data.rpe >= 9) {
              colorClass = "bg-red-500/80 group-hover:bg-red-500";
              shadowClass = "shadow-[0_0_10px_rgba(239,68,68,0.3)]";
              textClass = "text-red-500 font-bold";
            } else if (data.rpe >= 7.5) {
              colorClass = "bg-orange-500/80 group-hover:bg-orange-500";
              shadowClass = "shadow-[0_0_10px_rgba(249,115,22,0.3)]";
              textClass = "text-orange-500 font-bold";
            } else if (data.rpe >= 5) {
              colorClass = "bg-lime-500 group-hover:bg-lime-400";
              shadowClass = "shadow-[0_0_10px_rgba(132,204,22,0.5)]";
              textClass = "text-lime-500 font-bold";
            } else if (data.rpe > 0) {
              colorClass = "bg-muted group-hover:bg-muted-foreground/20";
            } else {
              colorClass = "bg-muted/30";
              textClass = "text-muted-foreground/50";
            }
            
            return (
              <div key={index} className="flex flex-col items-center w-full group cursor-pointer">
                <div className="font-mono text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                  {data.rpe > 0 ? data.rpe.toFixed(1) : '0'}
                </div>
                <div 
                  className={`w-full max-w-[48px] rounded-t transition-all ${colorClass} ${shadowClass}`} 
                  style={{height: `${heightPercent}%`}}>
                </div>
                <div className={`font-mono text-xs mt-3 ${textClass}`}>{data.label}</div>
              </div>
            );
          })
        )}
        
      </div>
    </Card>
  );
}
