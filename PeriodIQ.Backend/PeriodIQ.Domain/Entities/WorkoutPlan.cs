using System;
using System.Collections.Generic;
using PeriodIQ.Domain.Common;

namespace PeriodIQ.Domain.Entities;

/// <summary>
/// Bảng 7: Giáo án Chu Kỳ (Được sinh ra bởi Rule Engine)
/// </summary>
public class WorkoutPlan : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string TemplateId { get; set; } = string.Empty; // Base trên template nào
    
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    
    // Trạng thái: Active, Completed, Abandoned
    public string Status { get; set; } = "Active"; 
    
    public List<WeeklyPlan> Weeks { get; set; } = new();
}

public class WeeklyPlan
{
    public int WeekNumber { get; set; }
    // Khối lượng tổng cộng dự kiến trong tuần này (tính bằng kg)
    public decimal PlannedTotalVolume { get; set; }
    public List<DailyWorkout> Days { get; set; } = new();
}

public class DailyWorkout
{
    public DayOfWeek Day { get; set; }
    public string FocusArea { get; set; } = string.Empty;
    public List<ExerciseSet> Exercises { get; set; } = new();
}

public class ExerciseSet
{
    public string ExerciseId { get; set; } = string.Empty;
    public int Sets { get; set; }
    public int Reps { get; set; }
    
    // MỨC TẠ CỤ THỂ (Kg) - Đây là điểm khác biệt lớn nhất! Rule Engine đã tính ra chính xác số kg cho user.
    public decimal TargetWeightKg { get; set; }
    
    public int RestTimeInSeconds { get; set; }
}
