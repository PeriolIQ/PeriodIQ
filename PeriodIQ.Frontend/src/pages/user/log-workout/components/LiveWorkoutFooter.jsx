import React, { useState } from 'react';

const LiveWorkoutFooter = ({ onEndSession }) => {
    const [rpe, setRpe] = useState(8.0);
    const rpePercentage = ((rpe - 1) / 9) * 100;
    
    let rpeTextColorClass = "text-primary";
    if (rpe >= 9) rpeTextColorClass = "text-error";
    else if (rpe >= 7) rpeTextColorClass = "text-secondary-container";

    return (
        <div className="sticky bottom-0 left-0 w-full bg-surface-container border-t border-surface-variant p-md md:px-margin-desktop z-40 backdrop-blur-xl bg-opacity-95 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] mt-auto">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-lg items-center justify-between">
                <div className="w-full md:w-2/3 flex flex-col gap-sm">
                    <div className="flex justify-between items-end">
                        <label className="font-headline-lg-mobile text-[16px] text-on-background uppercase tracking-wide">Session RPE (Intensity)</label>
                        <span className={`font-data-label text-headline-lg-mobile ${rpeTextColorClass}`}>
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
                            className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer z-10 opacity-0 absolute" 
                        />
                        
                        {/* Custom track */}
                        <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-variant absolute">
                            <div 
                                className="h-full bg-gradient-to-r from-primary via-secondary-container to-error" 
                                style={{ width: `${rpePercentage}%` }}
                            ></div>
                        </div>
                        
                        {/* Custom thumb */}
                        <div 
                            className="w-6 h-6 bg-secondary-container rounded-full shadow-lg absolute pointer-events-none flex items-center justify-center transform -translate-x-1/2" 
                            style={{ left: `${rpePercentage}%` }}
                        >
                            <div className="w-2 h-2 bg-surface-container-highest rounded-full"></div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between font-data-label text-data-label text-on-surface-variant">
                        <span>1 (Light)</span>
                        <span>10 (Max Effort)</span>
                    </div>
                </div>
                
                <div className="w-full md:w-auto mt-4 md:mt-0 flex-shrink-0">
                    <button 
                        onClick={() => onEndSession && onEndSession(rpe)}
                        className="w-full md:w-auto bg-secondary-container text-on-secondary-container font-headline-lg-mobile text-[18px] px-xl py-4 rounded-lg hover:bg-secondary-fixed-dim transition-colors uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)]">
                        END SESSION
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveWorkoutFooter;
