using System;
using System.Collections.Generic;
using Amazon.DynamoDBv2.DataModel;
using PeriodIQ.Domain.Common;

namespace PeriodIQ.Domain.Entities;

/// <summary>
/// Bảng 8: Nhật ký Thực tập (Tracking)
/// Dữ liệu do User nhập vào sau buổi tập thực tế. Dùng để đối chiếu với WorkoutPlan dự kiến.
/// </summary>
[DynamoDBTable("WorkoutSessionLog")]
public class WorkoutSessionLog : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string WorkoutPlanId { get; set; } = string.Empty; // Thuộc giáo án nào
    
    public int WeekNumber { get; set; }
    public DayOfWeek Day { get; set; }
    
    public DateTime CompletedAt { get; set; }
    
    // Độ khó thực tế cảm nhận (RPE) của toàn buổi
    public decimal OverallSessionRpe { get; set; }
    
    // Chi tiết từng bài thực tập
    public List<SessionExerciseLog> PerformedExercises { get; set; } = new();
}

public class SessionExerciseLog
{
    public string ExerciseId { get; set; } = string.Empty;
    public int ActualSets { get; set; }
    public int ActualReps { get; set; }
    public decimal ActualWeightKg { get; set; }
    public bool FailedRep { get; set; } // Có bị rớt tạ (failure) không?
}
