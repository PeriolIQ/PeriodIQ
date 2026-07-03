import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Dumbbell, LineChart as ChartIcon } from 'lucide-react';
import progressService from '@/services/progressService';
import { adminMasterDataApi } from '@/services/adminMasterDataService';
import dayjs from 'dayjs';

export default function WeightProgressionChart() {
  const [data, setData] = useState([]);
  const [exerciseName, setExerciseName] = useState('Chưa xác định');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prs = await progressService.getPersonalRecords();
        
        if (prs && prs.length > 0) {
          // Lấy Exercise có nhiều lịch sử PR nhất để vẽ biểu đồ
          const exerciseCounts = prs.reduce((acc, pr) => {
            acc[pr.exerciseId] = (acc[pr.exerciseId] || 0) + 1;
            return acc;
          }, {});
          
          const topExerciseId = Object.keys(exerciseCounts).reduce((a, b) => exerciseCounts[a] > exerciseCounts[b] ? a : b);
          
          // Lấy tên Exercise
          const exercises = await adminMasterDataApi.exercises.list();
          const exercise = exercises.find(e => e.id === topExerciseId);
          if (exercise) setExerciseName(exercise.name);

          // Lọc data và map sang format Recharts
          const chartData = prs
            .filter(pr => pr.exerciseId === topExerciseId)
            .sort((a, b) => new Date(a.achievedDate) - new Date(b.achievedDate))
            .map(pr => ({
              week: dayjs(pr.achievedDate).format('DD/MM'),
              weight: pr.weightKg
            }));

          setData(chartData);
        } else {
          // Chưa có data thực tế
          setData([]);
        }
      } catch (error) {
        console.error("Failed to fetch PR history", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-card text-card-foreground border rounded-xl shadow-sm overflow-hidden col-span-1 md:col-span-12 lg:col-span-8 flex flex-col relative">
      <div className="p-6 pb-2 border-b border-border/50 flex justify-between items-center bg-muted/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-5 h-5 text-secondary-container" />
            <h3 className="font-semibold text-lg tracking-tight">Biểu Đồ Tăng Tạ {data.length > 0 && `(${exerciseName})`}</h3>
          </div>
          <p className="text-sm text-muted-foreground">Theo dõi mức tạ tối đa (Kg) qua các tuần</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary-container/10 text-secondary-container px-3 py-1.5 rounded-full">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-bold">Tiến triển</span>
        </div>
      </div>
      
      <div className="p-6 flex-1 min-h-[300px] w-full relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10">
            <div className="w-8 h-8 border-4 border-secondary-container border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/50 z-10 text-muted-foreground">
            <ChartIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Chưa có dữ liệu tập luyện</p>
            <p className="text-sm">Hãy hoàn thành buổi tập đầu tiên để theo dõi tiến độ của bạn!</p>
          </div>
        ) : null}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="week" 
              stroke="var(--muted-foreground)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="var(--muted-foreground)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--card)', 
                borderColor: 'var(--border)', 
                borderRadius: '8px', 
                color: 'var(--card-foreground)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} 
              itemStyle={{ color: 'var(--foreground)' }}
              labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
              formatter={(value) => [`${value} Kg`, 'Mức Tạ Max']}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#84cc16" 
              strokeWidth={4} 
              dot={{ r: 4, fill: '#84cc16', strokeWidth: 2, stroke: 'var(--background)' }} 
              activeDot={{ r: 8, fill: '#84cc16', stroke: 'var(--background)', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
