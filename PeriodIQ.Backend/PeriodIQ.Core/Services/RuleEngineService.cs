using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Core.Models;
using PeriodIQ.Domain.Entities;

namespace PeriodIQ.Core.Services;

/// <summary>
/// TRÁI TIM CỦA HỆ THỐNG: Rule Engine Service.
/// Sinh giáo án 4 tuần theo 3 nhóm luật: Volume -> Conflict -> Progression.
/// </summary>
public class RuleEngineService
{
    private readonly IWorkoutTemplateRepository _templateRepo;
    private readonly IPersonalRecordHistoryRepository _prRepo;
    private readonly IDailyCnsStatusRepository _cnsRepo;
    private readonly IRuleDefinitionRepository _ruleRepo;

    public RuleEngineService(
        IWorkoutTemplateRepository templateRepo,
        IPersonalRecordHistoryRepository prRepo,
        IDailyCnsStatusRepository cnsRepo,
        IRuleDefinitionRepository ruleRepo)
    {
        _templateRepo = templateRepo;
        _prRepo = prRepo;
        _cnsRepo = cnsRepo;
        _ruleRepo = ruleRepo;
    }

    public async Task<WorkoutPlan> GenerateWorkoutPlanAsync(string userId, string templateId)
    {
        var template = string.IsNullOrWhiteSpace(templateId)
            ? null
            : await _templateRepo.GetByIdAsync(templateId);

        var request = new WorkoutPlanGenerationRequest
        {
            TemplateId = templateId,
            Goal = template?.Goal ?? "Hypertrophy",
            FitnessLevel = template?.SuitableFitnessLevel ?? "Intermediate",
            DaysPerWeek = template?.Days.Count > 0 ? template.Days.Count : 4
        };

        return await GenerateWorkoutPlanAsync(userId, request, template);
    }

    public async Task<WorkoutPlan> GenerateWorkoutPlanAsync(string userId, WorkoutPlanGenerationRequest request)
    {
        var template = string.IsNullOrWhiteSpace(request.TemplateId)
            ? null
            : await _templateRepo.GetByIdAsync(request.TemplateId);

        return await GenerateWorkoutPlanAsync(userId, request, template);
    }

    private async Task<WorkoutPlan> GenerateWorkoutPlanAsync(
        string userId,
        WorkoutPlanGenerationRequest request,
        WorkoutTemplate? template)
    {
        NormalizeRequest(request);

        var goal = Normalize(request.Goal);
        var level = Normalize(request.FitnessLevel);
        var startDate = (request.StartDate ?? DateTime.UtcNow).Date;
        var templateId = template?.Id ?? request.TemplateId;
        var blueprints = template?.Days.Count > 0
            ? BuildBlueprintFromTemplate(template)
            : BuildDefaultBlueprint(request.DaysPerWeek);

        var personalRecords = await GetAllOrEmptyAsync(_prRepo);
        var latestCns = (await GetAllOrEmptyAsync(_cnsRepo))
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.DateLog)
            .FirstOrDefault();
        _ = await GetAllOrEmptyAsync(_ruleRepo);

        var plan = new WorkoutPlan
        {
            UserId = userId,
            TemplateId = templateId,
            Goal = ToTitle(goal),
            FitnessLevel = ToTitle(level),
            StartDate = startDate,
            EndDate = startDate.AddDays(27),
            GeneratedAt = DateTime.UtcNow,
            Status = "Active"
        };

        foreach (var weekProfile in GetWeekProfiles())
        {
            var week = new WeeklyPlan
            {
                WeekNumber = weekProfile.WeekNumber,
                Focus = weekProfile.Focus,
                ProgressionRule = weekProfile.Rule,
                IntensityMultiplier = weekProfile.IntensityMultiplier
            };

            foreach (var dayBlueprint in blueprints.Take(request.DaysPerWeek))
            {
                var day = BuildTrainingDay(
                    dayBlueprint,
                    weekProfile,
                    request,
                    personalRecords.Where(x => x.UserId == userId),
                    latestCns,
                    goal,
                    level,
                    startDate);

                week.PlannedTotalVolume += day.Exercises.Sum(x => x.TargetWeightKg * x.Sets * x.Reps);
                week.Days.Add(day);
            }

            week.PlannedTotalVolume = Math.Round(week.PlannedTotalVolume, 1);
            plan.Weeks.Add(week);
        }

        return plan;
    }

    private static DailyWorkout BuildTrainingDay(
        DayBlueprint dayBlueprint,
        WeekProfile weekProfile,
        WorkoutPlanGenerationRequest request,
        IEnumerable<PersonalRecordHistory> personalRecords,
        DailyCnsStatus? latestCns,
        string goal,
        string level,
        DateTime startDate)
    {
        var cnsThreshold = GetCnsThreshold(level, latestCns);
        var rawCnsScore = dayBlueprint.Exercises.Sum(x => x.CnsStressScore);
        var cnsAdjustment = rawCnsScore > cnsThreshold ? 0.9m : 1m;
        var limitationAdjustment = GetLimitationAdjustment(request.Limitations, dayBlueprint.FocusArea);
        var trainingDate = startDate.AddDays((weekProfile.WeekNumber - 1) * 7 + dayBlueprint.DaySequence - 1);

        var day = new DailyWorkout
        {
            DayNumber = dayBlueprint.DaySequence,
            Day = trainingDate.DayOfWeek,
            DayLabel = $"Day {dayBlueprint.DaySequence}",
            FocusArea = dayBlueprint.FocusArea,
            CnsStressScore = rawCnsScore,
            ConflictStatus = rawCnsScore > cnsThreshold
                ? $"CNS cao ({rawCnsScore}/{cnsThreshold}), tu giam 10% intensity."
                : $"CNS hop ly ({rawCnsScore}/{cnsThreshold})."
        };

        foreach (var exercise in dayBlueprint.Exercises)
        {
            var adjustedExercise = ApplyEquipmentSubstitution(exercise, request.Equipment);
            var volume = GetGoalVolume(goal, adjustedExercise);
            var sets = Math.Max(2, (int)Math.Round(
                volume.BaseSets * GetLevelVolumeMultiplier(level) * weekProfile.VolumeMultiplier,
                MidpointRounding.AwayFromZero));
            var reps = GetAdjustedReps(volume.BaseReps, weekProfile.WeekNumber, goal);
            var intensity = Clamp(
                volume.IntensityPercentage * weekProfile.IntensityMultiplier * cnsAdjustment * limitationAdjustment,
                0.45m,
                0.92m);

            day.Exercises.Add(new ExerciseSet
            {
                ExerciseId = adjustedExercise.ExerciseId,
                ExerciseName = adjustedExercise.Name,
                MuscleGroup = adjustedExercise.MuscleGroup,
                Sets = sets,
                Reps = reps,
                IntensityPercentage = Math.Round(intensity * 100, 0),
                Rpe = Math.Round(weekProfile.Rpe, 1),
                TargetWeightKg = CalculateTargetWeight(request.MainLifts, personalRecords, adjustedExercise, intensity),
                RestTimeInSeconds = volume.RestSeconds,
                Notes = BuildExerciseNote(adjustedExercise, cnsAdjustment, limitationAdjustment)
            });
        }

        return day;
    }

    private static async Task<IEnumerable<T>> GetAllOrEmptyAsync<T>(IGenericRepository<T> repository)
        where T : PeriodIQ.Domain.Common.BaseEntity
    {
        try
        {
            return await repository.GetAllAsync();
        }
        catch
        {
            return Enumerable.Empty<T>();
        }
    }

    private static List<DayBlueprint> BuildDefaultBlueprint(int daysPerWeek)
    {
        var upperStrength = new DayBlueprint(1, "Upper Strength", new()
        {
            Exercise("bench_press", "Bench Press", "Chest", "bench", 1m, 8, "Barbell"),
            Exercise("barbell_row", "Barbell Row", "Back", "deadlift", 0.48m, 6, "Barbell"),
            Exercise("overhead_press", "Overhead Press", "Shoulders", "overheadPress", 1m, 7, "Barbell"),
            Exercise("lat_pulldown", "Lat Pulldown", "Back", "deadlift", 0.36m, 4, "Machine")
        });

        var lowerStrength = new DayBlueprint(2, "Lower Strength", new()
        {
            Exercise("back_squat", "Back Squat", "Quads", "squat", 1m, 9, "Barbell"),
            Exercise("deadlift", "Deadlift", "Posterior Chain", "deadlift", 1m, 10, "Barbell"),
            Exercise("leg_press", "Leg Press", "Quads", "squat", 0.85m, 5, "Machine"),
            Exercise("lying_leg_curl", "Lying Leg Curl", "Hamstrings", "deadlift", 0.22m, 3, "Machine")
        });

        var upperVolume = new DayBlueprint(3, "Upper Hypertrophy", new()
        {
            Exercise("incline_dumbbell_press", "Incline Dumbbell Press", "Chest", "bench", 0.34m, 5, "Dumbbell"),
            Exercise("seated_cable_row", "Seated Cable Row", "Back", "deadlift", 0.34m, 4, "Machine"),
            Exercise("dumbbell_lateral_raise", "Dumbbell Lateral Raise", "Shoulders", "overheadPress", 0.16m, 2, "Dumbbell"),
            Exercise("triceps_pushdown", "Triceps Pushdown", "Triceps", "bench", 0.2m, 2, "Machine"),
            Exercise("dumbbell_curl", "Dumbbell Curl", "Biceps", "bench", 0.16m, 2, "Dumbbell")
        });

        var lowerVolume = new DayBlueprint(4, "Lower Hypertrophy", new()
        {
            Exercise("front_squat", "Front Squat", "Quads", "squat", 0.78m, 7, "Barbell"),
            Exercise("romanian_deadlift", "Romanian Deadlift", "Hamstrings", "deadlift", 0.62m, 7, "Barbell"),
            Exercise("walking_lunge", "Walking Lunge", "Glutes", "squat", 0.22m, 4, "Dumbbell"),
            Exercise("standing_calf_raise", "Standing Calf Raise", "Calves", "squat", 0.28m, 2, "Machine")
        });

        var push = upperVolume with { DaySequence = 3, FocusArea = "Push Hypertrophy" };
        var pull = new DayBlueprint(4, "Pull Hypertrophy", new()
        {
            Exercise("pull_up", "Pull-up", "Back", "deadlift", 0m, 5, "Bodyweight"),
            Exercise("seated_cable_row", "Seated Cable Row", "Back", "deadlift", 0.34m, 4, "Machine"),
            Exercise("face_pull", "Face Pull", "Rear Delts", "overheadPress", 0.16m, 2, "Machine"),
            Exercise("dumbbell_curl", "Dumbbell Curl", "Biceps", "bench", 0.16m, 2, "Dumbbell")
        });
        var legs = lowerVolume with { DaySequence = 5, FocusArea = "Legs Volume" };

        return daysPerWeek switch
        {
            2 => new List<DayBlueprint> { upperStrength with { DaySequence = 1, FocusArea = "Full Body A" }, lowerStrength with { DaySequence = 2, FocusArea = "Full Body B" } },
            3 => new List<DayBlueprint> { upperStrength with { DaySequence = 1, FocusArea = "Full Body Strength" }, upperVolume with { DaySequence = 2 }, lowerVolume with { DaySequence = 3 } },
            4 => new List<DayBlueprint> { upperStrength, lowerStrength, upperVolume, lowerVolume },
            5 => new List<DayBlueprint> { upperStrength, lowerStrength, push, pull, legs },
            _ => new List<DayBlueprint>
            {
                upperStrength with { DaySequence = 1, FocusArea = "Push Strength" },
                pull with { DaySequence = 2, FocusArea = "Pull Strength" },
                lowerStrength with { DaySequence = 3, FocusArea = "Legs Strength" },
                push with { DaySequence = 4 },
                pull with { DaySequence = 5 },
                legs with { DaySequence = 6 }
            }
        };
    }

    private static List<DayBlueprint> BuildBlueprintFromTemplate(WorkoutTemplate template)
    {
        return template.Days
            .OrderBy(day => day.DaySequence)
            .Select(day => new DayBlueprint(
                day.DaySequence,
                day.FocusArea,
                day.Exercises.Select(exercise => Exercise(
                    exercise.ExerciseId,
                    ToTitle(exercise.ExerciseId.Replace("_", " ", StringComparison.Ordinal)),
                    ResolveMuscleGroup(exercise.ExerciseId, day.FocusArea),
                    ResolveMainLiftKey(exercise.ExerciseId),
                    1m,
                    5,
                    "Barbell")).ToList()))
            .ToList();
    }

    private static GoalVolume GetGoalVolume(string goal, ExerciseBlueprint exercise)
    {
        return goal switch
        {
            "strength" => new GoalVolume(exercise.CnsStressScore >= 7 ? 4 : 3, exercise.CnsStressScore >= 7 ? 4 : 6, 0.82m, 180),
            "endurance" => new GoalVolume(3, 14, 0.58m, 60),
            "weight_loss" => new GoalVolume(3, 12, 0.62m, 75),
            "fat_loss" => new GoalVolume(3, 12, 0.62m, 75),
            _ => new GoalVolume(exercise.CnsStressScore >= 7 ? 4 : 3, exercise.CnsStressScore >= 7 ? 8 : 12, 0.7m, 90)
        };
    }

    private static int GetAdjustedReps(int baseReps, int weekNumber, string goal)
    {
        if (weekNumber == 3 && goal == "strength")
        {
            return Math.Max(3, baseReps - 1);
        }

        if (weekNumber == 4)
        {
            return goal == "strength" ? Math.Max(3, baseReps) : Math.Max(8, baseReps - 2);
        }

        return baseReps;
    }

    private static decimal CalculateTargetWeight(
        IDictionary<string, decimal> mainLifts,
        IEnumerable<PersonalRecordHistory> personalRecords,
        ExerciseBlueprint exercise,
        decimal intensity)
    {
        if (exercise.TrainingMaxFactor <= 0)
        {
            return 0;
        }

        var fromRequest = ResolveOneRepMax(mainLifts, exercise.MainLiftKey);
        var fromDb = personalRecords
            .Where(x => string.Equals(x.ExerciseId, exercise.ExerciseId, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(x => x.AchievedDate)
            .Select(x => x.WeightKg)
            .FirstOrDefault();
        var oneRepMax = fromDb > 0 ? fromDb : fromRequest;
        var rawWeight = oneRepMax * exercise.TrainingMaxFactor * intensity;

        return RoundToNearest(rawWeight, 2.5m);
    }

    private static decimal ResolveOneRepMax(IDictionary<string, decimal> mainLifts, string key)
    {
        if (mainLifts.TryGetValue(key, out var exact) && exact > 0)
        {
            return exact;
        }

        var lowerKey = Normalize(key);
        var matching = mainLifts.FirstOrDefault(x => Normalize(x.Key) == lowerKey);
        if (matching.Value > 0)
        {
            return matching.Value;
        }

        return key switch
        {
            "squat" => 100m,
            "bench" => 80m,
            "deadlift" => 120m,
            "overheadPress" => 50m,
            _ => 60m
        };
    }

    private static ExerciseBlueprint ApplyEquipmentSubstitution(ExerciseBlueprint exercise, List<string> equipment)
    {
        var normalizedEquipment = equipment.Select(Normalize).ToHashSet();
        if (normalizedEquipment.Count == 0 || normalizedEquipment.Contains(Normalize(exercise.Equipment)))
        {
            return exercise;
        }

        return exercise.Equipment switch
        {
            "Machine" when normalizedEquipment.Contains("dumbbell") =>
                exercise with
                {
                    ExerciseId = $"{exercise.ExerciseId}_db_alt",
                    Name = exercise.Name switch
                    {
                        "Lat Pulldown" => "One-arm Dumbbell Row",
                        "Seated Cable Row" => "Chest-supported Dumbbell Row",
                        "Triceps Pushdown" => "Dumbbell Skull Crusher",
                        "Lying Leg Curl" => "Dumbbell Leg Curl",
                        "Standing Calf Raise" => "Dumbbell Standing Calf Raise",
                        "Face Pull" => "Rear Delt Fly",
                        _ => exercise.Name
                    },
                    Equipment = "Dumbbell"
                },
            "Machine" when normalizedEquipment.Contains("barbell") =>
                exercise with
                {
                    ExerciseId = $"{exercise.ExerciseId}_barbell_alt",
                    Name = exercise.Name == "Leg Press" ? "Front Squat" : exercise.Name,
                    Equipment = "Barbell"
                },
            _ => exercise
        };
    }

    private static decimal GetLimitationAdjustment(List<string> limitations, string focusArea)
    {
        var normalized = limitations.Select(Normalize).ToHashSet();

        if (normalized.Contains("lower_back_fatigue") && FocusContains(focusArea, "Lower", "Pull", "Legs"))
        {
            return 0.92m;
        }

        if (normalized.Contains("shoulder_pain") && FocusContains(focusArea, "Upper", "Push"))
        {
            return 0.9m;
        }

        if (normalized.Contains("knee_pain") && FocusContains(focusArea, "Lower", "Legs"))
        {
            return 0.9m;
        }

        return 1m;
    }

    private static string BuildExerciseNote(
        ExerciseBlueprint exercise,
        decimal cnsAdjustment,
        decimal limitationAdjustment)
    {
        var notes = new List<string>();

        if (exercise.TrainingMaxFactor <= 0)
        {
            notes.Add("Bodyweight");
        }

        if (cnsAdjustment < 1m)
        {
            notes.Add("CNS deload");
        }

        if (limitationAdjustment < 1m)
        {
            notes.Add("Limitation adjusted");
        }

        return notes.Count == 0 ? "Standard" : string.Join(", ", notes);
    }

    private static List<WeekProfile> GetWeekProfiles()
    {
        return new()
        {
            new WeekProfile(1, "Base volume", "Khoi tao volume nen, RPE 7", 1m, 1m, 7m),
            new WeekProfile(2, "Volume overload", "Tang volume nhe va giu ky thuat on dinh", 1.08m, 1.03m, 7.5m),
            new WeekProfile(3, "Peak intensity", "Tang intensity, giam bien do loi tap", 1.12m, 1.06m, 8m),
            new WeekProfile(4, "Deload", "Giam tai de hoi phuc CNS", 0.72m, 0.88m, 6m)
        };
    }

    private static decimal GetLevelVolumeMultiplier(string level)
    {
        return level switch
        {
            "beginner" => 0.82m,
            "advanced" => 1.15m,
            _ => 1m
        };
    }

    private static int GetCnsThreshold(string level, DailyCnsStatus? latestCns)
    {
        var baseThreshold = level switch
        {
            "beginner" => 20,
            "advanced" => 30,
            _ => 25
        };

        if (latestCns == null)
        {
            return baseThreshold;
        }

        return latestCns.ReadinessScore switch
        {
            <= 4 => baseThreshold - 5,
            >= 8 => baseThreshold + 3,
            _ => baseThreshold
        };
    }

    private static void NormalizeRequest(WorkoutPlanGenerationRequest request)
    {
        request.MainLifts ??= new Dictionary<string, decimal>();
        request.Limitations ??= new List<string>();
        request.Equipment ??= new List<string>();
        request.Goal = string.IsNullOrWhiteSpace(request.Goal) ? "Hypertrophy" : request.Goal;
        request.FitnessLevel = string.IsNullOrWhiteSpace(request.FitnessLevel) ? "Intermediate" : request.FitnessLevel;
        request.DaysPerWeek = Math.Clamp(request.DaysPerWeek, 2, 6);
    }

    private static decimal Clamp(decimal value, decimal min, decimal max)
    {
        return Math.Min(Math.Max(value, min), max);
    }

    private static decimal RoundToNearest(decimal value, decimal nearest)
    {
        return Math.Round(value / nearest, MidpointRounding.AwayFromZero) * nearest;
    }

    private static bool FocusContains(string focusArea, params string[] values)
    {
        return values.Any(value => focusArea.Contains(value, StringComparison.OrdinalIgnoreCase));
    }

    private static string ResolveMainLiftKey(string exerciseId)
    {
        var normalized = Normalize(exerciseId);

        if (normalized.Contains("squat") || normalized.Contains("leg") || normalized.Contains("lunge"))
        {
            return "squat";
        }

        if (normalized.Contains("deadlift") || normalized.Contains("row") || normalized.Contains("pull"))
        {
            return "deadlift";
        }

        if (normalized.Contains("overhead") || normalized.Contains("shoulder"))
        {
            return "overheadPress";
        }

        return "bench";
    }

    private static string ResolveMuscleGroup(string exerciseId, string fallback)
    {
        var normalized = Normalize(exerciseId);

        if (normalized.Contains("squat") || normalized.Contains("leg") || normalized.Contains("lunge"))
        {
            return "Legs";
        }

        if (normalized.Contains("row") || normalized.Contains("pull") || normalized.Contains("deadlift"))
        {
            return "Back";
        }

        if (normalized.Contains("press") || normalized.Contains("bench"))
        {
            return "Chest";
        }

        return fallback;
    }

    private static string Normalize(string value)
    {
        return value
            .Trim()
            .Replace("-", "_", StringComparison.Ordinal)
            .Replace(" ", "_", StringComparison.Ordinal)
            .ToLower(CultureInfo.InvariantCulture);
    }

    private static string ToTitle(string value)
    {
        var textInfo = CultureInfo.InvariantCulture.TextInfo;
        return textInfo.ToTitleCase(value.Replace("_", " ", StringComparison.Ordinal).ToLowerInvariant());
    }

    private static ExerciseBlueprint Exercise(
        string id,
        string name,
        string muscleGroup,
        string mainLiftKey,
        decimal trainingMaxFactor,
        int cnsStressScore,
        string equipment)
    {
        return new ExerciseBlueprint(id, name, muscleGroup, mainLiftKey, trainingMaxFactor, cnsStressScore, equipment);
    }

    private sealed record WeekProfile(
        int WeekNumber,
        string Focus,
        string Rule,
        decimal VolumeMultiplier,
        decimal IntensityMultiplier,
        decimal Rpe);

    private sealed record DayBlueprint(
        int DaySequence,
        string FocusArea,
        List<ExerciseBlueprint> Exercises);

    private sealed record ExerciseBlueprint(
        string ExerciseId,
        string Name,
        string MuscleGroup,
        string MainLiftKey,
        decimal TrainingMaxFactor,
        int CnsStressScore,
        string Equipment);

    private sealed record GoalVolume(
        int BaseSets,
        int BaseReps,
        decimal IntensityPercentage,
        int RestSeconds);
}
