import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowRight, Medal } from 'lucide-react';
import dashboardService from '@/services/dashboardService';

export default function RecentPrsCard() {
  const [prs, setPrs] = useState([]);

  useEffect(() => {
    dashboardService.getMyPrs().then(data => {
      setPrs(data.slice(0, 4)); // Get top 4 most recent
    }).catch(err => console.error(err));
  }, []);

  return (
    <Card className="col-span-1 md:col-span-12 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Recent PRs</h2>
        <Link to="/prs" className="text-lime-600 dark:text-lime-400 hover:underline font-mono text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {prs.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-4 text-muted-foreground text-sm py-4">
            No personal records found. Keep training hard!
          </div>
        ) : (
          prs.map((pr) => (
            <div key={pr.id} className="bg-muted/30 p-4 rounded-lg border border-border flex items-center gap-4 relative overflow-hidden group hover:border-lime-400/50 transition-colors">
              <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-lime-400/10 to-transparent pointer-events-none"></div>
              <div className="w-12 h-12 rounded-lg bg-lime-400/20 flex items-center justify-center text-lime-600 dark:text-lime-400 shrink-0">
                <Medal className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm capitalize">{pr.exerciseId.replace(/-/g, ' ')}</div>
                <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">{pr.weightKg}<span className="text-sm text-muted-foreground ml-1">kg</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
