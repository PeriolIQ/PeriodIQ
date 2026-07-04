import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveWorkoutHeader from './components/LiveWorkoutHeader';
import ExerciseCard from './components/ExerciseCard';
import LiveWorkoutFooter from './components/LiveWorkoutFooter';
import workoutSessionLogService from '@/services/workoutSessionLogService';

const LiveWorkoutPage = () => {
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [startTime] = useState(new Date());

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const activePlan = await workoutSessionLogService.getActivePlan();
                if (activePlan && activePlan.weeks?.length > 0 && activePlan.weeks[0].days?.length > 0) {
                    setPlan(activePlan);
                    // Lấy ngày tập đầu tiên (giả lập)
                    const currentDay = activePlan.weeks[0].days[0];
                    
                    const mappedExercises = currentDay.exercises.map((ex, index) => ({
                        exerciseId: ex.exerciseId,
                        number: index + 1,
                        name: ex.exerciseName,
                        targetCns: 'MODERATE', // Assuming CNS from exercise or day
                        isMinimized: false,
                        status: index === 0 ? 'active' : 'upcoming',
                        plan: {
                            sets: ex.sets,
                            reps: ex.reps,
                            weight: ex.targetWeightKg
                        },
                        log: {
                            sets: ex.sets,
                            reps: ex.reps,
                            weight: ex.targetWeightKg,
                            failed: false
                        }
                    }));
                    setExercises(mappedExercises);
                }
            } catch (error) {
                console.error("Failed to load workout plan", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, []);

    const handleLogChange = (index, field, value) => {
        setExercises(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                log: {
                    ...updated[index].log,
                    [field]: value
                }
            };
            return updated;
        });
    };

    const handleEndSession = async (sessionRpe) => {
        if (!plan) return;
        setSubmitting(true);

        try {
            const sessionData = {
                workoutPlanId: plan.id,
                weekNumber: 1, // Theo logic thực tế
                day: 1, // Theo logic thực tế
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
            alert("Đã lưu buổi tập thành công! Bạn nhận được +50 XP");
            navigate('/home');
        } catch (error) {
            console.error("Lỗi khi lưu buổi tập", error);
            alert("Lỗi khi lưu buổi tập. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-on-background">Đang tải giáo án...</div>;
    }

    if (!plan || exercises.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-background">
                <h2 className="text-2xl font-bold mb-4">Không có giáo án nào đang kích hoạt</h2>
                <button onClick={() => navigate('/home')} className="bg-primary text-primary-foreground px-6 py-2 rounded">
                    Quay về Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex flex-col relative w-full overflow-hidden">
            <style dangerouslySetInnerHTML={{__html: `
                .toggle-checkbox:checked { right: 0; border-color: #84cc16; }
                .toggle-checkbox:checked + .toggle-label { background-color: #84cc16; }
                .input-glow:focus { box-shadow: 0 0 15px rgba(132, 204, 22, 0.15); border-color: #84cc16; outline: none; }
                .training-active-glow { box-shadow: 0 0 40px rgba(132, 204, 22, 0.05); }
            `}} />

            {/* Header / Timer */}
            <LiveWorkoutHeader title={plan?.goal || "Session"} />

            {/* Workout Canvas */}
            <div className="flex-1 overflow-y-auto px-margin-mobile md:px-margin-desktop py-lg pb-32">
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
                    />
                ))}
            </div>

            {/* Sticky Footer */}
            <LiveWorkoutFooter onEndSession={handleEndSession} disabled={submitting} />
        </div>
    );
};

export default LiveWorkoutPage;
