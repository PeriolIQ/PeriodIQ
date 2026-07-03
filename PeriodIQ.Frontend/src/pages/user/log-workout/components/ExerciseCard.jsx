import React from 'react';
import { X, CheckCircle2, Check, ChevronDown } from 'lucide-react';

const ExerciseCard = ({ exerciseNumber, name, targetCns, plan, log, isMinimized = false, status = 'active', onLogChange }) => {
    if (isMinimized) {
        return (
            <div className="bg-surface-container-low rounded-xl border border-surface-variant overflow-hidden mb-lg opacity-80">
                <div className="p-md border-b border-surface-variant flex justify-between items-center cursor-pointer hover:bg-surface-container transition-colors">
                    <div>
                        <div className="font-data-label text-data-label text-on-surface-variant mb-base">EXERCISE {exerciseNumber}</div>
                        <h3 className="font-headline-lg text-headline-lg-mobile text-on-background uppercase">{name}</h3>
                    </div>
                    <div className="flex items-center gap-md">
                        <div className="text-right hidden md:block">
                            <div className="font-data-label text-data-label text-on-surface-variant mb-base">PLAN</div>
                            <div className="text-primary font-data-label text-[14px]">{plan?.sets} SETS × {plan?.reps} REPS @ {plan?.weight}KG</div>
                        </div>
                        <ChevronDown className="w-6 h-6 text-on-surface-variant" />
                    </div>
                </div>
            </div>
        );
    }

    const handleLogChange = (field, value) => {
        if (onLogChange) {
            onLogChange(exerciseNumber - 1, field, value);
        }
    };

    return (
        <div className="bg-surface-container-low rounded-xl border border-surface-variant overflow-hidden mb-lg relative">
            {status === 'active' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container shadow-[0_0_10px_#84cc16] z-10"></div>
            )}
            
            <div className="p-md md:p-lg border-b border-surface-variant flex justify-between items-center bg-surface-container">
                <div>
                    <div className="font-data-label text-data-label text-on-surface-variant mb-base">EXERCISE {exerciseNumber}</div>
                    <h3 className="font-headline-lg text-headline-lg-mobile text-on-background uppercase">{name}</h3>
                </div>
                <div className="text-right">
                    <div className="font-data-label text-data-label text-on-surface-variant mb-base">TARGET CNS IMPACT</div>
                    <div className="text-error font-bold font-data-label text-[14px]">{targetCns}</div>
                </div>
            </div>
            
            <div className="p-md md:p-lg">
                <div className="grid grid-cols-12 gap-sm mb-sm font-data-label text-data-label text-on-surface-variant uppercase tracking-wider pb-base border-b border-surface-variant hidden md:grid">
                    <div className="col-span-4">Plan (Sets × Reps @ Kg)</div>
                    <div className="col-span-2 text-center">Act. Sets</div>
                    <div className="col-span-2 text-center">Act. Reps</div>
                    <div className="col-span-2 text-center">Load (Kg)</div>
                    <div className="col-span-1 text-center">Fail</div>
                    <div className="col-span-1 text-center">Log</div>
                </div>

                <div className={`grid grid-cols-12 gap-y-sm md:gap-sm items-center py-sm ${status === 'completed' ? 'opacity-60' : ''}`}>
                    <div className={`col-span-12 md:col-span-4 font-data-label text-[14px] ${status === 'active' ? 'text-primary' : 'text-on-surface-variant'} flex items-center h-full`}>
                        Plan: {plan?.sets} × {plan?.reps} @ {plan?.weight}Kg
                    </div>
                    
                    <div className="col-span-4 md:col-span-2 relative">
                        <label className="md:hidden block text-data-label font-data-label text-on-surface-variant mb-xs text-center">Sets</label>
                        <input 
                            className={`w-full border rounded text-center font-data-label text-[16px] py-xs h-12 ${status === 'active' ? 'bg-surface-container-highest border-outline-variant focus:border-secondary-container text-on-background input-glow transition-all' : 'bg-surface-dim border-surface-variant text-on-background'}`}
                            disabled={status === 'completed'}
                            type="number" 
                            value={log?.sets || ''}
                            onChange={(e) => handleLogChange('sets', e.target.value)}
                            placeholder={plan?.sets}
                        />
                    </div>
                    
                    <div className="col-span-4 md:col-span-2 relative">
                        <label className="md:hidden block text-data-label font-data-label text-on-surface-variant mb-xs text-center">Reps</label>
                        <input 
                            className={`w-full border rounded text-center font-data-label text-[16px] py-xs h-12 ${status === 'active' ? 'bg-surface-container-highest border-outline-variant focus:border-secondary-container text-on-background input-glow transition-all' : 'bg-surface-dim border-surface-variant text-on-background'}`}
                            disabled={status === 'completed'}
                            type="number" 
                            value={log?.reps || ''}
                            onChange={(e) => handleLogChange('reps', e.target.value)}
                            placeholder={plan?.reps}
                        />
                    </div>

                    <div className="col-span-4 md:col-span-2 relative">
                        <label className="md:hidden block text-data-label font-data-label text-on-surface-variant mb-xs text-center">Kg</label>
                        <input 
                            className={`w-full border rounded text-center font-data-label text-[16px] py-xs h-12 ${status === 'active' ? 'bg-surface-container-highest border-outline-variant focus:border-secondary-container text-on-background input-glow transition-all' : 'bg-surface-dim border-surface-variant text-on-background'}`}
                            disabled={status === 'completed'}
                            type="number" 
                            value={log?.weight || ''}
                            onChange={(e) => handleLogChange('weight', e.target.value)}
                            placeholder={plan?.weight}
                        />
                    </div>

                    <div className="col-span-6 md:col-span-1 flex flex-col items-center justify-center relative pt-6 md:pt-0">
                        <label className="md:hidden absolute top-0 text-data-label font-data-label text-on-surface-variant text-center">Fail</label>
                        {status === 'completed' && log?.failed ? (
                            <X className="w-6 h-6 text-on-surface-variant" />
                        ) : status === 'completed' && !log?.failed ? (
                            <span className="text-on-surface-variant font-data-label">-</span>
                        ) : (
                            <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    checked={log?.failed || false} 
                                    onChange={(e) => handleLogChange('failed', e.target.checked)}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-background border-4 border-surface-variant appearance-none cursor-pointer transition-all duration-300 z-10"
                                />
                                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-surface-variant cursor-pointer transition-colors duration-300"></label>
                            </div>
                        )}
                    </div>
                    
                    <div className="col-span-6 md:col-span-1 flex justify-center mt-sm md:mt-0">
                        {status === 'completed' ? (
                            <button className="w-full md:w-12 h-12 rounded bg-surface-variant text-secondary-container flex items-center justify-center" disabled>
                                <CheckCircle2 className="w-6 h-6 fill-current text-background" />
                            </button>
                        ) : (
                            <button className="w-full md:w-12 h-12 rounded bg-surface-variant border border-outline-variant hover:border-secondary-container hover:text-secondary-container text-on-surface-variant flex items-center justify-center transition-colors">
                                <Check className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExerciseCard;
