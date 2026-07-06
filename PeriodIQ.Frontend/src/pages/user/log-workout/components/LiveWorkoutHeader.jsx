import React, { useState, useEffect } from 'react';

const LiveWorkoutHeader = ({ title }) => {
    const [showColon, setShowColon] = useState(true);
    const [secondsElapsed, setSecondsElapsed] = useState(42 * 60 + 15);
    
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
        <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-surface-variant py-md px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-start md:items-center gap-sm">
            <div>
                <div className="text-secondary-container font-data-label text-data-label uppercase tracking-widest mb-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                    Live Session
                </div>
                <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">{title}</h2>
            </div>
            <div className="bg-surface-container border border-surface-variant rounded-lg px-lg py-sm flex flex-col items-center min-w-[200px] training-active-glow">
                <span className="font-data-label text-data-label text-on-surface-variant mb-1 uppercase tracking-widest">Elapsed Time</span>
                <div className="font-data-label text-display-lg text-secondary-container tracking-wider">
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
