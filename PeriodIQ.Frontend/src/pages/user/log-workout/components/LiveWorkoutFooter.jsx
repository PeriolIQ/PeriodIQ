import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LiveWorkoutFooter = ({ onEndSession, onCancelSession }) => {
    const { t } = useTranslation();
    const [rpe, setRpe] = useState(8.0);
    const rpePercentage = ((rpe - 1) / 9) * 100;
    
    let rpeTextColorClass = "text-primary";
    if (rpe >= 9) rpeTextColorClass = "text-destructive";
    else if (rpe >= 7) rpeTextColorClass = "text-yellow-500";

    return (
        <div className="sticky bottom-0 left-0 w-full bg-card border-t border-border p-4 md:px-8 z-40 backdrop-blur-xl bg-opacity-95 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] mt-auto">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="w-full md:w-2/3 flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                        <label className="font-bold text-sm text-foreground uppercase tracking-wide">{t('live_workout.session_rpe')}</label>
                        <span className={`font-mono font-bold text-lg ${rpeTextColorClass}`}>
                            {parseFloat(rpe).toFixed(1)}
                        </span>
                    </div>
                    
                    <div className="relative w-full h-8 flex items-center">
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            step="0.5" 
                            value={rpe}
                            onChange={(e) => setRpe(parseFloat(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer z-10 opacity-0 absolute" 
                        />
                        
                        {/* Custom track */}
                        <div className="w-full h-2 rounded-full overflow-hidden flex bg-muted absolute">
                            <div 
                                className="h-full bg-gradient-to-r from-primary via-yellow-500 to-destructive" 
                                style={{ width: `${rpePercentage}%` }}
                            ></div>
                        </div>
                        
                        {/* Custom thumb */}
                        <div 
                            className="w-6 h-6 bg-primary rounded-full shadow-lg absolute pointer-events-none flex items-center justify-center transform -translate-x-1/2" 
                            style={{ left: `${rpePercentage}%` }}
                        >
                            <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between font-mono text-xs text-muted-foreground">
                        <span>1 ({t('live_workout.light')})</span>
                        <span>10 ({t('live_workout.max_effort')})</span>
                    </div>
                </div>
                
                <div className="w-full md:w-auto mt-4 md:mt-0 flex-shrink-0 flex gap-2">
                    <button 
                        onClick={() => onCancelSession && onCancelSession()}
                        className="w-full md:w-auto py-4 px-6 bg-muted text-muted-foreground border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive font-bold uppercase tracking-widest text-sm rounded-lg transition-all"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={() => onEndSession && onEndSession(rpe)}
                        className="w-full md:w-auto py-4 px-6 md:px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-sm rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1"
                    >
                        {t('live_workout.end_session')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveWorkoutFooter;
