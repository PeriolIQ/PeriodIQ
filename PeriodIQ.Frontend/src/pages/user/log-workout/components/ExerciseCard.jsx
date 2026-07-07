import React from 'react';
import { X, CheckCircle2, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ExerciseCard = ({ exerciseNumber, name, targetCns, plan, log, isMinimized = false, status = 'active', onLogChange, onComplete, onToggleMinimize }) => {
    const { t } = useTranslation();
    if (isMinimized) {
        return (
            <div className="bg-card rounded-xl border border-border overflow-hidden mb-6 opacity-80">
                <div 
                    className="p-4 border-b border-border flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onToggleMinimize && onToggleMinimize(exerciseNumber - 1, false)}
                >
                    <div>
                        <div className="font-bold text-xs text-muted-foreground mb-1 uppercase">{t('live_workout.exercise_label', { n: exerciseNumber })}</div>
                        <h3 className="font-bold text-lg text-foreground uppercase">{name}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <div className="font-bold text-xs text-muted-foreground mb-1 uppercase">{t('live_workout.plan_label')}</div>
                            <div className="text-primary font-mono text-sm">{plan?.sets} SETS × {plan?.reps} REPS @ {plan?.weight}KG</div>
                        </div>
                        <ChevronDown className="w-6 h-6 text-muted-foreground" />
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
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-6 relative shadow-sm">
            {status === 'active' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(37,99,235,0.5)] z-10"></div>
            )}
            
            <div 
                className="p-4 md:p-6 border-b border-border flex justify-between items-center bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onToggleMinimize && onToggleMinimize(exerciseNumber - 1, true)}
            >
                <div>
                    <div className="font-bold text-xs text-muted-foreground mb-1 uppercase">{t('live_workout.exercise_label', { n: exerciseNumber })}</div>
                    <h3 className="font-bold text-xl md:text-2xl text-foreground uppercase">{name}</h3>
                </div>
                <div className="text-right">
                    <div className="font-bold text-xs text-muted-foreground mb-1 uppercase">{t('live_workout.target_cns')}</div>
                    <div className="text-destructive font-bold font-mono text-sm">{targetCns}</div>
                </div>
            </div>
            
            <div className="p-4 md:p-6">
                <div className="grid grid-cols-12 gap-2 mb-4 font-bold text-xs text-muted-foreground uppercase tracking-wider pb-2 border-b border-border hidden md:grid">
                    <div className="col-span-4">{t('live_workout.plan_sets_reps')}</div>
                    <div className="col-span-2 text-center">{t('live_workout.act_sets')}</div>
                    <div className="col-span-2 text-center">{t('live_workout.act_reps')}</div>
                    <div className="col-span-2 text-center">{t('live_workout.load_kg')}</div>
                    <div className="col-span-1 text-center">{t('live_workout.fail')}</div>
                    <div className="col-span-1 text-center">{t('live_workout.log')}</div>
                </div>

                <div className={`grid grid-cols-12 gap-y-4 md:gap-2 items-center py-2 ${status === 'completed' ? 'opacity-60' : ''}`}>
                    <div className={`col-span-12 md:col-span-4 font-mono text-sm ${status === 'active' ? 'text-primary' : 'text-muted-foreground'} flex items-center h-full`}>
                        Plan: {plan?.sets} × {plan?.reps} @ {plan?.weight}Kg
                    </div>
                    
                    <div className="col-span-4 md:col-span-2 relative">
                        <label className="md:hidden block font-bold text-xs text-muted-foreground mb-1 text-center">{t('live_workout.act_sets')}</label>
                        <input 
                            className={`w-full border rounded text-center font-mono text-base py-2 h-12 ${status === 'active' ? 'bg-background border-border focus:border-primary text-foreground shadow-[0_0_10px_rgba(37,99,235,0.1)] transition-all outline-none' : 'bg-muted/50 border-border text-foreground'}`}
                            disabled={status === 'completed'}
                            type="number" 
                            value={log?.sets || ''}
                            onChange={(e) => handleLogChange('sets', e.target.value)}
                            placeholder={plan?.sets}
                        />
                    </div>
                    
                    <div className="col-span-4 md:col-span-2 relative">
                        <label className="md:hidden block font-bold text-xs text-muted-foreground mb-1 text-center">{t('live_workout.act_reps')}</label>
                        <input 
                            className={`w-full border rounded text-center font-mono text-base py-2 h-12 ${status === 'active' ? 'bg-background border-border focus:border-primary text-foreground shadow-[0_0_10px_rgba(37,99,235,0.1)] transition-all outline-none' : 'bg-muted/50 border-border text-foreground'}`}
                            disabled={status === 'completed'}
                            type="number" 
                            value={log?.reps || ''}
                            onChange={(e) => handleLogChange('reps', e.target.value)}
                            placeholder={plan?.reps}
                        />
                    </div>

                    <div className="col-span-4 md:col-span-2 relative">
                        <label className="md:hidden block font-bold text-xs text-muted-foreground mb-1 text-center">Kg</label>
                        <input 
                            className={`w-full border rounded text-center font-mono text-base py-2 h-12 ${status === 'active' ? 'bg-background border-border focus:border-primary text-foreground shadow-[0_0_10px_rgba(37,99,235,0.1)] transition-all outline-none' : 'bg-muted/50 border-border text-foreground'}`}
                            disabled={status === 'completed'}
                            type="number" 
                            value={log?.weight || ''}
                            onChange={(e) => handleLogChange('weight', e.target.value)}
                            placeholder={plan?.weight}
                        />
                    </div>

                    <div className="col-span-6 md:col-span-1 flex flex-col items-center justify-center relative pt-6 md:pt-0">
                        <label className="md:hidden absolute top-0 font-bold text-xs text-muted-foreground text-center">{t('live_workout.fail')}</label>
                        {status === 'completed' && log?.failed ? (
                            <X className="w-6 h-6 text-destructive" />
                        ) : status === 'completed' && !log?.failed ? (
                            <span className="text-muted-foreground font-mono">-</span>
                        ) : (
                            <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    checked={log?.failed || false} 
                                    onChange={(e) => handleLogChange('failed', e.target.checked)}
                                    className="peer absolute block w-6 h-6 rounded-full bg-background border-4 border-border appearance-none cursor-pointer transition-all duration-300 z-10 checked:right-0 checked:border-primary"
                                />
                                <label className="block overflow-hidden h-6 rounded-full bg-border cursor-pointer transition-colors duration-300 peer-checked:bg-primary"></label>
                            </div>
                        )}
                    </div>
                    
                    <div className="col-span-6 md:col-span-1 flex justify-center mt-2 md:mt-0">
                        {status === 'completed' ? (
                            <button className="w-full md:w-12 h-12 rounded bg-border text-primary flex items-center justify-center" disabled>
                                <CheckCircle2 className="w-6 h-6 fill-current text-background" />
                            </button>
                        ) : (
                            <button 
                                onClick={() => onComplete && onComplete(exerciseNumber - 1)}
                                className="w-full md:w-12 h-12 rounded bg-muted border border-border hover:border-primary hover:text-primary text-muted-foreground flex items-center justify-center transition-colors"
                            >
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
