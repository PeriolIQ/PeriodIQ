import React, { useEffect, useState } from 'react';
import { Flame, Zap } from 'lucide-react';
import progressService from '@/services/progressService';
import { useAuth } from '@/context/AuthContext';
import CnsStatusCard from './components/CnsStatusCard';
import CurrentMesocycleCard from './components/CurrentMesocycleCard';
import NextSessionCard from './components/NextSessionCard';
import WeeklyIntensityChart from './components/WeeklyIntensityChart';
import RecentPrsCard from './components/RecentPrsCard';

export default function HomePage() {
  const [progress, setProgress] = useState(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await progressService.getProgress();
        setProgress({
          xp: data.xp || 0,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0
        });
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      }
    };
    if (user) fetchProgress();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 pb-12">
      {/* Header Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-lime-500 tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm mt-1">Athletic Performance Overview</p>
        </div>
        <div className="flex gap-6 bg-card p-3 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            <span className="font-mono text-sm font-bold text-muted-foreground">{progress?.currentStreak || 0} DAY STREAK</span>
          </div>
          <div className="w-px bg-border"></div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500 fill-purple-500" />
            <span className="font-mono text-sm font-bold text-muted-foreground">{(progress?.xp || 0).toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <CnsStatusCard />
        <CurrentMesocycleCard />
        <NextSessionCard />
        <WeeklyIntensityChart />
        <RecentPrsCard />
      </div>
    </div>
  );
}
