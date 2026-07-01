using System;
using System.Collections.Generic;

namespace PeriodIQ.Core.Models;

public class WorkoutPlanGenerationRequest
{
    public string TemplateId { get; set; } = string.Empty;
    public string Goal { get; set; } = "Hypertrophy";
    public string FitnessLevel { get; set; } = "Intermediate";
    public int DaysPerWeek { get; set; } = 4;
    public Dictionary<string, decimal> MainLifts { get; set; } = new();
    public List<string> Limitations { get; set; } = new();
    public List<string> Equipment { get; set; } = new() { "Barbell", "Dumbbell", "Machine", "Bodyweight" };
    public DateTime? StartDate { get; set; }
}
