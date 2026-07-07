import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveWorkoutHeader from './components/LiveWorkoutHeader';
import ExerciseCard from './components/ExerciseCard';
import LiveWorkoutFooter from './components/LiveWorkoutFooter';
import workoutSessionLogService from '@/services/workoutSessionLogService';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Calendar, Clock, Dumbbell, Activity } from 'lucide-react';

const LiveWorkoutPage = () => {
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [selectedDayObj, setSelectedDayObj] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState(0);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const activePlan = await workoutSessionLogService.getActivePlan();
                if (activePlan && activePlan.weeks?.length > 0) {
                    setPlan(activePlan);
                    
                    const savedSessionStr = localStorage.getItem('periodiq_live_session');
                    if (savedSessionStr) {
                        try {
                            const savedSession = JSON.parse(savedSessionStr);
                            // Ensure the saved session is for the same plan
                            if (savedSession.planId === activePlan.id) {
                                setSelectedDayObj(savedSession.selectedDayObj);
                                setSelectedWeek(savedSession.selectedWeek);
                                setSelectedDayIndex(savedSession.selectedDayIndex);
                                setExercises(savedSession.exercises);
                                setStartTime(savedSession.startTime ? new Date(savedSession.startTime) : new Date());
                            }
                        } catch (e) {
                            console.error("Error parsing saved session", e);
                            localStorage.removeItem('periodiq_live_session');
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load workout plan", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    useEffect(() => {
        if (plan && selectedDayObj && exercises.length > 0) {
            const sessionState = {
                planId: plan.id,
                selectedDayObj,
                selectedWeek,
                selectedDayIndex,
                exercises,
                startTime: startTime ? startTime.toISOString() : null
            };
            localStorage.setItem('periodiq_live_session', JSON.stringify(sessionState));
        }
    }, [plan, selectedDayObj, selectedWeek, selectedDayIndex, exercises, startTime]);

    const startWorkout = (weekIndex, dayIndex, dayObj) => {
        const mappedExercises = dayObj.exercises.map((ex, index) => ({
            exerciseId: ex.exerciseId,
            number: index + 1,
            name: ex.exerciseName,
            targetCns: 'MODERATE',
            isMinimized: false,
            status: index === 0 ? 'active' : 'upcoming',
            plan: { sets: ex.sets, reps: ex.reps, weight: ex.targetWeightKg },
            log: { sets: ex.sets, reps: ex.reps, weight: ex.targetWeightKg, failed: false }
        }));
        setSelectedWeek(weekIndex);
        setSelectedDayIndex(dayIndex);
        setSelectedDayObj(dayObj);
        setExercises(mappedExercises);
        setStartTime(new Date());
    };

    const handleLogChange = (index, field, value) => {
        setExercises(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], log: { ...updated[index].log, [field]: value } };
            return updated;
        });
    };

    const handleCompleteExercise = (index) => {
        setExercises(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: 'completed', isMinimized: true };
            if (index + 1 < updated.length && updated[index + 1].status === 'upcoming') {
                updated[index + 1] = { ...updated[index + 1], status: 'active', isMinimized: false };
            }
            return updated;
        });
    };

    const handleToggleMinimize = (index, isMinimized) => {
        setExercises(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], isMinimized };
            return updated;
        });
    };

    const handleEndSession = async (sessionRpe) => {
        if (!plan) return;
        setSubmitting(true);
        try {
            const sessionData = {
                workoutPlanId: plan.id,
                weekNumber: selectedWeek + 1,
                day: selectedDayObj.day,
                completedAt: new Date().toISOString(),
                overallSessionRpe: sessionRpe,
                durationInSeconds: Math.floor((new Date() - startTime) / 1000),
                performedExercises: exercises.map(ex => ({
                    exerciseId: ex.exerciseId,
                    exerciseName: ex.name,
                    actualSets: parseInt(ex.log.sets) || 0,
                    actualReps: parseInt(ex.log.reps) || 0,
                    actualWeightKg: parseFloat(ex.log.weight) || 0,
                    failedRep: ex.log.failed || false
                }))
            };
            await workoutSessionLogService.logSession(sessionData);
            localStorage.removeItem('periodiq_live_session');
            toast.success("Đã lưu buổi tập thành công! Bạn nhận được +50 XP");
            navigate('/dashboard');
        } catch (error) {
            console.error("Lỗi khi lưu buổi tập", error);
            toast.error("Lỗi khi lưu buổi tập. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelSession = () => {
        if (window.confirm("Bạn có chắc chắn muốn hủy phiên tập này không? Dữ liệu chưa lưu sẽ bị xóa.")) {
            localStorage.removeItem('periodiq_live_session');
            setSelectedDayObj(null);
            setExercises([]);
            setStartTime(null);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Đang tải giáo án...</div>;
    }

    if (!plan || plan.weeks.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">Không có giáo án nào đang kích hoạt</h2>
                <p className="text-muted-foreground mb-6">Vui lòng tạo hoặc chọn một giáo án và đặt làm Active trước khi bắt đầu.</p>
                <button onClick={() => navigate('/dashboard')} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition">
                    Quay về Dashboard
                </button>
            </div>
        );
    }

    if (!selectedDayObj) {
        return (
            <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">Chọn buổi tập</h1>
                    <p className="text-muted-foreground mb-8">Giáo án: <span className="text-foreground font-medium">{plan.goal}</span></p>
                    
                    <div className="space-y-8">
                        {plan.weeks.map((week, wIndex) => (
                            <div key={wIndex} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-md text-sm">Tuần {wIndex + 1}</span>
                                    {week.focus || "Tập luyện"}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {week.days.map((day, dIndex) => (
                                        <button
                                            key={dIndex}
                                            onClick={() => startWorkout(wIndex, dIndex, day)}
                                            className="text-left flex flex-col justify-between min-h-[140px] bg-background border border-border p-5 rounded-xl hover:border-primary hover:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all group"
                                        >
                                            <div>
                                                <div className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">Ngày {dIndex + 1}</div>
                                                <div className="text-sm text-muted-foreground">{day.focusArea || "Toàn thân"}</div>
                                            </div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 w-fit px-2 py-1 rounded">
                                                {day.exercises?.length || 0} bài tập
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground antialiased min-h-screen flex flex-col relative w-full overflow-hidden">
            <LiveWorkoutHeader title={plan?.goal || "Session"} startTime={startTime} />
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 pb-32">
                {exercises.map((exercise, index) => (
                    <ExerciseCard 
                        key={index}
                        exerciseNumber={exercise.number}
                        name={exercise.name}
                        targetCns={exercise.targetCns}
                        plan={exercise.plan}
                        log={exercise.log}
                        status={exercise.status}
                        isMinimized={exercise.isMinimized}
                        onLogChange={handleLogChange}
                        onComplete={handleCompleteExercise}
                        onToggleMinimize={handleToggleMinimize}
                    />
                ))}
            </div>
            <LiveWorkoutFooter onEndSession={handleEndSession} onCancelSession={handleCancelSession} disabled={submitting} />
        </div>
    );
};

export default LiveWorkoutPage;
