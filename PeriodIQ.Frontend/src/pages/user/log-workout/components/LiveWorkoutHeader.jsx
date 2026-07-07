import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LiveWorkoutHeader = ({ title }) => {
    const { t } = useTranslation();
    const [showColon, setShowColon] = useState(true);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setShowColon(prev => !prev);
            setSecondsElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return { h, m, s };
    };

    const time = formatTime(secondsElapsed);

    return (
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border py-4 px-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <div className="text-primary font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    {t('live_workout.live_session')}
                </div>
                <h2 className="font-bold text-3xl md:text-4xl text-foreground">{title}</h2>
            </div>
            <div className="bg-card border border-border rounded-lg px-6 py-3 flex flex-col items-center min-w-[200px] shadow-sm">
                <span className="font-bold text-xs text-muted-foreground mb-1 uppercase tracking-widest">{t('live_workout.elapsed_time')}</span>
                <div className="font-bold text-4xl text-primary tracking-wider font-mono">
                    {time.h}
                    <span className={showColon ? '' : 'opacity-50'}>:</span>
                    {time.m}
                    <span className={showColon ? '' : 'opacity-50'}>:</span>
                    {time.s}
                </div>
            </div>
        </div>
    );
};

export default LiveWorkoutHeader;

